import { ApiProperty } from '@nestjs/swagger';
import { GameModes } from 'generated/prisma/enums';
import { Sport } from 'src/shared/constants/constants';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

export class TeamFromSessionCollectionItem {
  @ApiProperty({
    description: 'Team name',
    example: 'Team A',
  })
  teamName: string;

  @ApiProperty({
    description: 'Number of players in the team',
    example: 3,
  })
  numberOfPlayers: number;
}

export class SessionCollectionSuggestionItem {
  @ApiProperty({
    description: 'Session unique identifier',
    example: 'cmj5pw29d003g75lsyurh9bpp',
    readOnly: true,
  })
  uid: string;

  @ApiProperty({
    description: 'Session field image',
    example: 'https://example.com/image.jpg',
    readOnly: true,
    required: false,
  })
  fieldImage?: string;

  @ApiProperty({
    description: 'Creator UID',
    example: 'abc123',
    readOnly: true,
  })
  creatorUid: string;

  @ApiProperty({
    description: 'End date of the session',
    example: '2023-10-15T14:30:00Z',
    readOnly: true,
  })
  endDate: Date;

  @ApiProperty({
    description: 'Start date of the session',
    example: '2023-10-15T10:00:00Z',
    readOnly: true,
  })
  startDate: Date;

  @ApiProperty({
    description: 'Game mode',
    enum: GameModes,
    example: GameModes.FIVE_V_FIVE,
    readOnly: true,
  })
  gameMode: GameModes;

  @ApiProperty({
    description: 'Maximum players per team',
    example: 5,
    readOnly: true,
  })
  maxPlayersPerTeam: number;

  @ApiProperty({
    description: 'Sport type',
    enum: Sport,
    example: Sport.FOOTBALL,
    readOnly: true,
  })
  sport: Sport;

  @ApiProperty({
    description: 'Session field short address',
    example: '38 Rue du Ballon, Noisy-le-Grand',
    readOnly: true,
  })
  fieldShortAddress: string;

  @ApiProperty({
    description: 'Session teams',
    example: [{ numberOfPlayers: 2, teamName: 'Team A' }],
    readOnly: true,
    type: [TeamFromSessionCollectionItem],
  })
  sessionTeams: TeamFromSessionCollectionItem[];

  @ApiProperty({
    description: 'Field latitude',
    example: 48.8566,
    readOnly: true,
  })
  fieldLatitude: number;

  @ApiProperty({
    description: 'Field longitude',
    example: 2.3522,
    readOnly: true,
  })
  fieldLongitude: number;

  @ApiProperty({
    description: 'Distance to the session in meters',
    example: 1200,
    readOnly: true,
  })
  userDistance?: number;
}

/**
 * @description standard response for a paginated session suggestion, used to type swagger return
 */
export const PaginatedSessionCollectionSuggestionResponse = toPaginationResponseType(
  SessionCollectionSuggestionItem,
);
