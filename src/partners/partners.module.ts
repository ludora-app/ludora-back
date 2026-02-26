import { Module } from '@nestjs/common';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';
import { SharedModule } from 'src/shared/shared.module';
import { UsersModule } from 'src/users/users.module';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';

@Module({
  controllers: [PartnersController],
  exports: [PartnersService],
  imports: [UsersModule, SharedModule],
  providers: [PartnersService, GeolocalisationService],
})
export class PartnersModule {}
