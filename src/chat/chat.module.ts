import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WebSocketAuthService } from 'src/auth-b2c/websocket-auth.service';
import { ConversationsModule } from 'src/conversations/conversations.module';

import { ChatGateway } from './chat.gateway';

@Module({
  exports: [ChatGateway],
  imports: [PrismaModule, UsersModule, ConversationsModule],
  providers: [ChatGateway, WebSocketAuthService],
})
export class ChatModule {}
