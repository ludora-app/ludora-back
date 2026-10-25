import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { BaseFilterDto } from 'src/shared/dto/input/base-filter.dto';

export enum NotificationTypeFilter {
  SESSION = 'SESSION',
  FRIEND = 'FRIEND',
}

export class NotificationFilterDto extends BaseFilterDto {
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
