import { PartialType } from '@nestjs/swagger';

import { CreateConversationDto } from './create-private-conversation.dto';

export class UpdateConversationDto extends PartialType(CreateConversationDto) {}
