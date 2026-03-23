import { Module } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { UsersService } from 'src/users/users.service';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

@Module({
  controllers: [DevicesController],
  exports: [DevicesService],
  imports: [],
  providers: [DevicesService, FirebaseService, UsersService],
})
export class DevicesModule {}
