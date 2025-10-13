import { ApiProperty } from '@nestjs/swagger';
import { Team_label } from '@prisma/client';
import { PaginationResponseDto } from 'src/interfaces/pagination-response-type';

/**
 * @description session player object created by mixing the Session_players and Users table
 */
export class FlattenedSessionPlayer {
  @ApiProperty({ example: 'cmgoxfs3t002hob8arwdna80g', readOnly: true })
  readonly userUid: string;

  @ApiProperty({ example: 'cmgoxfs47002zob8a42uq1u8z', readOnly: true })
  readonly teamUid: string;

  @ApiProperty({ example: 'Seto', readOnly: true })
  readonly firstname: string;

  @ApiProperty({ example: 'Kaiba', readOnly: true })
  readonly lastname: string;

  @ApiProperty({ example: '1738433236109explore2.png', readOnly: true })
  readonly imageUrl: string | null;
}

export class SessionTeamResponse {
  @ApiProperty({ example: 'cm7hvgonx0000to0mh5maqajc', readOnly: true })
  readonly uid: string;

  @ApiProperty({ example: 'Team A', readOnly: true })
  readonly teamName: string;

  @ApiProperty({ example: Team_label.A, readOnly: true })
  readonly teamLabel: Team_label;

  @ApiProperty({
    description: 'Session update date',
    example: '2025-05-10T22:30:32.525Z',
    readOnly: true,
  })
  readonly updatedAt: Date;

  @ApiProperty({
    description: 'Session creation date',
    example: '2025-05-10T22:30:32.525Z',
    readOnly: true,
  })
  readonly createdAt: Date;

  @ApiProperty({
    description: 'Players in the team',
    type: [FlattenedSessionPlayer],
    readOnly: true,
  })
  readonly Session_players?: FlattenedSessionPlayer[];
}

export const PaginatedSessionTeamResponse = PaginationResponseDto(SessionTeamResponse);
