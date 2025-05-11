import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { scope, Sport } from 'src/shared/constants/constants';
import { IsDate, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SessionFilterDto {
  @IsOptional()
  @IsEnum(Sport)
  @ApiProperty({
    description: 'Sport de la session',
    enum: Sport,
    example: Sport.BASKETBALL,
    required: false,
  })
  sport?: Sport;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'Limite de session à retourner',
    example: 10,
    required: false,
    type: Number,
  })
  limit?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Curseur pour la pagination',
    example: 'fcacfaca3c2a323bhf',
    required: false,
    type: String,
  })
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @ApiProperty({
    description: 'Date de début minimale',
    example: '2022-01-01T00:00:00.000Z',
    required: false,
    type: Date,
  })
  minStart?: Date;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @ApiProperty({
    description: 'Date de début maximale',
    example: '2022-01-01T00:00:00.000Z',
    required: false,
    type: Date,
  })
  maxStart?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({
    description: "Latitude de l'utilisateur",
    example: '48.8588443',
    required: false,
    type: Number,
  })
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({
    description: "Longitude de l'utilisateur",
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
    description: 'Distance maximale de recherche de la session (en km)',
    example: '10',
    required: false,
    type: Number,
  })
  maxDistance?: number;

  @IsOptional()
  @IsEnum(scope)
  @ApiProperty({
    description: `filtre les sessions en fonction de s'ils sont passés ou à venir, sert pour filtrer mes sessions`,
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
