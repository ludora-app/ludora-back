import { Module } from '@nestjs/common';
import { StorageService } from 'src/shared/storage/storage.service';
import { ConversationsController } from './conversations.controller';
import { ConversationMembersService } from './services/conversation-members.service';
import { ConversationsService } from './services/conversations.service';
import { MessagesService } from './services/messages.service';

@Module({
  controllers: [ConversationsController],
  exports: [ConversationsService, MessagesService, ConversationMembersService],
  imports: [],
  providers: [ConversationsService, MessagesService, StorageService, ConversationMembersService],
})
export class ConversationsModule {}
