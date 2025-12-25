import { JwtService } from '@nestjs/jwt';
import { PinoLogger } from 'nestjs-pino';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
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
 * - Uses JWT authentication for secure connections
 * - Implements event-driven architecture with @nestjs/event-emitter
 */
@WebSocketGateway({
  cors: {
    credentials: true,
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(NotificationsGateway.name);
  }

  /**
   * Handle new WebSocket connection
   * - Authenticates the user via JWT token
   * - Joins user to their personal notification room (user:{userId})
   */
  async handleConnection(@ConnectedSocket() client: Socket): Promise<void> {
    try {
      this.logger.info('client', client);
      this.logger.debug(`Notification connection attempt from client ${client.id}`);
      const token = client.handshake.auth.token as string;

      if (!token) {
        this.logger.warn(`Notification connection rejected: No token provided`);
        client.emit('error', {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        });
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);
      const userUid = payload.uid;

      if (!userUid) {
        throw new UnauthorizedException('Invalid token: user uid missing');
      }

      // Verify token exists in database
      const tokenRecord = await this.prisma.userTokens.findFirst({
        where: {
          token,
          userUid,
        },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Token expired or invalid');
      }

      // Attach user information to socket
      client.data.userUid = userUid;

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
      this.logger.error(`Notification connection error: ${error.message}`);
      client.emit('error', {
        code: 'AUTH_FAILED',
        message: 'Authentication failed',
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
}
