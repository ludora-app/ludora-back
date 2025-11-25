import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { SharedModule } from 'src/shared/shared.module';
import { PartnersModule } from 'src/partners/partners.module';
import { PartnersService } from 'src/partners/partners.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';

import { FieldsService } from './fields.service';
import { FieldsController } from './fields.controller';

@Module({
  controllers: [FieldsController],
  imports: [PartnersModule, SharedModule, UsersModule],
  providers: [FieldsService, PartnersService, StorageService, GeolocalisationService],
})
export class FieldsModule {}
