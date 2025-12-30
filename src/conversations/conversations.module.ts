import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { StorageService } from 'src/shared/storage/storage.service';

import { MessagesService } from './messages.service';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';

@Module({
  controllers: [ConversationsController],
  exports: [ConversationsService, MessagesService],
  imports: [SharedModule],
  providers: [ConversationsService, MessagesService, StorageService],
})
export class ConversationsModule {}
