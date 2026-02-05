import { Injectable, BadRequestException } from '@nestjs/common';
import { Client, AddressType } from '@googlemaps/google-maps-services-js';

import { AddressComponentsTypes } from './dto/input/address-components-types';
import {
  AddressResult,
  Coordinates,
  GeoDetails,
  GeolocalisationDetailsResponseDto,
  ShortAddressLocation,
} from './dto/output/geolocalisation-details.response.dto';

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
  ): Promise<GeolocalisationDetailsResponseDto> {
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

    const city = details.address_components.find((component) =>
      component.types.includes(AddressComponentsTypes.CITY),
    )?.long_name;

    const shortAddress = `${streetNumber} ${route}, ${city}`;
    return {
      lat: coordinates.lat,
      lng: coordinates.lng,
      shortAddress: shortAddress,
    };
  }

  async getDetailsFromAddress(address: string): Promise<GeoDetails> {
    // ? fetch the coordinates from the address
    const coordinates = await this.getLatitudeAndLongitude(address);
    // ? fetch the details used to form the short address from the coordinates
    const details = await this.getDetailedAddressFromCoordinates(coordinates.lat, coordinates.lng);

    // //? ensures that addresses from google maps API are used
    if (address !== details.formatted_address) {
      // throw new BadRequestException('The address is not the same as the formatted address');
    }

    const streetNumber = details.address_components.find((component) =>
      component.types.includes(AddressComponentsTypes.STREET_NUMBER),
    )?.long_name;

    const route = details.address_components.find((component) =>
      component.types.includes(AddressComponentsTypes.ROUTE),
    )?.long_name;

    const city = details.address_components.find((component) =>
      component.types.includes(AddressComponentsTypes.CITY),
    )?.long_name;

    const department = details.address_components.find((component) =>
      component.types.includes(AddressComponentsTypes.ADMINISTRATIVE_AREA_LEVEL_1),
    )?.long_name;

    const zipCode = details.address_components.find((component) =>
      component.types.includes(AddressComponentsTypes.POSTAL_CODE),
    )?.long_name;

    const country = details.address_components.find((component) =>
      component.types.includes(AddressComponentsTypes.COUNTRY),
    )?.long_name;

    const shortAddress = `${streetNumber} ${route}, ${city}`;
    return {
      address: details.formatted_address,
      city,
      country,
      department,
      latitude: details.geometry.location.lat,
      longitude: details.geometry.location.lng,
      shortAddress,
      zipCode,
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

  /**
   * The function calculates the distance between two sets of coordinates on the Earth's surface using
   * the Haversine formula.
   * @param {number} lat1 - Latitude of the first point in degrees
   * @param {number} lng1 - The `lng1` parameter represents the longitude of the first coordinate point.
   * Longitude is a geographic coordinate that specifies the east-west position of a point on the Earth's
   * surface. It is measured in degrees ranging from -180 degrees (West) to +180 degrees (East).
   * @param {number} lat2 - The `lat2` parameter in the `getDistanceBetweenCoordinates` method represents
   * the latitude of the second point (in degrees) for which you want to calculate the distance from the
   * first point specified by `lat1` and `lng1`.
   * @param {number} lng2 - Longitude of the second coordinate.
   * @returns The `getDistanceBetweenCoordinates` method calculates the distance between two sets of
   * coordinates using the Haversine formula and returns the distance in kilometers.
   */
  static calculateDistanceBetweenCoordinates(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }
}
