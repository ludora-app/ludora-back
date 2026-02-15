import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum NotificationTypeFilter {
  SESSION = 'SESSION',
  FRIEND = 'FRIEND',
}

export class NotificationFilterDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Cursor for pagination',
    example: 'fcacfaca3c2a323bhf',
    required: false,
  })
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @ApiProperty({
    description: 'Limit of notifications to return',
    example: 10,
    required: false,
    type: Number,
  })
  limit?: number;

  @IsOptional()
  @IsEnum(NotificationTypeFilter)
  @ApiProperty({
    description: 'Type of notification to filter',
    enum: NotificationTypeFilter,
    example: NotificationTypeFilter.SESSION,
    required: false,
  })
  type?: NotificationTypeFilter;
}
