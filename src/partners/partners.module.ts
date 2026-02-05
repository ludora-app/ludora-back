import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { SharedModule } from 'src/shared/shared.module';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';

import { PartnersService } from './partners.service';
import { PartnersController } from './partners.controller';

@Module({
  controllers: [PartnersController],
  exports: [PartnersService],
  imports: [UsersModule, SharedModule],
  providers: [PartnersService, GeolocalisationService],
})
export class PartnersModule {}
