import { Module } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';

import { DevicesService } from './devices.service';

@Module({
  exports: [DevicesService],
  imports: [],
  providers: [DevicesService, FirebaseService],
})
export class DevicesModule {}
