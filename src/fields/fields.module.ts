import { Module } from '@nestjs/common';
import { PartnersModule } from 'src/partners/partners.module';
import { EmailsService } from 'src/shared/emails/emails.service';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';
import { StorageService } from 'src/shared/storage/storage.service';

import { FieldsController } from './fields.controller';
import { FieldSlotsService } from './services/field-slots.service';
import { FieldsService } from './services/fields.service';

@Module({
  controllers: [FieldsController],
  exports: [FieldsService, FieldSlotsService],
  imports: [PartnersModule],
  providers: [
    FieldsService,
    StorageService,
    GeolocalisationService,
    FieldSlotsService,
    EmailsService,
  ],
})
export class FieldsModule {}
