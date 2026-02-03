import { ApiProperty } from '@nestjs/swagger';
import { GameModes } from 'generated/prisma/enums';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';

export class GameModePreferenceResponseData {
  @ApiProperty({
    description: 'The unique identifier of the user game mode preference',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
  })
  uid: string;

  @ApiProperty({
    description: 'The game mode of the user game mode preference',
    enum: GameModes,
    example: GameModes.THREE_V_THREE,
  })
  gameMode: GameModes;

  @ApiProperty({
    description: 'The sport of the user game mode preference',
    example: 'BASKETBALL',
  })
  sport: string;

  @ApiProperty({
    description: 'The creation date of the user game mode preference',
    example: '2021-01-01T00:00:00.000Z',
  })
  createdAt: Date;
}

export class GameModePreferenceResponseDto extends ResponseTypeDto<GameModePreferenceResponseData> {
  @ApiProperty({ type: GameModePreferenceResponseData })
  readonly data: GameModePreferenceResponseData;
}
