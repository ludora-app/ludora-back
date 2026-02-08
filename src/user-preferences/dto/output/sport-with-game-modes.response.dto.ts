import { ApiProperty } from '@nestjs/swagger';
import { UserSportLevel } from 'src/shared/constants/constants';

/**
 * @description Response DTO for sport preference with game modes
 */
export class SportWithGameModesResponseDto {
  @ApiProperty({ description: 'The sport', example: 'BASKETBALL' })
  sport: string;

  @ApiProperty({
    description: 'The level of the user sport preference',
    enum: UserSportLevel,
    example: UserSportLevel.INTERMEDIATE,
  })
  level: UserSportLevel;

  @ApiProperty({
    description: 'The game modes for this sport',
    example: ['FIVE_V_FIVE', 'THREE_V_THREE'],
    type: [String],
  })
  gameModes: string[];
}
