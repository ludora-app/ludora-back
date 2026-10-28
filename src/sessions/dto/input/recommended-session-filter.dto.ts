import { ApiProperty, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { SESSION_RECOMMENDATION_CONFIG } from 'src/sessions/constants/session.constants';
import { SessionFilterDto } from './session-filter.dto';

/**
 * @description DTO for the sessions recommended from the user's sport and hour preferences
 */
export class RecommendedSessionFilterDto extends PickType(SessionFilterDto, [
  'cursor',
  'limit',
  'maxDistance',
  'userLat',
  'userLon',
]) {
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
  @ApiProperty({
    description: 'The uid of the user the sessions are recommended to',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
  })
  userUid: string;
}
