import { ApiProperty, OmitType } from '@nestjs/swagger';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

import { SessionData } from './basic-conversation-response.dto';

export class SessionTeamData extends OmitType(SessionData, ['sessionUid', 'sport']) {}

export class ConversationMemberResponseData {
  @ApiProperty({
    description: 'User unique identifier',
    example: 'cmgoxfs3t002hob8arwdna80g',
    readOnly: true,
  })
  readonly userUid: string;

  @ApiProperty({
    description: 'User first name',
    example: 'Seto',
    readOnly: true,
  })
  readonly firstname: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Kaiba',
    readOnly: true,
  })
  readonly lastname: string;

  @ApiProperty({
    description: 'User image URL',
    example: 'https://example.com/image.jpg',
    readOnly: true,
  })
  readonly imageUrl: string;

  @ApiProperty({
    description: 'Whether the user is an admin',
    example: true,
    readOnly: true,
  })
  readonly isAdmin: boolean;

  @ApiProperty({
    description: 'User joined at',
    example: '2025-01-01T00:00:00.000Z',
    readOnly: true,
  })
  readonly joinedAt: Date;

  @ApiProperty({
    description:
      'If the conversation is of type SESSION, this will contain the session data like team label and team name',
    example: {
      teamLabel: 'A',
      teamName: 'Team A',
    },
    nullable: true,
    readOnly: true,
  })
  readonly sessionData?: SessionTeamData | null;
}

export const PaginatedConversationMemberResponseData = toPaginationResponseType(
  ConversationMemberResponseData,
);

export class PaginatedConversationMemberResponseDto {
  @ApiProperty({
    description: 'Conversation members',
    type: PaginatedConversationMemberResponseData,
  })
  readonly data: ConversationMemberResponseData;
}
