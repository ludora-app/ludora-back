import { Injectable, BadRequestException } from '@nestjs/common';
import { Client, AddressType } from '@googlemaps/google-maps-services-js';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AddressResult {
  place_id?: string;
  coordinates: Coordinates;
  formatted_address: string;
}

@Injectable()
export class GeolocalisationService {
  private readonly client = new Client({});

  /**
   * Récupère les coordonnées GPS à partir d'une adresse
   * @param address - L'adresse à géocoder
   * @returns Les coordonnées GPS (latitude et longitude)
   */
  async getLatitudeAndLongitude(address: string): Promise<Coordinates> {
    if (!address || address.trim().length === 0) {
      throw new BadRequestException("L'adresse ne peut pas être vide");
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new BadRequestException(
        "La clé API Google Maps n'est pas configurée. Veuillez définir GOOGLE_MAPS_API_KEY dans vos variables d'environnement.",
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
        throw new BadRequestException('Aucun résultat trouvé pour cette adresse');
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
      throw new BadRequestException('Erreur lors de la récupération des coordonnées');
    }
  }

  /**
   * Récupère l'adresse à partir de coordonnées GPS
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns L'adresse formatée correspondant aux coordonnées
   */
  async getAddressFromCoordinates(lat: number, lng: number): Promise<AddressResult> {
    if (!this.isValidCoordinate(lat, lng)) {
      throw new BadRequestException('Coordonnées GPS invalides');
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new BadRequestException(
        "La clé API Google Maps n'est pas configurée. Veuillez définir GOOGLE_MAPS_API_KEY dans vos variables d'environnement.",
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
        throw new BadRequestException('Aucune adresse trouvée pour ces coordonnées');
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
      throw new BadRequestException("Erreur lors de la récupération de l'adresse");
    }
  }

  /**
   * Récupère des informations détaillées sur une adresse à partir de coordonnées
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns Informations détaillées sur l'adresse
   */
  async getDetailedAddressFromCoordinates(lat: number, lng: number): Promise<any> {
    if (!this.isValidCoordinate(lat, lng)) {
      throw new BadRequestException('Coordonnées GPS invalides');
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new BadRequestException(
        "La clé API Google Maps n'est pas configurée. Veuillez définir GOOGLE_MAPS_API_KEY dans vos variables d'environnement.",
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
        throw new BadRequestException('Aucune adresse trouvée pour ces coordonnées');
      }

      return response.data.results[0];
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erreur lors de la récupération des informations détaillées');
    }
  }

  /**
   * Valide les coordonnées GPS
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns true si les coordonnées sont valides
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
