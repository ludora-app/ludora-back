import { Module } from '@nestjs/common';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';

@Module({
  controllers: [PartnersController],
  exports: [PartnersService],
  imports: [],
  providers: [PartnersService, GeolocalisationService],
})
export class PartnersModule {}
