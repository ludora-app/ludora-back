import { ApiProperty } from '@nestjs/swagger';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';

export class FindOneConversationByUserUidResponseData {
  @ApiProperty({
    description: 'Conversation UID',
    example: 'cmkpi7ca502t45imrn5ss4zki',
    readOnly: true,
  })
  conversationUid: string;
}

export class FindOneConversationByUserUidResponseDto extends ResponseTypeDto<FindOneConversationByUserUidResponseData> {
  @ApiProperty({ type: FindOneConversationByUserUidResponseData })
  readonly data: FindOneConversationByUserUidResponseData;
}
