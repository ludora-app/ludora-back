import { Module } from '@nestjs/common';
import { PartnersModule } from 'src/partners/partners.module';
import { EmailsService } from 'src/shared/emails/emails.service';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { FieldsController } from './controllers/fields.controller';
import { FieldsAdminController } from './controllers/fields-admin.controller';
import { FieldSlotsService } from './services/field-slots.service';
import { FieldsService } from './services/fields.service';
import { FieldsAdminService } from './services/fields-admin.service';

@Module({
  controllers: [FieldsController, FieldsAdminController],
  exports: [FieldsService, FieldSlotsService],
  imports: [PartnersModule],
  providers: [
    FieldsService,
    StorageService,
    GeolocalisationService,
    FieldSlotsService,
    EmailsService,
    FieldsAdminService,
  ],
})
export class FieldsModule {}
