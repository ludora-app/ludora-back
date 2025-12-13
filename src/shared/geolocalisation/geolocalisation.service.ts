import { Injectable, BadRequestException } from '@nestjs/common';
import { Client, AddressType } from '@googlemaps/google-maps-services-js';

import { AddressComponentsTypes } from './dto/input/address-components-types';
import {
  AddressResult,
  Coordinates,
  GeolocalisationDetailsResponse,
  ShortAddressLocation,
} from './dto/output/geolocalisation-details.response';

@Injectable()
export class GeolocalisationService {
  private readonly client = new Client({});

  /**
   * Retrieves GPS coordinates from an address
   * @param address - The address to geocode
   * @returns GPS coordinates (latitude and longitude)
   */
  async getLatitudeAndLongitude(address: string): Promise<Coordinates> {
    if (!address || address.trim().length === 0) {
      throw new BadRequestException('Address cannot be empty');
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new BadRequestException(
        'Google Maps API key is not configured. Please set GOOGLE_MAPS_API_KEY in your environment variables.',
      );
    }

    try {
      const response = await this.client.geocode({
        params: {
          address: address.trim(),
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      });

      if (!response.data.results || response.data.results.length === 0) {
        throw new BadRequestException('No results found for this address');
      }

      const location = response.data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error retrieving coordinates');
    }
  }

  /**
   * Retrieves an address from GPS coordinates
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns The formatted address corresponding to the coordinates
   */
  async getAddressFromCoordinates(lat: number, lng: number): Promise<AddressResult> {
    if (!this.isValidCoordinate(lat, lng)) {
      throw new BadRequestException('Invalid GPS coordinates');
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new BadRequestException(
        'Google Maps API key is not configured. Please set GOOGLE_MAPS_API_KEY in your environment variables.',
      );
    }

    try {
      const response = await this.client.reverseGeocode({
        params: {
          key: process.env.GOOGLE_MAPS_API_KEY,
          latlng: { lat, lng },
        },
      });

      if (!response.data.results || response.data.results.length === 0) {
        throw new BadRequestException('No address found for these coordinates');
      }

      const result = response.data.results[0];
      return {
        coordinates: { lat, lng },
        formatted_address: result.formatted_address,
        place_id: result.place_id,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error retrieving address');
    }
  }

  /**
   * Retrieves detailed address information from coordinates
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns Detailed address information
   */
  async getDetailedAddressFromCoordinates(
    lat: number,
    lng: number,
  ): Promise<GeolocalisationDetailsResponse> {
    if (!this.isValidCoordinate(lat, lng)) {
      throw new BadRequestException('Invalid GPS coordinates');
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new BadRequestException(
        'Google Maps API key is not configured. Please set GOOGLE_MAPS_API_KEY in your environment variables.',
      );
    }

    try {
      const response = await this.client.reverseGeocode({
        params: {
          key: process.env.GOOGLE_MAPS_API_KEY,
          latlng: { lat, lng },
          result_type: [
            AddressType.street_address,
            AddressType.route,
            AddressType.locality,
            AddressType.administrative_area_level_1,
            AddressType.country,
          ],
        },
      });

      if (!response.data.results || response.data.results.length === 0) {
        throw new BadRequestException('No address found for these coordinates');
      }

      const result = response.data.results[0];

      return {
        address_components: result.address_components,
        formatted_address: result.formatted_address,
        geometry: {
          bounds: result.geometry.bounds || result.geometry.viewport,
          location: result.geometry.location,
          location_type: result.geometry.location_type,
          viewport: result.geometry.viewport,
        },
        navigation_points: [],
        place_id: result.place_id,
        types: result.types,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error retrieving detailed information');
    }
  }

  async getCoordinatesAndShortAddressFromAddress(address: string): Promise<ShortAddressLocation> {
    // ? fetch the coordinates from the address
    const coordinates = await this.getLatitudeAndLongitude(address);
    // ? fetch the details used to form the short address from the coordinates
    const details = await this.getDetailedAddressFromCoordinates(coordinates.lat, coordinates.lng);

    //? ensures that addresses from google maps API are used
    if (address !== details.formatted_address) {
      throw new BadRequestException('The address is not the same as the formatted address');
    }

    const streetNumber = details.address_components.find((component) =>
      component.types.includes(AddressComponentsTypes.STREET_NUMBER),
    )?.long_name;

    const route = details.address_components.find((component) =>
      component.types.includes(AddressComponentsTypes.ROUTE),
    )?.long_name;

    const locality = details.address_components.find((component) =>
      component.types.includes(AddressComponentsTypes.LOCALITY),
    )?.long_name;

    const shortAddress = `${streetNumber} ${route}, ${locality}`;
    return {
      lat: coordinates.lat,
      lng: coordinates.lng,
      shortAddress: shortAddress,
    };
  }

  /**
   * Validates GPS coordinates
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns true if the coordinates are valid
   */
  private isValidCoordinate(lat: number, lng: number): boolean {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }
}
