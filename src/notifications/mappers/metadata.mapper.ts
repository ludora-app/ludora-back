import { plainToInstance } from 'class-transformer';
import { NotificationType } from 'generated/prisma/enums';

import {
  FriendAcceptedData,
  FriendRequestData,
  SessionInvitationData,
  SessionUpdatedData,
} from '../dto/input/notification-metadata.dto';

export class MetadataMapper {
  static toMetadata(
    type: NotificationType,
    data: Object,
  ): FriendRequestData | SessionInvitationData | SessionUpdatedData | FriendAcceptedData {
    if (!data) return null;
    switch (type) {
      case NotificationType.FRIEND_REQUEST:
        return plainToInstance(FriendRequestData, data);
      case NotificationType.FRIEND_ACCEPTED:
        return plainToInstance(FriendAcceptedData, data);
      case NotificationType.SESSION_INVITATION:
        return plainToInstance(SessionInvitationData, data);
      case NotificationType.SESSION_UPDATED:
        return plainToInstance(SessionUpdatedData, data);
      default:
        return data as any;
    }
  }
}
