import { UseGuards } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { NotificationType } from 'generated/prisma/enums';
import { PinoLogger } from 'nestjs-pino';
import { Server, Socket } from 'socket.io';
import { WebSocketAuthGuard } from 'src/auth/guards/websocket-auth.guard';
import { WebSocketAuthService } from 'src/auth/services/websocket-auth.service';

import { EventTypes } from './constants/event.types';
import { NotificationMetadata } from './dto/input/notification-metadata';
import { SessionInvitationData } from './dto/input/notification-metadata.dto';
import { NotificationEventDto } from './dto/notification-event.dto';
import { NotificationsService } from './notifications.service';

/**
 * NotificationsGateway handles real-time notifications using Socket.io
 * - Uses JWT authentication for secure connections
 * - Hybrid approach: Socket.io for connected users, Firebase Push for offline users
 * - Persists all notifications in database
 */
@WebSocketGateway({
  cors: {
    credentials: true,
    origin: '*',
  },
})
@UseGuards(WebSocketAuthGuard)
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track connected users for hybrid delivery
  private connectedUsers = new Map<string, Set<string>>(); // userUid -> Set of socketIds

  constructor(
    private readonly logger: PinoLogger,
    private readonly webSocketAuthService: WebSocketAuthService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.logger.setContext(NotificationsGateway.name);
  }

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(@ConnectedSocket() client: Socket): Promise<void> {
    try {
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

      // Track connected user
      if (!this.connectedUsers.has(userUid)) {
        this.connectedUsers.set(userUid, new Set());
      }
      this.connectedUsers.get(userUid)?.add(client.id);

      this.logger.debug(
        `User ${userUid} connected to notifications (socket: ${client.id}, total sockets: ${this.connectedUsers.get(userUid)?.size})`,
      );

      // Send unread count on connection
      const unreadCount = await this.notificationsService.getUnreadCount(userUid);

      client.emit('connected', {
        message: 'Successfully connected to notifications',
        unreadCount,
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
   */
  handleDisconnect(@ConnectedSocket() client: Socket): void {
    const userUid = client.data.userUid;

    if (userUid) {
      // Remove socket from tracking
      const userSockets = this.connectedUsers.get(userUid);
      if (userSockets) {
        userSockets.delete(client.id);

        // Remove user entirely if no more sockets
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userUid);
          this.logger.debug(`User ${userUid} fully disconnected (last socket: ${client.id})`);
        } else {
          this.logger.debug(
            `User ${userUid} socket ${client.id} disconnected (${userSockets.size} remaining)`,
          );
        }
      }
    } else {
      this.logger.debug(`Unauthenticated socket ${client.id} disconnected`);
    }
  }

  /**
   * Check if a user is currently connected via WebSocket
   */
  private isUserConnected(userUid: string): boolean {
    return this.connectedUsers.has(userUid) && this.connectedUsers.get(userUid)?.size > 0;
  }

  /**
   * HYBRID DELIVERY: Send via Socket OR Firebase Push
   * - If user connected → Send via Socket.io (real-time)
   * - If user disconnected → Send via Firebase Push + persist
   */
  private async sendNotification(payload: {
    userUid: string;
    type: NotificationType;
    title: string;
    message: string;
    foreignUid?: string;
    metadata?: NotificationMetadata;
    data?: Record<string, any>; // Legacy pour compatibilité
  }) {
    const { data, foreignUid, message, metadata, title, type, userUid } = payload;

    try {
      // Merge metadata et data (legacy)
      const enrichedMetadata = {
        ...metadata,
        ...data,
      };

      const notification = await this.notificationsService.create({
        message,
        metadata: enrichedMetadata,
        title,
        type,
        userUid,
      });

      if (this.isUserConnected(userUid)) {
        // User is connected → Send via Socket.io (real-time)
        const userRoom = `user:${userUid}`;
        this.server.to(userRoom).emit('notification', {
          data: enrichedMetadata,
          message,
          timestamp: notification.createdAt,
          title,
          type,
        });

        this.logger.debug(`✓ Socket notification sent to ${userUid} - ${type}`);
      } else {
        // User is offline → Push only for certain types (notification already persisted above)
        const pushAllowedTypes: NotificationType[] = [
          NotificationType.FRIEND_REQUEST,
          NotificationType.FRIEND_ACCEPTED,
          NotificationType.SESSION_INVITATION,
          NotificationType.NEW_MESSAGE,
          NotificationType.MESSAGE_DELETED,
        ];
        if (pushAllowedTypes.includes(type)) {
          await this.notificationsService.sendPushNotification({
            foreignUid,
            message,
            metadata: enrichedMetadata,
            notificationUid: notification.uid,
            title,
            type,
            userUid,
          });
          this.logger.debug(`✓ Push notification sent to ${userUid} - ${type}`);
        } else {
          this.logger.debug(`Push skipped for ${userUid} - ${type} (not in pushAllowedTypes)`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to send notification to ${userUid}: ${error.message}`, {
        error: error.stack,
        payload,
      });
    }
  }

  /**
   * Event listener for generic notification.send events
   */
  @OnEvent(EventTypes.NOTIFICATION_SEND)
  async handleNotificationSend(payload: NotificationEventDto): Promise<void> {
    await this.sendNotification({
      data: payload.data,
      message: payload.message,
      title: payload.title,
      type: payload.type,
      userUid: payload.userId,
    });
  }

  /**
   * Event listener for notification.broadcast events
   */
  @OnEvent(EventTypes.NOTIFICATION_BROADCAST)
  handleNotificationBroadcast(payload: {
    type: NotificationType;
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

      this.logger.debug(`Broadcast notification sent - Type: ${type}, Title: ${title}`);
    } catch (error) {
      this.logger.error(`Error broadcasting notification: ${error.message}`);
    }
  }

  /**
   * Event listener for notification.sendToMultiple events
   */
  @OnEvent(EventTypes.NOTIFICATION_SEND_TO_MULTIPLE)
  async handleNotificationSendToMultiple(payload: {
    userIds: string[];
    type: NotificationType;
    title: string;
    message: string;
    foreignUid?: string;
    metadata?: any;
    data?: Record<string, any>;
  }): Promise<void> {
    try {
      const { data, foreignUid, message, metadata, title, type, userIds } = payload;

      // Send to each user with hybrid logic
      for (const userUid of userIds) {
        await this.sendNotification({
          data,
          foreignUid,
          message,
          metadata,
          title,
          type,
          userUid,
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
   * FRIEND_REQUEST: Send via hybrid delivery
   */
  @OnEvent(EventTypes.FRIEND_REQUEST)
  async handleFriendRequestNotification(payload: {
    recipientId: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
  }): Promise<void> {
    await this.sendNotification({
      foreignUid: payload.senderId,
      message: `${payload.senderName} t'a envoyé une demande d'ami`,
      metadata: {
        actionUrl: 'app://notifications',
        senderAvatar: payload.senderAvatar,
        senderName: payload.senderName,
        senderUid: payload.senderId,
      },
      title: "Nouvelle demande d'ami",
      type: NotificationType.FRIEND_REQUEST,
      userUid: payload.recipientId,
    });
  }

  /**
   * FRIEND_ACCEPTED: Send via hybrid delivery
   */
  @OnEvent(EventTypes.FRIEND_ACCEPTED)
  async handleFriendAcceptedNotification(payload: {
    recipientUid: string;
    senderUid: string;
    senderName: string;
    senderAvatar?: string;
  }): Promise<void> {
    await this.sendNotification({
      foreignUid: payload.senderUid,
      message: `${payload.senderName} a accepté ta demande d'ami`,
      metadata: {
        actionUrl: `app://profil/${payload.senderUid}`,
        senderAvatar: payload.senderAvatar,
        senderName: payload.senderName,
        senderUid: payload.senderUid,
      },
      title: "Demande d'ami acceptée",
      type: NotificationType.FRIEND_ACCEPTED,
      userUid: payload.recipientUid,
    });
  }

  /**
   * SESSION_INVITATION: Send via hybrid delivery
   */
  @OnEvent(EventTypes.SESSION_INVITATION)
  async handleSessionInvitationNotification(
    payload: Omit<SessionInvitationData, 'actionUrl'>,
    receiverUid: string,
  ): Promise<void> {
    const sportName = payload.sessionSport ? payload.sessionSport.toLowerCase() : '';
    await this.sendNotification({
      foreignUid: payload.sessionUid,
      message: `${payload.senderFirstname} ${payload.senderLastname} t'a invité à rejoindre une session de ${sportName}`,
      metadata: {
        actionUrl: `app://session/${payload.sessionUid}`,
        senderAvatar: payload.senderAvatar,
        senderFirstname: payload.senderFirstname,
        senderLastname: payload.senderLastname,
        senderUid: payload.senderUid,
        sessionDate: payload.sessionDate,
        sessionSport: payload.sessionSport,
        sessionTitle: payload.sessionTitle,
        sessionUid: payload.sessionUid,
      },
      title: 'Tu as été invité à une session',
      type: NotificationType.SESSION_INVITATION,
      userUid: receiverUid,
    });
  }

  /**
   * EMAIL_VERIFIED: Send via hybrid delivery
   */
  @OnEvent(EventTypes.EMAIL_VERIFIED)
  async handleEmailVerified(payload: { userUid: string }): Promise<void> {
    await this.sendNotification({
      message: 'Ton e-mail a été vérifié avec succès',
      metadata: {
        actionUrl: 'app://profile',
      },
      title: 'E-mail vérifié',
      type: NotificationType.EMAIL_VERIFIED,
      userUid: payload.userUid,
    });
  }

  /**
   * NEW_MESSAGE: Send to multiple recipients via hybrid delivery
   */
  @OnEvent(EventTypes.NEW_MESSAGE)
  async handleNewMessage(payload: {
    content: string;
    conversationUid: string;
    notificationTitle: string;
    senderUid: string;
    senderName?: string;
    senderAvatar?: string;
    sessionUid?: string;
  }): Promise<void> {
    try {
      const {
        content,
        conversationUid,
        notificationTitle,
        senderAvatar,
        senderName,
        senderUid,
        sessionUid,
      } = payload;

      // Get all conversation members except sender
      const receiverUids = await this.notificationsService.getReceiverUids(
        conversationUid,
        senderUid,
      );

      const isGroupConversation = !!sessionUid;

      for (const receiver of receiverUids) {
        const unreadCount = await this.notificationsService.getUnreadMessagesCount(
          receiver.userUid,
          conversationUid,
        );

        const displayedTitle =
          unreadCount > 1 ? `${notificationTitle} (${unreadCount})` : notificationTitle;

        await this.sendNotification({
          foreignUid: conversationUid,
          message: content,
          metadata: {
            actionUrl: `app://chat-room/${conversationUid}`,
            conversationUid,
            senderAvatar,
            senderName,
            senderUid,
          },
          title: isGroupConversation ? 'Nouveau message dans une conversation' : displayedTitle,
          type: NotificationType.NEW_MESSAGE,
          userUid: receiver.userUid,
        });
      }

      this.logger.debug(
        `New message notification sent to ${receiverUids.length} recipients in conversation ${conversationUid}`,
      );
    } catch (error) {
      this.logger.error(`Error sending new message notification: ${error.message}`, {
        error: error.stack,
        payload,
      });
    }
  }

  /**
   * @description Sends a notification to the session creator when a is added to his session
   */
  @OnEvent(EventTypes.SESSION_PLAYER_ADDED)
  async handleSessionPlayerAdded(payload: {
    sessionUid: string;
    playerUid: string;
    playerFirstname: string;
    playerLastname: string;
    playerAvatar?: string;
    creatorUid: string;
  }): Promise<void> {
    const content = `${payload.playerFirstname} ${payload.playerLastname} a rejoint ta session`;
    await this.sendNotification({
      foreignUid: payload.sessionUid,
      message: content,
      metadata: {
        actionUrl: `app://sessions/${payload.sessionUid}`,
        senderAvatar: payload.playerAvatar,
        senderFirstname: payload.playerFirstname,
        senderLastname: payload.playerLastname,
        senderUid: payload.playerUid,
      },
      title: 'Nouveau joueur',
      type: NotificationType.SESSION_PLAYER_ADDED,
      userUid: payload.creatorUid,
    });
  }
  /**
   * MESSAGE_DELETED: Update or "clear" notification when a message is deleted
   */
  @OnEvent(EventTypes.MESSAGE_DELETED)
  async handleMessageDeleted(payload: {
    conversationUid: string;
    messageUid: string;
    senderName?: string;
    sessionUid?: string;
    userUid: string; // The deleter
  }): Promise<void> {
    try {
      const { conversationUid, senderName, sessionUid, userUid } = payload;

      const receiverUids = await this.notificationsService.getReceiverUids(
        conversationUid,
        userUid,
      );

      const isGroupConversation = !!sessionUid;
      const notificationTitle = `${senderName} t'a envoyé un message`;
      const displayedTitle = isGroupConversation
        ? 'Nouveau message dans une conversation'
        : notificationTitle;

      for (const receiver of receiverUids) {
        await this.sendNotification({
          foreignUid: conversationUid,
          message: 'Ce message a été supprimé',
          metadata: {
            conversationUid,
            isDeleted: true,
            messageUid: payload.messageUid,
          },
          title: displayedTitle,
          type: NotificationType.MESSAGE_DELETED,
          userUid: receiver.userUid,
        });
      }
    } catch (error) {
      this.logger.error(`Error handling message deletion notification: ${error.message}`);
    }
  }
}
