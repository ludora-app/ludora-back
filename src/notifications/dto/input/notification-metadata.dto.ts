import { IsEnum, IsString } from 'class-validator';
import { Sport } from 'src/shared/constants/constants';
import { ApiProperty, PickType } from '@nestjs/swagger';

export class NotificationMetadataDto {
  @ApiProperty({
    description: 'Image URL for the notification',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  imageUrl: string;

  @ApiProperty({
    description: 'Action URL for the notification',
    example: 'https://example.com/action',
  })
  @IsString()
  actionUrl: string;

  @ApiProperty({
    description: 'Sender UID for the notification',
    example: '1234567890',
  })
  @IsString()
  senderUid: string;

  @ApiProperty({
    description: 'Session UID for the notification',
    example: '1234567890',
  })
  @IsString()
  sessionUid: string;

  @ApiProperty({
    description: 'Session sport for the notification',
    enum: Sport,
    example: Sport.BASKETBALL,
  })
  @IsEnum(Sport)
  sessionSport: Sport;

  @ApiProperty({
    description: 'Sender firstname for the notification',
    example: 'John',
  })
  @IsString()
  senderFirstname: string;
  @IsString()
  senderLastname: string;

  @ApiProperty({
    description: 'Sender lastname for the notification',
    example: 'Doe',
  })
  @IsString()
  @ApiProperty({
    description: 'Session date for the notification',
    example: '2021-01-01',
  })
  @IsString()
  sessionDate: string;

  @ApiProperty({
    description: 'Sender avatar for the notification',
    example: 'https://example.com/avatar.jpg',
  })
  @IsString()
  senderAvatar: string;

  @ApiProperty({ description: 'Session title for the notification', example: 'Session Title' })
  @IsString()
  sessionTitle: string;

  @ApiProperty({ description: 'Message preview for the notification', example: 'Message Preview' })
  @IsString()
  messagePreview: string;
}

export class FriendRequestData extends PickType(NotificationMetadataDto, [
  'actionUrl',
  'senderUid',
  'senderFirstname',
  'senderLastname',
  'senderAvatar',
]) {}

export class SessionInvitationData extends PickType(NotificationMetadataDto, [
  'actionUrl',
  'sessionUid',
  'sessionTitle',
  'sessionDate',
  'senderFirstname',
  'senderLastname',
  'sessionSport',
  'senderAvatar',
  'senderUid',
]) {}

export class SessionUpdatedData extends PickType(NotificationMetadataDto, [
  'actionUrl',
  'sessionUid',
  'sessionTitle',
  'sessionDate',
]) {}
