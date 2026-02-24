import { Sport } from 'src/shared/constants/constants';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { InvitationStatus } from 'generated/prisma/enums';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class NotificationMetadataDto {
  @ApiProperty({
    description: 'Image URL for the notification',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    description: 'Action URL for the notification',
    example: 'https://example.com/action',
  })
  @IsString()
  @IsOptional()
  actionUrl?: string;

  @ApiProperty({
    description: 'Sender UID for the notification',
    example: '1234567890',
  })
  @IsString()
  @IsOptional()
  senderUid?: string;

  @ApiProperty({
    description: 'Session UID for the notification',
    example: '1234567890',
  })
  @IsString()
  @IsOptional()
  sessionUid?: string;

  @ApiProperty({
    description: 'Session sport for the notification',
    enum: Sport,
    example: Sport.BASKETBALL,
  })
  @IsEnum(Sport)
  @IsOptional()
  sessionSport?: Sport;

  @ApiProperty({
    description: 'Sender firstname for the notification',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  senderFirstname?: string;

  @ApiProperty({
    description: 'Sender lastname for the notification',
    example: 'Doe',
  })
  @IsString()
  @IsOptional()
  senderLastname?: string;

  @ApiProperty({
    description: 'Sender full name for the notification',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  senderName?: string;

  @ApiProperty({
    description: 'Sender avatar for the notification',
    example: 'https://example.com/avatar.jpg',
  })
  @IsString()
  @IsOptional()
  senderAvatar?: string;

  @ApiProperty({
    description: 'Session date for the notification',
    example: '2021-01-01',
  })
  @IsString()
  @IsOptional()
  sessionDate?: string;

  @ApiProperty({
    description: 'Session title for the notification',
    example: 'Session Title',
  })
  @IsString()
  @IsOptional()
  sessionTitle?: string;

  @ApiProperty({
    description: 'Message preview for the notification',
    example: 'Message Preview',
  })
  @IsString()
  @IsOptional()
  messagePreview?: string;

  @ApiProperty({
    description: 'Conversation UID for the notification',
    example: '1234567890',
  })
  @IsString()
  @IsOptional()
  conversationUid?: string;

  @ApiProperty({
    description: 'Invitation status for friend request',
    enum: InvitationStatus,
    example: InvitationStatus.PENDING,
  })
  @IsEnum(InvitationStatus)
  @IsOptional()
  invitationStatus?: InvitationStatus;
}

export class FriendRequestData extends PickType(NotificationMetadataDto, [
  'actionUrl',
  'senderUid',
  'senderFirstname',
  'senderLastname',
  'senderName',
  'senderAvatar',
  'invitationStatus',
]) {}

export class FriendAcceptedData extends PickType(NotificationMetadataDto, [
  'actionUrl',
  'senderUid',
  'senderFirstname',
  'senderLastname',
  'senderName',
  'senderAvatar',
]) {}

export class SessionInvitationData extends PickType(NotificationMetadataDto, [
  'actionUrl',
  'sessionUid',
  'sessionTitle',
  'sessionDate',
  'senderFirstname',
  'senderLastname',
  'senderName',
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
