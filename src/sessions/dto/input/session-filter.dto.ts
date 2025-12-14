import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { SessionScope, Sport } from 'src/shared/constants/constants';
import { IsDate, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SessionFilterDto {
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
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'Limit of sessions to return',
    example: 10,
    required: false,
    type: Number,
  })
  limit?: number;

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
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @ApiProperty({
    description: 'Minimum start date',
    example: '2022-01-01T00:00:00.000Z',
    required: false,
    type: Date,
  })
  minStart?: Date;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @ApiProperty({
    description: 'Maximum start date',
    example: '2022-01-01T00:00:00.000Z',
    required: false,
    type: Date,
  })
  maxStart?: Date;

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
    description: 'Maximum distance of the session search (in km)',
    example: '10',
    required: false,
    type: Number,
  })
  maxDistance?: number;

  @IsOptional()
  @IsEnum(SessionScope)
  @ApiProperty({
    description: `Filter sessions by whether they are past or upcoming, used to filter my sessions`,
    enum: SessionScope,
    example: SessionScope.UPCOMING,
    required: false,
  })
  scope?: SessionScope;
}
