import { ApiProperty, OmitType } from '@nestjs/swagger';
import { SessionSportLevel } from 'src/shared/constants/constants';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

import { SessionResponseData } from './session.response.dto';

export class TeamFromSessionCollectionItemDto {
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

export class SessionCollectionItemDto extends OmitType(SessionResponseData, [
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
    type: [TeamFromSessionCollectionItemDto],
  })
  sessionTeams: TeamFromSessionCollectionItemDto[];

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

  @ApiProperty({
    description: 'Session level',
    example: SessionSportLevel.BEGINNER,
    readOnly: true,
  })
  level: SessionSportLevel;
}

/**
 * @description standard response for a paginated session suggestion, used to type swagger return
 */
export const PaginatedSessionCollectionResponseDto =
  toPaginationResponseType(SessionCollectionItemDto);
