import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WebSocketAuthService } from 'src/auth-b2c/websocket-auth.service';

import { NotificationsGateway } from './notifications.gateway';

@Module({
  exports: [NotificationsGateway],
  imports: [PrismaModule, UsersModule],
  providers: [NotificationsGateway, WebSocketAuthService],
})
export class NotificationsModule {}
