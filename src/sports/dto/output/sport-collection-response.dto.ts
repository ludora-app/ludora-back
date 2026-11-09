import { ApiProperty } from '@nestjs/swagger';
import { GameModes } from 'generated/prisma/enums';
import { Sport } from 'src/shared/constants/constants';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

export class SportGameModeDto {
  @ApiProperty({
    description: 'Game mode code',
    enum: GameModes,
    example: GameModes.TWO_V_TWO,
    readOnly: true,
  })
  code: GameModes;

  @ApiProperty({
    description: 'Maximum number of players per team for this game mode',
    example: 2,
    readOnly: true,
  })
  playersPerTeam: number;
}

export class SportCollectionItemDto {
  @ApiProperty({
    description: 'Sport name (value of the Sport enum)',
    enum: Sport,
    example: Sport.PADEL,
    readOnly: true,
  })
  name: Sport;

  @ApiProperty({
    description: 'Game modes allowed for this sport, in display order',
    readOnly: true,
    type: [SportGameModeDto],
  })
  gameModes: SportGameModeDto[];
}

export const PaginatedSportCollectionResponseDto = toPaginationResponseType(SportCollectionItemDto);
