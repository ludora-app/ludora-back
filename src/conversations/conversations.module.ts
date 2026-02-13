import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { StorageService } from 'src/shared/storage/storage.service';

import { MessagesService } from './services/messages.service';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './services/conversations.service';
import { ConversationMembersService } from './services/conversation-members.service';

@Module({
  controllers: [ConversationsController],
  exports: [ConversationsService, MessagesService, ConversationMembersService],
  imports: [SharedModule],
  providers: [ConversationsService, MessagesService, StorageService, ConversationMembersService],
})
export class ConversationsModule {}
