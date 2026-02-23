import { PinoLogger } from 'nestjs-pino';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationType } from 'generated/prisma/enums';
import { DevicesService } from 'src/devices/devices.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';

import { MetadataMapper } from './mappers/metadata.mapper';
import { NotificationMetadata } from './dto/input/notification-metadata';
import { CreateNotificationDto } from './dto/input/create-notification.dto';
import { SendPushNotificationDto } from './dto/input/send-push-notification.dto';
import { UnreadCountResponseData } from './dto/output/unread-count-response.dto';
import { NotificationResponseData } from './dto/output/notification-response.dto';
import { NotificationFilterDto, NotificationTypeFilter } from './dto/input/notification-filter.dto';

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
      //? get all active FCM tokens for the user
      const tokens = await this.devicesService.getUserFcmTokens(data.userUid);

      if (tokens.length === 0) {
        this.logger.warn(`No FCM tokens found for user ${data.userUid}`);
        return;
      }

      //? build the Firebase payload
      const payload = this.buildFcmPayload(data);

      //? send the notification via Firebase
      const response = await this.firebaseService.sendToMultipleTokens(tokens, {
        tokens,
        ...payload,
      });

      //? mark the notification as sent via push
      await this.prisma.notifications.update({
        data: { sentViaPush: true },
        where: { uid: data.notificationUid },
      });

      this.logger.debug(
        `Push notification sent: ${response.successCount}/${tokens.length} devices`,
        {
          notificationUid: data.notificationUid,
          type: data.type,
          userUid: data.userUid,
        },
      );

      return;
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`, {
        data,
        error: error.stack,
      });
      //? don't throw an error to not block the flow
      return null;
    }
  }

  /**
   * Send a simple push notification to a specific FCM token
   * This method does not persist the notification in the database
   * @param dto - Contains the FCM token and notification data
   */
  async sendPushNotificationByToken(dto: SendPushNotificationDto): Promise<void> {
    try {
      const payload = {
        data: dto.data || {},
        notification: {
          body: dto.body,
          title: dto.title,
        },
      } as any;

      await this.firebaseService.sendToToken(dto.fcmToken, payload);

      this.logger.info(
        `Simple push notification sent to token: ${dto.fcmToken.substring(0, 10)}...`,
      );
    } catch (error) {
      const errorCode = error?.code || 'unknown';
      const errorMessage = error?.message || 'Unknown error';

      this.logger.error(
        `Failed to send simple push notification. Error code: ${errorCode}, Message: ${errorMessage}`,
        {
          errorCode,
          errorMessage,
          fcmTokenPrefix: dto.fcmToken.substring(0, 10),
          stack: error.stack,
        },
      );

      // Fournir un message d'erreur plus explicite
      if (errorCode === 'messaging/registration-token-not-registered') {
        throw new Error(
          'FCM token is invalid or expired. The device may have uninstalled the app or the token is no longer valid.',
        );
      } else if (errorCode === 'messaging/invalid-registration-token') {
        throw new Error('FCM token format is invalid.');
      } else if (errorMessage.includes('Requested entity was not found')) {
        throw new Error(
          'FCM token not found. Please verify: 1) Token is valid, 2) Firebase project is correctly configured, 3) Token belongs to this Firebase project.',
        );
      }

      throw error;
    }
  }

  private buildFcmPayload(notification: CreateNotificationDto): {
    notification: { title: string; body: string };
    data: Record<string, string>;
    android: any;
    apns: any;
  } {
    return {
      data: {
        actionUrl: notification.metadata?.actionUrl || '',
        foreignUid: notification.foreignUid || '',
        notificationUid: notification.notificationUid,
        type: notification.type,
        // Aplatir les metadata en strings pour FCM
        ...this.flattenMetadata(notification.metadata),
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
          ...(notification.metadata?.imageUrl && { imageUrl: notification.metadata.imageUrl }),
        },
        priority: 'high' as const,
      },
      // Configuration iOS
      apns: {
        payload: {
          aps: {
            badge: 1, // Sera mis à jour dynamiquement
            sound: 'default',
            ...(notification.metadata?.imageUrl && {
              'media-url': notification.metadata.imageUrl,
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
    filters: NotificationFilterDto,
  ): Promise<PaginatedDataDto<NotificationResponseData>> {
    const { cursor, limit = 20, type } = filters;

    const query: {
      orderBy: { createdAt: 'desc' };
      select: {
        body: true;
        createdAt: true;
        data: true;
        isRead: true;
        readAt: true;
        sentViaPush: true;
        title: true;
        type: true;
        uid: true;
        userUid: true;
      };
      skip?: number;
      take?: number;
      where: { userUid: string };
      cursor?: {
        uid: string;
      };
    } = {
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
      where: { userUid },
    };

    if (type === NotificationTypeFilter.SESSION) {
      query.where['type'] = {
        in: [
          NotificationType.SESSION_INVITATION,
          NotificationType.SESSION_UPDATED,
          NotificationType.SESSION_CANCELLED,
          NotificationType.SESSION_REMINDER,
        ],
      };
    } else if (type === NotificationTypeFilter.FRIEND) {
      query.where['type'] = {
        in: [NotificationType.FRIEND_ACCEPTED, NotificationType.FRIEND_REQUEST],
      };
    } else {
      // By default, exclude message notifications from the "in-app" list
      query.where['type'] = {
        notIn: [NotificationType.NEW_MESSAGE, NotificationType.MESSAGE_DELETED],
      };
    }

    if (limit) {
      query.take = limit;
    }

    if (cursor) {
      query.cursor = {
        uid: cursor,
      };
      query.skip = 1;
    }

    const notifications = await this.prisma.notifications.findMany({
      ...query,
    });

    let nextCursor: string | null = null;
    if (notifications.length > limit) {
      const nextItem = notifications.pop();
      nextCursor = nextItem!.uid;
    }
    const items: NotificationResponseData[] = notifications.map((n) => {
      const { data, ...rest } = n;
      return {
        ...rest,
        metadata: MetadataMapper.toMetadata(n.type, (data ?? {}) as object),
      } as NotificationResponseData;
    });

    return {
      items,
      nextCursor,
      totalCount: items.length,
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
  async getUnreadCount(
    userUid: string,
    filters: NotificationFilterDto = {},
  ): Promise<UnreadCountResponseData> {
    const where: any = {
      isRead: false,
      userUid,
    };

    if (filters.type === NotificationTypeFilter.SESSION) {
      where.type = {
        in: [
          NotificationType.SESSION_INVITATION,
          NotificationType.SESSION_UPDATED,
          NotificationType.SESSION_CANCELLED,
          NotificationType.SESSION_REMINDER,
        ],
      };
    } else if (filters.type === NotificationTypeFilter.FRIEND) {
      where.type = {
        in: [NotificationType.FRIEND_ACCEPTED, NotificationType.FRIEND_REQUEST],
      };
    } else {
      // By default, exclude message notifications from the "in-app" count
      where.type = {
        notIn: [NotificationType.NEW_MESSAGE, NotificationType.MESSAGE_DELETED],
      };
    }

    const unreadCount = await this.prisma.notifications.count({
      where,
    });
    return { unreadCount };
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
