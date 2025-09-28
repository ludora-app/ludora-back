import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { scope, Sport } from 'src/shared/constants/constants';

export class SessionFilterDto {
  @IsOptional()
  @Transform(({ value }) => {
    // ? Si c'est déjà un tableau, on le retourne tel quel
    if (Array.isArray(value)) return value;
    // ? Si c'est une string, on la met dans un tableau
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
  @IsEnum(scope)
  @ApiProperty({
    description: `Filter sessions by whether they are past or upcoming, used to filter my sessions`,
    enum: scope,
    example: 'UPCOMING',
    required: false,
  })
  scope?: string;

  // @IsOptional()
  // @IsString()
  // @ApiProperty({
  //   description: `Curseur pour la pagination`,
  //   required: false,
  // })
  // nextCursor?: string;
}
