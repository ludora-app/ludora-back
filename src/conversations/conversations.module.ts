import { Module } from '@nestjs/common';

import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';

@Module({
  controllers: [ConversationsController],
  imports: [],
  providers: [ConversationsService],
})
export class ConversationsModule {}
