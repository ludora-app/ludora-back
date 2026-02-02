import { ApiProperty } from '@nestjs/swagger';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

import { MessageDto } from './basic-conversation-response.dto';

export class MessageCollectionItemDto extends MessageDto {
  @ApiProperty({
    description: 'Whether the message has been read by anyone',
    example: true,
    readOnly: true,
  })
  hasAnyRead: boolean;

  @ApiProperty({
    description: 'Whether the message has been read by everyone',
    example: true,
    readOnly: true,
  })
  hasEveryoneRead: boolean;
}

export class MessageCollectionResponseDto extends ResponseTypeDto<MessageCollectionItemDto> {
  @ApiProperty({ type: MessageCollectionItemDto })
  readonly data: MessageCollectionItemDto;
}

export const PaginatedMessageCollectionResponseDto =
  toPaginationResponseType(MessageCollectionItemDto);
