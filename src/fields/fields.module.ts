import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { SharedModule } from 'src/shared/shared.module';
import { PartnersModule } from 'src/partners/partners.module';
import { StorageService } from 'src/shared/storage/storage.service';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';

import { FieldsController } from './fields.controller';
import { FieldsService } from './services/fields.service';
import { FieldSlotsService } from './services/field-slots.service';

@Module({
  controllers: [FieldsController],
  exports: [FieldsService, FieldSlotsService],
  imports: [PartnersModule, SharedModule, UsersModule],
  providers: [FieldsService, StorageService, GeolocalisationService, FieldSlotsService],
})
export class FieldsModule {}
