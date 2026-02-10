import { ApiProperty } from '@nestjs/swagger';
import { GameModes } from 'generated/prisma/enums';
import { Sport, UserSportLevel } from 'src/shared/constants/constants';

export class SimpleSportPreferenceResponseDto {
  @ApiProperty({ description: 'The unique identifier of the user sport preference' })
  uid: string;

  @ApiProperty({
    description: 'The sport of the user sport preference',
    enum: Sport,
    example: Sport.BASKETBALL,
  })
  sport: Sport;

  @ApiProperty({
    description: 'The level of the user sport preference',
    enum: UserSportLevel,
    example: UserSportLevel.BEGINNER,
  })
  level: UserSportLevel;

  @ApiProperty({
    description: 'The game modes for this sport',
    enum: GameModes,
    example: [GameModes.THREE_V_THREE, GameModes.FIVE_V_FIVE],
    isArray: true,
  })
  gameModes: GameModes[];
}
