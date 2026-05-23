import { GeocodeResult, PlaceType2 } from '@googlemaps/google-maps-services-js';
import { AddressAutocompleteResponseData } from '../dto/output/address-autocomplete-response.dto';

export class GeolocalisationMapper {
  static toAutocompleteDto(googleResponse: GeocodeResult): AddressAutocompleteResponseData {
    const streetNumber = googleResponse.address_components.find((component) =>
      component.types.includes(PlaceType2.street_number),
    )?.long_name;

    const route = googleResponse.address_components.find((component) =>
      component.types.includes(PlaceType2.route),
    )?.long_name;

    const city = googleResponse.address_components.find((component) =>
      component.types.includes(PlaceType2.locality),
    )?.long_name;

    const shortAddress = `${streetNumber} ${route}, ${city}`;

    return {
      address: googleResponse.formatted_address,
      shortAddress,
      longitude: googleResponse.geometry.location.lng,
      latitude: googleResponse.geometry.location.lat,
    };
  }
}
