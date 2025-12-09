import { ApiProperty } from '@nestjs/swagger';
import { ConversationType } from 'generated/prisma/enums';
import { ConversationMembers, Messages } from 'generated/prisma/browser';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

export class ConversationResponse {
  @ApiProperty({
    description: 'Conversation creation date',
    example: '2025-01-01T00:00:00.000Z',
    readOnly: true,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Conversation creation date',
    example: '2025-01-01T00:00:00.000Z',
    readOnly: true,
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Conversation ID',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    readOnly: true,
    type: String,
  })
  uid: string;

  @ApiProperty({
    description: 'Session ID',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    readOnly: true,
    type: String,
  })
  sessionUid?: string | null;

  @ApiProperty({
    description: 'Conversation type',
    example: ConversationType.PRIVATE,
    readOnly: true,
  })
  type: ConversationType;

  @ApiProperty({
    description: 'Conversation name',
    example: 'Conversation 1',
    readOnly: true,
  })
  name: string;

  @ApiProperty({
    description: 'Conversation last message date',
    example: '2025-01-01T00:00:00.000Z',
    readOnly: true,
  })
  lastMessageAt: Date;

  @ApiProperty({
    description: 'Conversation members',
    example: ['cmajhjkjf000bq77q4b5ugn8b', 'cmajhjkjf000bq77q4b5ugn8b'],
    readOnly: true,
  })
  members?: ConversationMembers[];

  @ApiProperty({
    description: 'Conversation messages',
    example: ['cmajhjkjf000bq77q4b5ugn8b', 'cmajhjkjf000bq77q4b5ugn8b'],
    readOnly: true,
  })
  messages?: Messages[];
}

export const PaginatedConversationResponse = toPaginationResponseType(ConversationResponse);
