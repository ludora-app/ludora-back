import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from 'generated/prisma/enums';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

export class NotificationResponseData {
  @ApiProperty({ description: 'uid of the notification', example: 'cm7hvgonx0000to0mh5maqajc' })
  readonly uid: string;

  @ApiProperty({ description: 'title of the notification', example: 'Notification Title' })
  readonly title: string;

  @ApiProperty({ description: 'body of the notification', example: 'Notification Body' })
  readonly body: string;

  @ApiProperty({ description: 'data of the notification', example: { key: 'value' } })
  readonly data: any;

  @ApiProperty({
    description: 'created at of the notification',
    example: '2025-01-01T00:00:00.000Z',
  })
  readonly createdAt: Date;

  @ApiProperty({ description: 'read at of the notification', example: '2025-01-01T00:00:00.000Z' })
  readonly readAt: Date;

  @ApiProperty({ description: 'is read of the notification', example: true })
  readonly isRead: boolean;

  @ApiProperty({ description: 'is sent via push of the notification', example: true })
  readonly sentViaPush: boolean;

  @ApiProperty({
    description: 'type of the notification',
    example: NotificationType.FRIEND_REQUEST,
  })
  readonly type: NotificationType;
}

export class NotificationResponseDto extends ResponseTypeDto<NotificationResponseData> {
  @ApiProperty({ type: NotificationResponseData })
  readonly data: NotificationResponseData;
}

export const PaginatedNotificationResponse = toPaginationResponseType(NotificationResponseData);
