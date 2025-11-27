import { ApiProperty } from '@nestjs/swagger';
import { GameModes } from 'generated/prisma/enums';
import { Transform, Type } from 'class-transformer';
import { Sport } from 'src/shared/constants/constants';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class FieldFilterDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The name of the field',
    example: 'Field 1',
    required: false,
  })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The address of the field',
    example: '123 Main St, Anytown, USA',
    required: false,
  })
  address?: string;

  @IsOptional()
  @Transform(({ value }) => {
    // ? If it's already an array, return it as is
    if (Array.isArray(value)) return value;
    // ? If it's a string, put it in an array
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
  @Transform(({ value }) => {
    // ? If it's already an array, return it as is
    if (Array.isArray(value)) return value;
    // ? If it's a string, put it in an array
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
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({
    description: 'Longitude of the user',
    example: '2.2943506',
    required: false,
    type: Number,
  })
  longitude?: number;

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
