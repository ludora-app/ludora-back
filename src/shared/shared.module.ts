import { Module } from '@nestjs/common';

import { EmailsService } from './emails/emails.service';
import { StorageService } from './storage/storage.service';
import { EmailsController } from './emails/emails.controller';
import { StorageController } from './storage/storage.controller';
import { GeolocalisationService } from './geolocalisation/geolocalisation.service';
import { GeolocalisationController } from './geolocalisation/geolocalisation.controller';

@Module({
  controllers: [EmailsController, StorageController, GeolocalisationController],
  exports: [EmailsService, StorageService, GeolocalisationService],
  providers: [EmailsService, StorageService, GeolocalisationService],
})
export class SharedModule {}
