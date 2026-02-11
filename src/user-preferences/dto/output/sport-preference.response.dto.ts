import { ApiProperty } from '@nestjs/swagger';
import { GameModes } from 'generated/prisma/enums';
import { Sport, UserSportLevel } from 'src/shared/constants/constants';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

/**
 * @description standard response for a userSportPreference resource
 */
export class SportPreferenceResponseData {
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

export class SportPreferenceResponseDto extends ResponseTypeDto<SportPreferenceResponseData> {
  @ApiProperty({ type: SportPreferenceResponseData })
  readonly data: SportPreferenceResponseData;
}

/**
 * @description standard response for a paginated userSportPreference resource, used to type swagger return
 */
export const PaginatedSportPreferenceResponseDto = toPaginationResponseType(
  SportPreferenceResponseData,
);
