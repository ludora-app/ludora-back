import { Module } from '@nestjs/common';
import { WebSocketAuthService } from 'src/auth/services/websocket-auth.service';
import { DevicesModule } from 'src/devices/devices.module';
import { FirebaseService } from 'src/firebase/firebase.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersModule } from 'src/users/users.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  exports: [NotificationsGateway],
  imports: [PrismaModule, UsersModule, DevicesModule],
  providers: [NotificationsGateway, WebSocketAuthService, NotificationsService, FirebaseService],
})
export class NotificationsModule {}
