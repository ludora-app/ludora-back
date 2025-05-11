import { Game_modes } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The title of the session',
    example: 'Session de football',
    required: false,
  })
  title?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The description of the session',
    example: 'Session de football',
    required: false,
  })
  description?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The id of the field',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    required: true,
  })
  fieldId: string;

  @IsEnum(Game_modes)
  @IsNotEmpty()
  @ApiProperty({
    description: 'The game mode of the session',
    example: 'THREE_VS_THREE',
    required: true,
  })
  gameMode: Game_modes;

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

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The maximum number of players per team',
    example: 5,
    required: true,
  })
  maxPlayersPerTeam: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The number of teams per game',
    example: 2,
    required: true,
  })
  teamsPerGame: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The minimum number of players per team',
    example: 3,
    required: true,
  })
  minPlayersPerTeam: number;
}
