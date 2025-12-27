import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WsAuthGuard } from 'src/auth-b2c/guards/ws-auth.guard';

import { NotificationsGateway } from './notifications.gateway';

@Module({
  exports: [NotificationsGateway],
  imports: [PrismaModule, UsersModule, EventEmitterModule.forRoot()],
  providers: [NotificationsGateway, WsAuthGuard],
})
export class NotificationsModule {}
