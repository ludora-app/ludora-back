import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { SharedModule } from 'src/shared/shared.module';
import { FirebaseService } from 'src/firebase/firebase.service';

import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';

@Module({
  controllers: [DevicesController],
  exports: [DevicesService],
  imports: [UsersModule, SharedModule],
  providers: [DevicesService, FirebaseService, UsersService],
})
export class DevicesModule {}
