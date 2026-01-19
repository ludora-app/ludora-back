import { ApiProperty } from '@nestjs/swagger';
import { TeamLabels } from 'generated/prisma/client';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

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

  @ApiProperty({
    description: 'User bio',
    example: 'Passionate football player',
    nullable: true,
    readOnly: true,
    required: false,
  })
  readonly bio?: string | null;

  @ApiProperty({
    description: 'Number of sessions the user has played',
    example: 12,
    readOnly: true,
    required: false,
  })
  readonly sessionsCount?: number;
}

export class SessionTeamResponseData {
  @ApiProperty({ example: 'cm7hvgonx0000to0mh5maqajc', readOnly: true })
  readonly teamUid?: string;

  @ApiProperty({ example: 'Team A', readOnly: true })
  readonly teamName: string;

  @ApiProperty({ example: TeamLabels.A, readOnly: true })
  readonly teamLabel: TeamLabels;

  @ApiProperty({
    description: 'Session update date',
    example: '2025-05-10T22:30:32.525Z',
    readOnly: true,
    required: false,
  })
  readonly updatedAt?: Date;

  @ApiProperty({
    description: 'Session creation date',
    example: '2025-05-10T22:30:32.525Z',
    readOnly: true,
    required: false,
  })
  readonly createdAt?: Date;

  @ApiProperty({
    description: 'Players in the team',
    readOnly: true,
    type: [FlattenedSessionPlayer],
  })
  readonly sessionPlayers?: FlattenedSessionPlayer[];

  @ApiProperty({
    description: 'Number of players in the team',
    example: 1,
    readOnly: true,
  })
  readonly numberOfPlayers: number;

  @ApiProperty({
    description: 'Whether the team is complete (full)',
    example: false,
    readOnly: true,
    required: false,
  })
  isComplete?: boolean;

  @ApiProperty({
    description: 'Number of remaining available spots in the team',
    example: 2,
    readOnly: true,
    required: false,
  })
  remainingPlayers?: number;

  @ApiProperty({
    description: 'Maximum number of players allowed per team',
    example: 5,
    readOnly: true,
    required: false,
  })
  maxPlayersPerTeam?: number;

  @ApiProperty({
    description: 'Whether the current user has joined this team',
    example: false,
    readOnly: true,
    required: false,
  })
  isJoined?: boolean;
}

export class SessionTeamResponseDto extends ResponseTypeDto<SessionTeamResponseData> {
  @ApiProperty({ type: SessionTeamResponseData })
  readonly data: SessionTeamResponseData;
}

export const PaginatedSessionTeamResponseDto = toPaginationResponseType(SessionTeamResponseData);
