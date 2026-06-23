import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExcludeEndpoint,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { SWAGGER_TAG_GEOLOCALISATION } from 'src/swagger.config';
import { Protected } from '../decorators/protected.decorator';
import { Public } from '../decorators/public.decorator';
import { BadRequestResponseDto } from '../dto/errors/bad-request-response.dto';
import { ForbiddenResponseDto } from '../dto/errors/forbidden-response.dto';
import { UnauthorizedResponseDto } from '../dto/errors/unauthorized-response.dto';
import { DevOnlyGuard } from '../guards/dev-only.guard';
import { AddressAutocompleteDto } from './dto/input/address-autocomplete.dto';
import { AddressAutocompleteResponseDto } from './dto/output/address-autocomplete-response.dto';
import { GeolocalisationService } from './geolocalisation.service';

@ApiTags(SWAGGER_TAG_GEOLOCALISATION)
@Controller('geolocalisation')
export class GeolocalisationController {
  constructor(private readonly geolocalisationService: GeolocalisationService) {}

  @Post('details')
  @Public()
  @ApiExcludeEndpoint()
  @UseGuards(DevOnlyGuard)
  async getDetailedAddressFromCoordinates(@Body() body: { lat: number; lng: number }) {
    return this.geolocalisationService.getDetailedAddressFromCoordinates(body.lat, body.lng);
  }

  @Post('address')
  @Public()
  @ApiExcludeEndpoint()
  @UseGuards(DevOnlyGuard)
  async getAddressFromCoordinates(@Body() body: { lat: number; lng: number }) {
    return this.geolocalisationService.getAddressFromCoordinates(body.lat, body.lng);
  }

  @Post('coordinates')
  @Public()
  @ApiExcludeEndpoint()
  @UseGuards(DevOnlyGuard)
  async getCoordinatesFromAddress(@Body() body: { address: string }) {
    return this.geolocalisationService.getLatitudeAndLongitude(body.address);
  }

  @Post('coordinates-and-short-address')
  @Public()
  @ApiExcludeEndpoint()
  @UseGuards(DevOnlyGuard)
  async getCoordinatesAndShortAddressFromAddress(@Body() body: { address: string }) {
    return this.geolocalisationService.getCoordinatesAndShortAddressFromAddress(body.address);
  }

  @Get('admin/list/collection')
  @Protected()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '[ADMIN] Get address autocomplete' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiForbiddenResponse({ type: ForbiddenResponseDto })
  @ApiOkResponse({ type: AddressAutocompleteResponseDto })
  async getAddressAutocomplete(@Query() body: AddressAutocompleteDto) {
    return this.geolocalisationService.getAddressAutocomplete(body.address);
  }
}
