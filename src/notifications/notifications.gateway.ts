import { PinoLogger } from 'nestjs-pino';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from 'src/prisma/prisma.service';
import { WebSocketAuthGuard } from 'src/auth/guards/websocket-auth.guard';
import { WebSocketAuthService } from 'src/auth/services/websocket-auth.service';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { NotificationEventDto } from './dto/notification-event.dto';

/**
 * NotificationsGateway handles real-time notifications using Socket.io
 * - Uses JWT authentication for secure connections (via WsAuthGuard)
 * - Implements event-driven architecture with @nestjs/event-emitter
 */
@WebSocketGateway({
  cors: {
    credentials: true,
    origin: '*',
  },
  namespace: '/notifications',
})
@UseGuards(WebSocketAuthGuard)
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly webSocketAuthService: WebSocketAuthService,
  ) {
    this.logger.setContext(NotificationsGateway.name);
  }

  /**
   * Handle new WebSocket connection
   * - Authentication is handled by WsAuthGuard (if guard executes) or manually here
   * - Joins user to their personal notification room (user:{userId})
   */
  async handleConnection(@ConnectedSocket() client: Socket): Promise<void> {
    try {
      // If guard didn't execute (common issue with OnGatewayConnection), authenticate manually
      let userUid = client.data.userUid;
      if (!userUid) {
        this.logger.debug(
          `Guard didn't set userUid, authenticating manually for client ${client.id}`,
        );
        try {
          await this.webSocketAuthService.authenticateSocket(client);
          userUid = client.data.userUid;
          if (!userUid) {
            throw new Error('Authentication succeeded but userUid not set');
          }
          this.logger.debug(`Manual authentication successful for user ${userUid}`);
        } catch (authError) {
          this.logger.error(`Authentication failed: ${authError.message}`, {
            clientId: client.id,
          });
          client.emit('error', {
            code: 'AUTH_FAILED',
            message: authError.message || 'Authentication failed',
          });
          client.disconnect();
          return;
        }
      }

      this.logger.debug(`Notification connection for authenticated user ${userUid}`);

      // Join personal notification room
      const userRoom = `user:${userUid}`;
      await client.join(userRoom);

      this.logger.info(`User ${userUid} connected to notifications (socket: ${client.id})`);

      // Notify user of successful connection
      client.emit('connected', {
        message: 'Successfully connected to notifications',
        userUid,
      });
    } catch (error) {
      this.logger.error(`Notification connection error: ${error.message}`, {
        error: error.stack,
      });
      client.emit('error', {
        code: 'CONNECTION_FAILED',
        message: 'Connection failed',
      });
      client.disconnect();
    }
  }

  /**
   * Handle WebSocket disconnection
   * - Socket.io automatically removes the socket from all rooms
   * - No manual cleanup needed (stateless design)
   */
  handleDisconnect(@ConnectedSocket() client: Socket): void {
    const userUid = client.data.userUid;
    if (userUid) {
      this.logger.info(`User ${userUid} disconnected from notifications (socket: ${client.id})`);
    } else {
      this.logger.info(`Unauthenticated socket ${client.id} disconnected from notifications`);
    }
  }

  /**
   * Event listener for notification.send events
   * - Listens to internal application events
   * - Sends notifications to specific users via their rooms
   *
   * Usage example:
   * this.eventEmitter.emit('notification.send', {
   *   userId: 'user-123',
   *   type: NotificationType.FRIEND_REQUEST,
   *   title: 'New Friend Request',
   *   message: 'John Doe sent you a friend request',
   *   data: { requestId: 'req-456' }
   * });
   */
  @OnEvent('notification.send')
  handleNotificationSend(payload: NotificationEventDto): void {
    try {
      const { data, message, title, type, userId } = payload;

      const userRoom = `user:${userId}`;

      // Send notification to user's room
      this.server.to(userRoom).emit('notification', {
        data,
        message,
        timestamp: new Date().toISOString(),
        title,
        type,
      });

      this.logger.debug(`Notification sent to user ${userId} - Type: ${type}, Title: ${title}`);
    } catch (error) {
      this.logger.error(`Error sending notification: ${error.message}`);
    }
  }

  /**
   * Event listener for notification.broadcast events
   * - Broadcasts notifications to all connected users
   *
   * Usage example:
   * this.eventEmitter.emit('notification.broadcast', {
   *   type: NotificationType.GENERAL,
   *   title: 'System Maintenance',
   *   message: 'The system will be under maintenance in 10 minutes',
   * });
   */
  @OnEvent('notification.broadcast')
  handleNotificationBroadcast(payload: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
  }): void {
    try {
      const { data, message, title, type } = payload;

      // Broadcast to all connected clients
      this.server.emit('notification', {
        data,
        message,
        timestamp: new Date().toISOString(),
        title,
        type,
      });

      this.logger.info(`Broadcast notification sent - Type: ${type}, Title: ${title}`);
    } catch (error) {
      this.logger.error(`Error broadcasting notification: ${error.message}`);
    }
  }

  /**
   * Event listener for notification.sendToMultiple events
   * - Sends notifications to multiple users at once
   *
   * Usage example:
   * this.eventEmitter.emit('notification.sendToMultiple', {
   *   userIds: ['user-1', 'user-2', 'user-3'],
   *   type: NotificationType.SESSION_REMINDER,
   *   title: 'Session Starting Soon',
   *   message: 'Your session starts in 30 minutes',
   *   data: { sessionId: 'session-123' }
   * });
   */
  @OnEvent('notification.sendToMultiple')
  handleNotificationSendToMultiple(payload: {
    userIds: string[];
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
  }): void {
    try {
      const { data, message, title, type, userIds } = payload;

      // Send to each user's room
      for (const userId of userIds) {
        const userRoom = `user:${userId}`;
        this.server.to(userRoom).emit('notification', {
          data,
          message,
          timestamp: new Date().toISOString(),
          title,
          type,
        });
      }

      this.logger.debug(
        `Notification sent to ${userIds.length} users - Type: ${type}, Title: ${title}`,
      );
    } catch (error) {
      this.logger.error(`Error sending notification to multiple users: ${error.message}`);
    }
  }

  /**
   * Event listener for friend request notifications
   * Specific event handler for friend requests
   */
  @OnEvent('friend.request.sent')
  handleFriendRequestNotification(payload: {
    recipientId: string;
    senderId: string;
    senderName: string;
    requestId: string;
  }): void {
    try {
      const { recipientId, requestId, senderName } = payload;

      const userRoom = `user:${recipientId}`;
      this.server.to(userRoom).emit('notification', {
        data: { requestId },
        message: `${senderName} sent you a friend request`,
        timestamp: new Date().toISOString(),
        title: 'New Friend Request',
        type: 'FRIEND_REQUEST',
      });

      this.logger.debug(`Friend request notification sent to user ${recipientId}`);
    } catch (error) {
      this.logger.error(`Error sending friend request notification: ${error.message}`);
    }
  }

  /**
   * Event listener for session invitation notifications
   */
  @OnEvent('session.invitation.sent')
  handleSessionInvitationNotification(payload: {
    recipientId: string;
    sessionName: string;
    sessionId: string;
    invitedBy: string;
  }): void {
    try {
      const { invitedBy, recipientId, sessionId, sessionName } = payload;

      const userRoom = `user:${recipientId}`;
      this.server.to(userRoom).emit('notification', {
        data: { sessionId },
        message: `${invitedBy} invited you to join "${sessionName}"`,
        timestamp: new Date().toISOString(),
        title: 'New Session Invitation',
        type: 'SESSION_INVITATION',
      });

      this.logger.debug(`Session invitation notification sent to user ${recipientId}`);
    } catch (error) {
      this.logger.error(`Error sending session invitation notification: ${error.message}`);
    }
  }

  @OnEvent('email.verified')
  handleEmailVerified(payload: { userUid: string }): void {
    try {
      const { userUid } = payload;
      this.logger.debug(`Received email.verified event for user ${userUid}`);

      const userRoom = `user:${userUid}`;
      this.server.to(userRoom).emit('email.verified', {
        message: 'Your email has been verified',
        timestamp: new Date().toISOString(),
        type: 'EMAIL_VERIFIED',
      });

      this.logger.info(`Email verified notification sent to user ${userUid} (room: ${userRoom})`);
    } catch (error) {
      this.logger.error(`Error sending email verified notification: ${error.message}`, {
        error: error.stack,
        payload,
      });
    }
  }
}
