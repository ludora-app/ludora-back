import { ApiProperty, PartialType } from '@nestjs/swagger';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

import { SessionResponse } from './session.response';

export interface SessionTeam {
  teamName: string;
  numberOfPlayers: number;
}

export class SessionCollectionItem extends PartialType(SessionResponse) {
  @ApiProperty({
    description: 'Session field image',
    example: 'https://example.com/image.jpg',
    readOnly: true,
  })
  fieldImage?: string;

  @ApiProperty({
    description: 'Session field short address',
    example: '38 Rue du Ballon, Noisy-le-Grand',
    readOnly: true,
  })
  fieldShortAddress?: string;

  @ApiProperty({
    description: 'Session field latitude',
    example: 48.8588443,
    readOnly: true,
  })
  fieldLatitude?: number;

  @ApiProperty({
    description: 'Session field longitude',
    example: 2.2943506,
    readOnly: true,
  })
  fieldLongitude?: number;

  @ApiProperty({
    description: 'Session teams',
    example: [{ _count: { sessionPlayers: 2 }, teamName: 'Team A' }],
    readOnly: true,
  })
  sessionTeams?: SessionTeam[];
}

/**
 * @description standard response for a paginated session, used to type swagger return
 */
export const PaginatedSessionCollectionResponse = toPaginationResponseType(SessionCollectionItem);
