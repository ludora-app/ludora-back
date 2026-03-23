import { Global, Module } from '@nestjs/common';
import { EmailsController } from './emails/emails.controller';
import { EmailsService } from './emails/emails.service';
import { EncryptionService } from './encryption/encryption.service';
import { GeolocalisationController } from './geolocalisation/geolocalisation.controller';
import { GeolocalisationService } from './geolocalisation/geolocalisation.service';
import { StorageController } from './storage/storage.controller';
import { StorageService } from './storage/storage.service';
@Global()
@Module({
  controllers: [EmailsController, StorageController, GeolocalisationController],
  exports: [EmailsService, StorageService, GeolocalisationService],
  providers: [EmailsService, StorageService, GeolocalisationService, EncryptionService],
})
export class SharedModule {}
