import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { StorageService } from 'src/shared/storage/storage.service';

import { MessagesService } from './services/messages.service';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './services/conversations.service';

@Module({
  controllers: [ConversationsController],
  exports: [ConversationsService, MessagesService],
  imports: [SharedModule],
  providers: [ConversationsService, MessagesService, StorageService],
})
export class ConversationsModule {}
