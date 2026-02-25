import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { DevicesModule } from 'src/devices/devices.module';
import { FirebaseService } from 'src/firebase/firebase.service';
import { WebSocketAuthService } from 'src/auth/services/websocket-auth.service';

import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  controllers: [NotificationsController],
  exports: [NotificationsGateway],
  imports: [UsersModule, DevicesModule],
  providers: [NotificationsGateway, WebSocketAuthService, NotificationsService, FirebaseService],
})
export class NotificationsModule {}
