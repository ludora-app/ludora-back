import { Module } from '@nestjs/common';

import { MessagesService } from './messages.service';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';

@Module({
  controllers: [ConversationsController],
  exports: [ConversationsService, MessagesService],
  imports: [],
  providers: [ConversationsService, MessagesService],
})
export class ConversationsModule {}
