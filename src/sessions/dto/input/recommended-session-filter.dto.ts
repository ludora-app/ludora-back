import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { SESSION_RECOMMENDATION_CONFIG } from 'src/sessions/constants/session.constants';
import { BaseFilterDto } from 'src/shared/dto/input/base-filter.dto';

/**
 * @description DTO for the sessions recommended from the user's sport and hour preferences
 */
export class RecommendedSessionFilterDto extends BaseFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({
    description: 'User latitude for location-based filtering',
    example: 48.8566,
    required: false,
  })
  userLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({
    description: 'User longitude for location-based filtering',
    example: 2.3522,
    required: false,
  })
  userLon?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({
    description: 'Maximum distance for location-based filtering (in km)',
    example: 30,
    required: false,
  })
  maxDistance?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(SESSION_RECOMMENDATION_CONFIG.MAX_DAYS)
  @ApiProperty({
    description: 'Number of days from now in which the sessions start',
    example: SESSION_RECOMMENDATION_CONFIG.DEFAULT_DAYS,
    required: false,
  })
  days?: number;
}

export class FindRecommendedSessionsDto extends RecommendedSessionFilterDto {
  userUid: string;
}
