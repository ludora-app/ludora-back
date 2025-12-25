import { Module } from '@nestjs/common';

import { MessagesService } from './messages.service';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';

@Module({
  controllers: [ConversationsController],
  imports: [],
  providers: [ConversationsService, MessagesService],
  exports: [ConversationsService, MessagesService],
})
export class ConversationsModule {}
