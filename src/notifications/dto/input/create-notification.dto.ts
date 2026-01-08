import { NotificationType } from 'generated/prisma/enums';
/**
 * DTO for creating a notification
 * Interface instead of class because we don't need class-validator decorators
 */
export interface CreateNotificationDto {
  title: string;
  metadata?: any;
  userUid: string;
  message: string;
  foreignUid?: string;
  type: NotificationType;
}
