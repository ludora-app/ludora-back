import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// DevOnly
export class SendPushNotificationDto {
  @ApiProperty({
    description: 'FCM token of the device to send the notification to',
    example: 'dGhpc2lzYWZha2V0b2tlbmZvcnRlc3Rpbmc...',
  })
  @IsString()
  @IsNotEmpty()
  fcmToken: string;

  @ApiProperty({
    description: 'Title of the notification',
    example: 'New Notification',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Body/message of the notification',
    example: 'You have a new message!',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    description: 'Optional data payload to send with the notification',
    example: { id: '123', type: 'message' },
    required: false,
  })
  @IsOptional()
  data?: Record<string, string>;
}
