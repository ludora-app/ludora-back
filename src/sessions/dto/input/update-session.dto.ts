import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { GameModes } from 'generated/prisma/client';

import { CreateSessionDto } from './create-session.dto';

export class UpdateSessionDto extends PartialType(CreateSessionDto) {
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

  @IsEnum(GameModes)
  @IsOptional()
  @ApiProperty({
    description: 'The game mode of the session',
    enum: GameModes,
    example: GameModes.THREE_V_THREE,
    required: true,
  })
  gameMode?: GameModes;

  @IsDateString()
  @IsOptional()
  @ApiProperty({
    description: 'The start date of the session',
    example: '2021-01-01T00:00:00.000Z',
    required: true,
  })
  startDate?: string;

  @IsDateString()
  @IsOptional()
  @ApiProperty({
    description: 'The end date of the session',
    example: '2021-01-01T00:00:00.000Z',
    required: true,
  })
  endDate?: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'The maximum number of players per team',
    example: 5,
    required: true,
  })
  maxPlayersPerTeam?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'The number of teams per game',
    example: 2,
    required: true,
  })
  teamsPerGame?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'The minimum number of players per team',
    example: 3,
    required: true,
  })
  minPlayersPerTeam?: number;
}
