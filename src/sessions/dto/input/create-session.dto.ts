import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { GameModes, SessionVisibility } from 'generated/prisma/client';
import { CreateImageDto } from 'src/auth/dto';
import { SessionSportLevel, Sport } from 'src/shared/constants/constants';

/**
 * @description DTO for creating a session
 * used from the outside of the API
 */
export class CreateSessionDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The title of the session',
    example: 'Football session',
    required: false,
  })
  title?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The description of the session',
    example: 'Football session',
    required: false,
  })
  description?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The uid of the field',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    required: true,
  })
  fieldUid: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The uid of the field slot',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    required: false,
  })
  slotUid?: string;

  @IsEnum(GameModes)
  @IsNotEmpty()
  @ApiProperty({
    description: 'The game mode of the session',
    enum: GameModes,
    example: GameModes.THREE_V_THREE,
    required: true,
  })
  gameMode: GameModes;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The start date of the session',
    example: '2021-01-01T00:00:00.000Z',
    required: true,
  })
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The end date of the session',
    example: '2021-01-01T00:00:00.000Z',
    required: true,
  })
  endDate: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The uid of the user',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    required: true,
  })
  userUid: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({
    description: 'Level for the session',
    enum: SessionSportLevel,
    example: SessionSportLevel.BEGINNER,
    required: false,
  })
  level?: SessionSportLevel;

  @IsEnum(SessionVisibility)
  @IsOptional()
  @ApiProperty({
    default: SessionVisibility.PUBLIC,
    description: 'The visibility of the session',
    enum: SessionVisibility,
    example: SessionVisibility.PUBLIC,
    required: false,
  })
  visibility?: SessionVisibility;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(15)
  @ApiProperty({
    description: 'The name of the team A',
    example: 'Equipe A',
    required: false,
  })
  teamAName?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(15)
  @ApiProperty({
    description: 'The name of the team B',
    example: 'Equipe B',
    required: false,
  })
  teamBName?: string;

  @IsEnum(Sport)
  @IsNotEmpty()
  @ApiProperty({
    description: 'The sport of the session',
    enum: Sport,
    example: Sport.BADMINTON,
    required: true,
  })
  sport: Sport;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    description: 'The images of the session',
    type: [CreateImageDto],
  })
  images?: { buffer: Buffer; originalname: string }[];
}

export class CreateSessionFromRequestDto extends OmitType(CreateSessionDto, [
  'userUid',
  'images',
]) {}
