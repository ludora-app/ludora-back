import { PickType } from '@nestjs/swagger';

import { ConversationSettingsDto } from '../output/conversation-settings.dto';

export class ArchivedConversationSettingsDto extends PickType(ConversationSettingsDto, [
  'isArchived',
]) {}

export class MutedConversationSettingsDto extends PickType(ConversationSettingsDto, ['isMuted']) {}
