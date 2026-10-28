import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Sport, UserSportLevel } from 'src/shared/constants/constants';
import { BaseFilterDto } from 'src/shared/dto/input/base-filter.dto';

export class UserFilterDto extends BaseFilterDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value !== undefined ? String(value) : undefined))
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
}
