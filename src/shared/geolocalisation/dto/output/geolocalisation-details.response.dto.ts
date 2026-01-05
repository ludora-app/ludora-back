export interface GeolocalisationDetailsResponseDto {
  types: string[];
  place_id: string;
  geometry: Geometry;
  formatted_address: string;
  navigation_points: NavigationPoint[];
  address_components: AddressComponent[];
}

export interface AddressComponent {
  types: string[];
  long_name: string;
  short_name: string;
}

export interface Geometry {
  bounds: Bounds;
  viewport: Viewport;
  location: Coordinates;
  location_type: string;
}

export interface Bounds {
  northeast: Coordinates;
  southwest: Coordinates;
}

export interface Viewport {
  northeast: Coordinates;
  southwest: Coordinates;
}

export interface NavigationPoint {
  location: LongCoordinates;
}

export interface LongCoordinates {
  latitude: number;
  longitude: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ShortAddressLocation {
  lat: number;
  lng: number;
  shortAddress: string;
}

export interface AddressResult {
  place_id?: string;
  coordinates: Coordinates;
  formatted_address: string;
}
