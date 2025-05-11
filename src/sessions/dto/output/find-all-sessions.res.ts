import { ApiProperty } from '@nestjs/swagger';
import { Sport } from 'src/shared/constants/constants';
import { PaginationResponseDto } from 'src/interfaces/pagination-response-type';

export class FindAllSessionsData {
  @ApiProperty({
    description: 'Session creation date',
    example: '2025-05-10T22:30:32.525Z',
    readOnly: true,
  })
  created_at: Date;

  @ApiProperty({ description: 'Session description', example: 'Test session', readOnly: true })
  description: string;

  @ApiProperty({
    description: 'Session end date',
    example: '2025-01-01T11:00:00.000Z',
    readOnly: true,
  })
  end_date: Date;

  @ApiProperty({ description: 'Session ID', example: 'cmaistjrg001yob7oe0mqu3ws', readOnly: true })
  id: string;

  @ApiProperty({ description: 'Maximum number of players per team', example: 5, readOnly: true })
  max_players_per_team: number;

  @ApiProperty({ description: 'Maximum number of teams per game', example: 2, readOnly: true })
  max_teams_per_game: number;

  @ApiProperty({ description: 'Minimum number of players per team', example: 3, readOnly: true })
  min_players_per_team: number;

  @ApiProperty({ description: 'Minimum number of teams per game', example: 2, readOnly: true })
  min_teams_per_game: number;

  @ApiProperty({
    description: 'Sport played during the session',
    example: 'FOOTBALL',
    readOnly: true,
  })
  sport: Sport;

  @ApiProperty({
    description: 'Session start date',
    example: '2025-01-01T10:00:00.000Z',
    readOnly: true,
  })
  start_date: Date;

  @ApiProperty({ description: 'Session title', example: 'Session 1', readOnly: true })
  title: string;

  @ApiProperty({
    description: 'Session update date',
    example: '2025-05-10T22:30:32.525Z',
    readOnly: true,
  })
  updated_at: Date;
}

export const FindAllSessionsResponse = PaginationResponseDto(FindAllSessionsData);
