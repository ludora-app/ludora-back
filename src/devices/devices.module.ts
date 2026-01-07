import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';

@Module({
  providers: [DevicesService],
})
export class DevicesModule {}
