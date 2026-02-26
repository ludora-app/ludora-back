import { Module } from '@nestjs/common';
import { WebSocketAuthService } from 'src/auth/services/websocket-auth.service';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { UsersModule } from 'src/users/users.module';

import { ChatGateway } from './chat.gateway';

@Module({
  exports: [ChatGateway],
  imports: [UsersModule, ConversationsModule],
  providers: [ChatGateway, WebSocketAuthService],
})
export class ChatModule {}
