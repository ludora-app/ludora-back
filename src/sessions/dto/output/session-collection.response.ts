import { ApiProperty } from '@nestjs/swagger';
import { OmitType } from '@nestjs/mapped-types';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

import { SessionResponse } from './session.response';

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

export class SessionCollectionItem extends OmitType(SessionResponse, [
  'title',
  'description',
  'updatedAt',
  'createdAt',
]) {
  @ApiProperty({
    description: 'Session field image',
    example: 'https://example.com/image.jpg',
    readOnly: true,
    required: false,
  })
  fieldImage?: string;

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
export const PaginatedSessionCollectionResponse = toPaginationResponseType(SessionCollectionItem);
