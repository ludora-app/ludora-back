import { Module } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

@Module({
  controllers: [DevicesController],
  exports: [DevicesService],
  imports: [],
  providers: [DevicesService, FirebaseService],
})
export class DevicesModule {}
