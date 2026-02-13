import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ConversationType } from 'generated/prisma/enums';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';

import { ConversationSettingsDto } from './conversation-settings.dto';
import { BasicConversationResponseData, MessageDto } from './basic-conversation-response.dto';

export class FindOneConversationResponseData extends OmitType(BasicConversationResponseData, [
  'updatedAt',
  'createdAt',
]) {
  @ApiProperty({
    description: 'Conversation ID',
    example: 'cmkpi7ca502t45imrn5ss4zki',
    readOnly: true,
    type: String,
  })
  uid: string;

  @ApiProperty({
    description: 'Conversation name',
    example: 'Conversation 1',
    nullable: true,
    readOnly: true,
  })
  name: string | null;

  @ApiProperty({
    description: 'Conversation type',
    enum: ConversationType,
    example: ConversationType.PRIVATE,
    readOnly: true,
  })
  type: ConversationType;

  messages: MessageDto[];

  @ApiProperty({
    description: 'Conversation settings',
    type: ConversationSettingsDto,
  })
  settings: ConversationSettingsDto;
}

export class FindOneConversationResponseDto extends ResponseTypeDto<FindOneConversationResponseData> {
  @ApiProperty({ type: FindOneConversationResponseData })
  readonly data: FindOneConversationResponseData;
}
