import { PinoLogger } from 'nestjs-pino';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationType } from 'generated/prisma/enums';
import { DevicesService } from 'src/devices/devices.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';

import { NotificationMetadata } from './dto/input/notification-metadata';
import { CreateNotificationDto } from './dto/input/create-notification.dto';
import { NotificationResponseData } from './dto/output/notification-response.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly firebaseService: FirebaseService,
    private readonly devicesService: DevicesService,
  ) {
    this.logger.setContext(NotificationsService.name);
  }
  /**
   * Get all receiver uids for a conversation
   * @param conversationUid
   * @param senderUid - the conversation member's userUid not to include in the result
   * @returns
   */
  async getReceiverUids(conversationUid: string, senderUid: string) {
    return await this.prisma.conversationMembers.findMany({
      select: {
        userUid: true,
      },
      where: {
        conversationUid,
        userUid: {
          not: senderUid,
        },
      },
    });
  }

  /**
   * Create a notification in the database
   */
  async create(data: CreateNotificationDto) {
    try {
      const notification = await this.prisma.notifications.create({
        data: {
          body: data.message,
          data: data.metadata || {},
          title: data.title,
          type: data.type,
          userUid: data.userUid,
        },
      });

      this.logger.info(`Notification created in DB: ${notification.uid} for user ${data.userUid}`);
      return notification;
    } catch (error) {
      this.logger.error(`Failed to create notification in DB: ${error.message}`, {
        data,
        error: error.stack,
      });
      throw error;
    }
  }

  /**
   * Send a push notification to the user via Firebase
   * @param data
   * @returns
   */
  async sendPushNotification(data: CreateNotificationDto) {
    try {
      //? notification persisted in the database
      const notification = await this.create(data);

      //? get all active FCM tokens for the user
      const tokens = await this.devicesService.getUserFcmTokens(data.userUid);

      if (tokens.length === 0) {
        this.logger.warn(`No FCM tokens found for user ${data.userUid}`);
        return notification;
      }

      //? build the Firebase payload
      const payload = this.buildFcmPayload(notification, data.metadata);

      //? send the notification via Firebase
      const response = await this.firebaseService.sendToMultipleTokens(tokens, {
        tokens,
        ...payload,
      });

      //? mark the notification as sent via push
      await this.prisma.notifications.update({
        data: { sentViaPush: true },
        where: { uid: notification.uid },
      });

      this.logger.debug(
        `Push notification sent: ${response.successCount}/${tokens.length} devices`,
        {
          notificationUid: notification.uid,
          type: data.type,
          userUid: data.userUid,
        },
      );

      return notification;
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`, {
        data,
        error: error.stack,
      });
      //? don't throw an error to not block the flow
      return null;
    }
  }

  private buildFcmPayload(
    notification: any,
    metadata?: NotificationMetadata,
  ): {
    notification: { title: string; body: string };
    data: Record<string, string>;
    android: any;
    apns: any;
  } {
    return {
      data: {
        actionUrl: metadata?.actionUrl || '',
        foreignUid: notification.foreignUid || '',
        notificationUid: notification.uid,
        type: notification.type,
        // Aplatir les metadata en strings pour FCM
        ...this.flattenMetadata(metadata),
      },
      notification: {
        body: notification.message,
        title: notification.title,
      },
      // Configuration Android
      android: {
        notification: {
          channelId: this.getAndroidChannelId(notification.type),
          sound: 'default',
          ...(metadata?.imageUrl && { imageUrl: metadata.imageUrl }),
        },
        priority: 'high' as const,
      },
      // Configuration iOS
      apns: {
        payload: {
          aps: {
            badge: 1, // Sera mis à jour dynamiquement
            sound: 'default',
            ...(metadata?.imageUrl && {
              'media-url': metadata.imageUrl,
              'mutable-content': 1,
            }),
          },
        },
      },
    };
  }

  /**
   * Déterminer le channel Android selon le type
   */
  private getAndroidChannelId(type: NotificationType): string {
    const channelMap = {
      [NotificationType.EMAIL_VERIFIED]: 'account',
      [NotificationType.FRIEND_ACCEPTED]: 'social',
      [NotificationType.FRIEND_REQUEST]: 'social',
      [NotificationType.GENERAL]: 'general',
      [NotificationType.NEW_MESSAGE]: 'messages',
      [NotificationType.SESSION_CANCELLED]: 'sessions',
      [NotificationType.SESSION_INVITATION]: 'sessions',
      [NotificationType.SESSION_REMINDER]: 'sessions',
      [NotificationType.SESSION_UPDATED]: 'sessions',
    };

    return channelMap[type] || 'default';
  }

  /**
   * Aplatir les metadata en Record<string, string> pour FCM
   */
  private flattenMetadata(metadata?: NotificationMetadata): Record<string, string> {
    if (!metadata) return {};

    return Object.entries(metadata).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
        }
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  /**
   * Find all notifications for a user
   * @param userUid
   * @param limit
   * @param offset
   * @returns
   */
  async findAllByUserUid(
    userUid: string,
    limit = 20,
    offset = 0,
  ): Promise<PaginatedDataDto<NotificationResponseData>> {
    const notifications = await this.prisma.notifications.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        body: true,
        createdAt: true,
        data: true,
        isRead: true,
        readAt: true,
        sentViaPush: true,
        title: true,
        type: true,
        uid: true,
        userUid: true,
      },
      skip: offset,
      take: limit,
      where: {
        userUid,
      },
    });

    let nextCursor: string | null = null;
    if (notifications.length > limit) {
      const nextItem = notifications.pop();
      nextCursor = nextItem!.uid;
    }

    return {
      items: notifications,
      nextCursor,
      totalCount: notifications.length,
    };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(uid: string, userUid: string): Promise<void> {
    await this.prisma.notifications.update({
      data: {
        isRead: true,
        readAt: new Date(),
      },
      where: { uid, userUid },
    });
    this.logger.debug(`Notification marked as read: ${uid} for user ${userUid}`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userUid: string): Promise<void> {
    await this.prisma.notifications.updateMany({
      data: {
        isRead: true,
        readAt: new Date(),
      },
      where: {
        isRead: false,
        userUid,
      },
    });
    this.logger.debug(`All notifications marked as read for user ${userUid}`);
  }

  /**
   * Count unread notifications
   */
  async getUnreadCount(userUid: string): Promise<number> {
    return this.prisma.notifications.count({
      where: {
        isRead: false,
        userUid,
      },
    });
  }

  /**
   * Delete a notification
   */
  async delete(uid: string, userUid: string): Promise<void> {
    await this.prisma.notifications.delete({
      where: { uid, userUid },
    });
    this.logger.debug(`Notification deleted: ${uid} for user ${userUid}`);
  }
}
