import { ApiProperty } from '@nestjs/swagger';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';

export class UnreadMessagesResponseData {
  @ApiProperty({
    description: 'Whether the user has unread messages',
    example: true,
  })
  hasUnreadMessages: boolean;
}

export class UnreadMessagesResponseDto extends ResponseTypeDto<UnreadMessagesResponseData> {
  @ApiProperty({ type: UnreadMessagesResponseData })
  readonly data: UnreadMessagesResponseData;
}
