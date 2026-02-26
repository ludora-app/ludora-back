import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { NotificationType } from 'generated/prisma/enums';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';

import {
  FriendAcceptedData,
  FriendRequestData,
  SessionInvitationData,
  SessionUpdatedData,
} from '../input/notification-metadata.dto';

export class NotificationResponseData {
  @ApiProperty({
    description: 'uid of the notification',
    example: 'cm7hvgonx0000to0mh5maqajc',
  })
  readonly uid: string;

  @ApiProperty({
    description: 'title of the notification',
    example: 'Notification Title',
  })
  readonly title: string;

  @ApiProperty({
    description: 'body of the notification',
    example: 'Notification Body',
  })
  readonly body: string;

  @ApiProperty({
    description: 'metadata of the notification',
    oneOf: [
      { $ref: getSchemaPath(FriendRequestData) },
      { $ref: getSchemaPath(SessionInvitationData) },
      { $ref: getSchemaPath(SessionUpdatedData) },
      { $ref: getSchemaPath(FriendAcceptedData) },
    ],
  })
  readonly metadata:
    | FriendRequestData
    | SessionInvitationData
    | SessionUpdatedData
    | FriendAcceptedData;

  @ApiProperty({
    description: 'created at of the notification',
    example: '2025-01-01T00:00:00.000Z',
  })
  readonly createdAt: Date;

  @ApiProperty({
    description: 'read at of the notification',
    example: '2025-01-01T00:00:00.000Z',
  })
  readonly readAt: Date;

  @ApiProperty({ description: 'is read of the notification', example: true })
  readonly isRead: boolean;

  @ApiProperty({
    description: 'is sent via push of the notification',
    example: true,
  })
  readonly sentViaPush: boolean;

  @ApiProperty({
    description: 'type of the notification',
    enum: NotificationType,
    example: NotificationType.FRIEND_REQUEST,
  })
  readonly type: NotificationType;
}

export class NotificationResponseDto extends ResponseTypeDto<NotificationResponseData> {
  @ApiProperty({ type: NotificationResponseData })
  readonly data: NotificationResponseData;
}

export const PaginatedNotificationResponse = toPaginationResponseType(NotificationResponseData);
