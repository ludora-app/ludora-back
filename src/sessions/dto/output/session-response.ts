import { ApiProperty } from '@nestjs/swagger';
import { Sport } from 'src/shared/domain/constants/constants';
import { PaginationResponseDto } from 'src/interfaces/pagination-response-type';

/**
 * @description standard response for a session
 */
export class SessionResponse {
  @ApiProperty({
    description: 'Session creation date',
    example: '2025-05-10T22:30:32.525Z',
    readOnly: true,
  })
  createdAt: Date;

  @ApiProperty({ description: 'Session description', example: 'Test session', readOnly: true })
  description: string;

  @ApiProperty({
    description: 'Session end date',
    example: '2025-01-01T11:00:00.000Z',
    readOnly: true,
  })
  endDate: Date;

  @ApiProperty({ description: 'Session ID', example: 'cmaistjrg001yob7oe0mqu3ws', readOnly: true })
  id: string;

  @ApiProperty({ description: 'Maximum number of players per team', example: 5, readOnly: true })
  maxPlayersPerTeam: number;

  @ApiProperty({ description: 'Number of teams per game', example: 2, readOnly: true })
  teamsPerGame: number;

  @ApiProperty({ description: 'Minimum number of players per team', example: 3, readOnly: true })
  minPlayersPerTeam: number;

  @ApiProperty({
    description: 'Sport played during the session',
    example: 'FOOTBALL',
    readOnly: true,
  })
  sport: Sport | string;

  @ApiProperty({
    description: 'Session start date',
    example: '2025-01-01T10:00:00.000Z',
    readOnly: true,
  })
  startDate: Date;

  @ApiProperty({ description: 'Session title', example: 'Session 1', readOnly: true })
  title: string;

  @ApiProperty({
    description: 'Session update date',
    example: '2025-05-10T22:30:32.525Z',
    readOnly: true,
  })
  updatedAt: Date;
}

/**
 * @description standard response for a paginated session, used to type swagger return
 */
export const PaginatedSessionResponse = PaginationResponseDto(SessionResponse);
