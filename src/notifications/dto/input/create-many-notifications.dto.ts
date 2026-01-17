import { CreateNotificationDto } from './create-notification.dto';

// DTO for broadcasting the same notification to multiple users (userUids : string[] instead of userUid : string)
export interface CreateManyNotificationsDto extends Omit<CreateNotificationDto, 'userUid'> {
  userUids: string[];
}
