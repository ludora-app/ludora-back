import { Module } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { SharedModule } from 'src/shared/shared.module';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

@Module({
  controllers: [DevicesController],
  exports: [DevicesService],
  imports: [UsersModule, SharedModule],
  providers: [DevicesService, FirebaseService, UsersService],
})
export class DevicesModule {}
