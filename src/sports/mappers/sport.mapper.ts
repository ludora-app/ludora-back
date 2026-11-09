import { GameModes } from 'generated/prisma/enums';
import { Sport } from 'src/shared/constants/constants';
import { GAME_MODE_PLAYERS } from 'src/shared/constants/game-modes.constants';
import { SportCollectionItemDto } from '../dto/output/sport-collection-response.dto';

export interface RawSportCollectionItem {
  name: string;
  gameModes: GameModes[];
}

export class SportMapper {
  static fromRawToCollectionItem(sport: RawSportCollectionItem): SportCollectionItemDto {
    return {
      gameModes: sport.gameModes.map((code) => ({
        code,
        playersPerTeam: GAME_MODE_PLAYERS[code].maxPlayersPerTeam,
      })),
      name: sport.name as Sport,
    };
  }

  static fromRawToCollectionItems(sports: RawSportCollectionItem[]): SportCollectionItemDto[] {
    return sports.map((sport) => SportMapper.fromRawToCollectionItem(sport));
  }
}
