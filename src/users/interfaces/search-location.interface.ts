/**
 * @description The center and the radius of a geographic search (sessions, fields)
 */
export interface SearchLocation {
  maxDistance?: number;
  userLat?: number;
  userLon?: number;
}
