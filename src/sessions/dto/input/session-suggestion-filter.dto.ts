import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { Sport } from 'src/shared/constants/constants';
import { UserHourPreferences, UserSports } from 'generated/prisma/client';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class SessionSuggestionFilterDto {
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
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @ApiProperty({
    description: 'Start date for filtering sessions',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  startDate?: Date;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @ApiProperty({
    description: 'End date for filtering sessions',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  endDate?: Date;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [value];
  })
  @IsEnum(Sport, { each: true })
  @IsOptional()
  @IsArray()
  @ApiProperty({
    description: 'Sports to filter by',
    enum: Sport,
    isArray: true,
    required: false,
  })
  sports?: Sport[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({
    description: 'Maximum distance for location-based filtering',
    example: 1000,
    required: false,
  })
  maxDistance?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Cursor for pagination',
    example: 'abc123',
    required: false,
  })
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'Number of results to return',
    example: 10,
    required: false,
  })
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @ApiProperty({
    description: 'Filter for urgent sessions only',
    example: true,
    required: false,
  })
  urgent?: boolean;
}

export class findAllSessionsSuggestionsDto extends SessionSuggestionFilterDto {
  userSportPreferences?: UserSports[];
  userTimePreferences?: UserHourPreferences[];
  filterSports?: Sport[];
}
