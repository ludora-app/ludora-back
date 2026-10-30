import { AddressType } from '@googlemaps/google-maps-services-js';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';

describe('GeolocalisationService', () => {
  let service: GeolocalisationService;
  let reverseGeocode: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeolocalisationService,
        { provide: ConfigService, useValue: { getOrThrow: jest.fn().mockReturnValue('key') } },
      ],
    }).compile();

    service = module.get<GeolocalisationService>(GeolocalisationService);
    reverseGeocode = jest.spyOn(service['client'], 'reverseGeocode');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getCityFromCoordinates', () => {
    it('should return the locality of the coordinates', async () => {
      reverseGeocode.mockResolvedValue({
        data: {
          results: [
            {
              address_components: [
                { long_name: '75011', types: [AddressType.postal_code] },
                { long_name: 'Paris', types: [AddressType.locality, AddressType.political] },
              ],
            },
          ],
        },
      });

      await expect(service.getCityFromCoordinates(48.8612, 2.3789)).resolves.toBe('Paris');
      expect(reverseGeocode).toHaveBeenCalledWith({
        params: expect.objectContaining({
          latlng: { lat: 48.8612, lng: 2.3789 },
          result_type: [AddressType.locality],
        }),
      });
    });

    it('should throw BadRequestException when no city is found', async () => {
      reverseGeocode.mockResolvedValue({ data: { results: [] } });

      await expect(service.getCityFromCoordinates(48.86, 2.38)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when the geocoding request fails', async () => {
      reverseGeocode.mockRejectedValue(new Error('Network error'));

      await expect(service.getCityFromCoordinates(48.86, 2.38)).rejects.toThrow(
        'Error retrieving city',
      );
    });

    it('should reject invalid coordinates without calling Google', async () => {
      await expect(service.getCityFromCoordinates(120, 2.38)).rejects.toThrow(BadRequestException);
      expect(reverseGeocode).not.toHaveBeenCalled();
    });
  });
});
