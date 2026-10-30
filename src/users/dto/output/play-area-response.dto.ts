import { ApiProperty } from '@nestjs/swagger';

export class PlayAreaResponseData {
  @ApiProperty({
    description: 'Latitude of the center of the play area (rounded to 2 decimals)',
    example: 48.86,
    readOnly: true,
  })
  readonly latitude: number;

  @ApiProperty({
    description: 'Longitude of the center of the play area (rounded to 2 decimals)',
    example: 2.38,
    readOnly: true,
  })
  readonly longitude: number;

  @ApiProperty({ description: 'Radius of the play area (in km)', example: 10, readOnly: true })
  readonly radiusKm: number;
}
