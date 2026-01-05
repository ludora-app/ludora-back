import { ApiProperty } from '@nestjs/swagger';
import { GameModes } from 'generated/prisma/enums';
import { Sport } from 'src/shared/constants/constants';

/**
 * @description standard response for a Session resource
 */
export class SessionResponseDto {
  @ApiProperty({
    description: 'Session creation date',
    example: '2025-05-10T22:30:32.525Z',
    readOnly: true,
  })
  createdAt?: Date;

  @ApiProperty({ description: 'Session description', example: 'Test session', readOnly: true })
  description?: string;

  @ApiProperty({
    description: 'Session end date',
    example: '2025-01-01T11:00:00.000Z',
    readOnly: true,
  })
  endDate: Date;

  @ApiProperty({ description: 'Session ID', example: 'cmaistjrg001yob7oe0mqu3ws', readOnly: true })
  uid: string;

  @ApiProperty({ description: 'Maximum number of players per team', example: 5, readOnly: true })
  maxPlayersPerTeam: number;

  @ApiProperty({ description: 'Number of teams per game', example: 2, readOnly: true })
  teamsPerGame?: number;

  @ApiProperty({ description: 'Minimum number of players per team', example: 3, readOnly: true })
  minPlayersPerTeam?: number;

  @ApiProperty({
    description: 'Sport played during the session',
    enum: Sport,
    example: Sport.FOOTBALL,
    readOnly: true,
  })
  sport: Sport;

  @ApiProperty({
    description: 'Session start date',
    example: '2025-01-01T10:00:00.000Z',
    readOnly: true,
  })
  startDate: Date;

  @ApiProperty({ description: 'Session title', example: 'Session 1', readOnly: true })
  title?: string;

  @ApiProperty({
    description: 'Session update date',
    example: '2025-05-10T22:30:32.525Z',
    readOnly: true,
  })
  updatedAt?: Date;

  @ApiProperty({
    description: 'Session game mode',
    example: 'THREE_VS_THREE',
    readOnly: true,
  })
  gameMode: GameModes;

  @ApiProperty({
    description: 'Session creator',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    readOnly: true,
  })
  creatorUid: string;
}
