import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsLatitude, IsLongitude } from 'class-validator';
import { PLAY_AREA_CONFIG } from 'src/users/constants/users.constants';

export class UpdatePlayAreaDto {
  @IsLatitude()
  @ApiProperty({
    description: 'Latitude of the center of the play area, rounded to 2 decimals when stored',
    example: 48.86,
  })
  latitude: number;

  @IsLongitude()
  @ApiProperty({
    description: 'Longitude of the center of the play area, rounded to 2 decimals when stored',
    example: 2.38,
  })
  longitude: number;

  @IsIn(PLAY_AREA_CONFIG.RADIUS_KM_VALUES)
  @ApiProperty({
    description: 'Radius of the play area (in km)',
    enum: PLAY_AREA_CONFIG.RADIUS_KM_VALUES,
    example: 10,
  })
  radiusKm: number;
}
