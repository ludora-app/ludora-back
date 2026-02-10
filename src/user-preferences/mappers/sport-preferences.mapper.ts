import { GameModes } from 'generated/prisma/enums';
import { Sport } from 'src/shared/constants/constants';

import { SimpleSportPreferenceResponseDto } from '../dto/output/simple-sport-preference-response.dto';

export interface SportPreferenceWithGameModes {
  uid: string;
  sport: string;
  level: number;
  userGameModePreferences: {
    gameMode: GameModes;
    uid: string;
  }[];
}

export class SportPreferencesMapper {
  static toSimpleDisplay(
    preference: SportPreferenceWithGameModes,
  ): SimpleSportPreferenceResponseDto {
    return {
      gameModes: preference.userGameModePreferences.map((gameMode) => gameMode.gameMode),
      level: preference.level,
      sport: preference.sport as Sport,
      uid: preference.uid,
    };
  }
}
