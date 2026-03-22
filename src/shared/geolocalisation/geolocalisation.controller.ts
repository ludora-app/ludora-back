import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { SWAGGER_TAG_GEOLOCALISATION } from 'src/swagger.config';
import { Public } from '../decorators/public.decorator';
import { DevOnlyGuard } from '../guards/dev-only.guard';
import { GeolocalisationService } from './geolocalisation.service';

@ApiExcludeController()
@ApiTags(SWAGGER_TAG_GEOLOCALISATION)
@Controller('geolocalisation')
@UseGuards(DevOnlyGuard)
export class GeolocalisationController {
  constructor(private readonly geolocalisationService: GeolocalisationService) {}

  @Post('details')
  @Public()
  async getDetailedAddressFromCoordinates(@Body() body: { lat: number; lng: number }) {
    return this.geolocalisationService.getDetailedAddressFromCoordinates(body.lat, body.lng);
  }

  @Post('address')
  @Public()
  async getAddressFromCoordinates(@Body() body: { lat: number; lng: number }) {
    return this.geolocalisationService.getAddressFromCoordinates(body.lat, body.lng);
  }

  @Post('coordinates')
  @Public()
  async getCoordinatesFromAddress(@Body() body: { address: string }) {
    return this.geolocalisationService.getLatitudeAndLongitude(body.address);
  }

  @Post('coordinates-and-short-address')
  @Public()
  async getCoordinatesAndShortAddressFromAddress(@Body() body: { address: string }) {
    return this.geolocalisationService.getCoordinatesAndShortAddressFromAddress(body.address);
  }
}
