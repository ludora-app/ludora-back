import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from 'generated/prisma/enums';
import { IsArray, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

/**
 * One notification payload for createMany (userUid is set from the connected user).
 */
export class CreateManyNotificationsItemDto {
  @IsString()
  @ApiProperty({ description: 'Notification title', example: 'New message' })
  title: string;

  @IsString()
  @ApiProperty({ description: 'Notification body/message', example: 'You have a new message' })
  message: string;

  @IsEnum(NotificationType)
  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  type: NotificationType;

  @IsOptional()
  @IsObject()
  @ApiProperty({ description: 'Optional metadata', required: false })
  metadata?: Record<string, unknown>;
}

/**
 * DTO for creating multiple notifications for the connected user.
 */
export class CreateManyNotificationsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateManyNotificationsItemDto)
  @ApiProperty({
    description: 'List of notifications to create for the current user',
    type: [CreateManyNotificationsItemDto],
  })
  notifications: CreateManyNotificationsItemDto[];
}
