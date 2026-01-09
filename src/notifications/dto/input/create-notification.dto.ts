import { NotificationType } from 'generated/prisma/enums';

import { NotificationMetadata } from './notification-metadata';
/**
 * DTO for creating a notification
 * Interface instead of class because we don't need class-validator decorators
 */
export interface CreateNotificationDto {
  title: string;
  userUid: string;
  message: string;
  foreignUid?: string;
  type: NotificationType;
  metadata?: NotificationMetadata;
}
