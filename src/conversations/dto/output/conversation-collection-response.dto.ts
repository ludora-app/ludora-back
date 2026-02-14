import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

import { BasicConversationResponseData, MessageDto } from './basic-conversation-response.dto';

export class ConversationCollectionResponseData extends OmitType(BasicConversationResponseData, [
  'updatedAt',
  'createdAt',
]) {
  @ApiProperty({
    description: 'Last message in the conversation',
    nullable: true,
    readOnly: true,
    type: MessageDto,
  })
  lastMessage: MessageDto | null;

  @ApiProperty({
    description: 'Number of unread messages in the conversation',
    example: 1,
    readOnly: true,
  })
  unreadMessagesCount: number;
}

export class ConversationCollectionResponseDto extends ResponseTypeDto<ConversationCollectionResponseData> {
  @ApiProperty({ type: ConversationCollectionResponseData })
  readonly data: ConversationCollectionResponseData;
}

export const PaginatedConversationCollectionResponseDto = toPaginationResponseType(
  ConversationCollectionResponseData,
);
