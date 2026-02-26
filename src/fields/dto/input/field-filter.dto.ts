import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { FieldType, GameModes } from 'generated/prisma/enums';
import { Sport } from 'src/shared/constants/constants';

/**
 * @description DTO for filtering the fields in most use cases (findAll methods)
 * Used by classic users
 */
export class FieldFilterDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    return [value];
  })
  @IsEnum(Sport, { each: true })
  @ApiProperty({
    description: 'Sports of the session',
    enum: Sport,
    example: [Sport.BASKETBALL, Sport.FOOTBALL],
    isArray: true,
    required: false,
  })
  sports?: Sport[];

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Search query',
    example: 'Basketball',
    required: false,
    type: String,
  })
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    return [value];
  })
  @IsEnum(GameModes, { each: true })
  @ApiProperty({
    description: 'The game mode of the field',
    enum: GameModes,
    example: [GameModes.THREE_V_THREE, GameModes.FIVE_V_FIVE],
    isArray: true,
    required: false,
  })
  gameModes?: GameModes[];

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: 'The start date of the field',
    example: '2025-01-01T00:00:00.000Z',
    required: false,
    type: String,
  })
  date?: string;

  @IsOptional()
  @IsEnum(FieldType)
  @ApiProperty({
    description: 'Type of the field',
    enum: FieldType,
    example: FieldType.PUBLIC,
    required: false,
  })
  type?: FieldType;

  @IsOptional()
  @ApiProperty({
    description: 'Duration of the session',
    example: 60,
    required: false,
    type: Number,
  })
  duration?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    default: 'UTC',
    description: 'User TimeZone',
    example: 'Europe/Paris',
  })
  readonly timezone?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Cursor for pagination',
    example: 'fcacfaca3c2a323bhf',
    required: false,
    type: String,
  })
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiProperty({
    description: 'Limit of fields to return',
    example: 10,
    required: false,
    type: Number,
  })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({
    description: 'Latitude of the user',
    example: '48.8588443',
    required: false,
    type: Number,
  })
  userLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({
    description: 'Longitude of the user',
    example: '2.2943506',
    required: false,
    type: Number,
  })
  userLon?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: 'Maximum distance of the field search (in km)',
    example: '10',
    required: false,
    type: Number,
  })
  maxDistance?: number;
}
