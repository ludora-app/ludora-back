import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Sport, UserSportLevel } from 'src/shared/constants/constants';
import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UserFilterDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Search by first name or last name',
    example: 'John',
    required: false,
    type: String,
  })
  name?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',').map((s) => s.trim());
    if (Array.isArray(value)) return value;
    return [value];
  })
  @IsEnum(Sport, { each: true })
  @IsArray()
  @ApiProperty({
    description: 'Filter by sports (returns players whose preferred sport matches)',
    enum: Sport,
    example: [Sport.BASKETBALL],
    isArray: true,
    required: false,
  })
  sports?: Sport[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',').map((s) => parseInt(s.trim(), 10));
    if (Array.isArray(value))
      return value.map((v) => (typeof v === 'number' ? v : parseInt(String(v).trim(), 10)));
    return [typeof value === 'number' ? value : parseInt(String(value).trim(), 10)];
  })
  @IsNumber({}, { each: true })
  @ApiProperty({
    description: 'Filter by sport levels (returns players who have level 2 or 3 in any sport)',
    enum: UserSportLevel,
    example: [UserSportLevel.INTERMEDIATE, UserSportLevel.ADVANCED],
    isArray: true,
    required: false,
  })
  levels?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @ApiProperty({
    description: 'Limit of users to return',
    example: 10,
    required: false,
    type: Number,
  })
  limit?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Cursor for pagination',
    example: '10',
    required: false,
    type: String,
  })
  cursor?: string;
}
