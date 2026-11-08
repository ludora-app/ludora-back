import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { GameModes } from 'generated/prisma/enums';
import { SessionSportLevel, Sport } from 'src/shared/constants/constants';
import { BaseFilterDto } from 'src/shared/dto/input/base-filter.dto';

/**
 * @description The session to find compatible players for. The session may not exist yet:
 * its characteristics are sent instead of its uid.
 */
export class CompatibleUserFilterDto extends BaseFilterDto {
  // The cursor is an offset: anything else would reach the query as NaN
  @IsOptional()
  @Matches(/^\d+$/, { message: 'cursor must be a non-negative integer' })
  @ApiProperty({
    description: 'Offset returned as nextCursor by the previous page',
    example: '10',
    required: false,
    type: String,
  })
  cursor?: string;

  @IsEnum(Sport)
  @ApiProperty({ description: 'Sport of the session', enum: Sport, example: Sport.FOOTBALL })
  sport: Sport;

  @Type(() => Number)
  @IsEnum(SessionSportLevel)
  @ApiProperty({
    description: 'Level of the session (0 accepts every level)',
    enum: SessionSportLevel,
    example: SessionSportLevel.INTERMEDIATE,
  })
  level: SessionSportLevel;

  @IsOptional()
  @IsEnum(GameModes)
  @ApiProperty({
    description: 'Game mode of the session',
    enum: GameModes,
    example: GameModes.FIVE_V_FIVE,
    required: false,
  })
  gameMode?: GameModes;

  @IsDateString()
  @ApiProperty({
    description: 'Start date of the session (ISO 8601)',
    example: '2026-11-07T09:00:00.000Z',
  })
  startDate: string;

  @IsString()
  @ApiProperty({
    description: 'Field of the session, used as the reference point for the distance',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
  })
  fieldUid: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Published session of the caller (creator or player): its characteristics replace the ones sent, and its players and pending or accepted invitations are excluded',
    example: 'cmaistjrg001yob7oe0mqu3ws',
    required: false,
  })
  sessionUid?: string;
}
