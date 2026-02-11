import { GameModes } from 'generated/prisma/enums';
import { Sport } from 'src/shared/constants/constants';

import { SportPreferenceResponseData } from '../dto/output/sport-preference.response.dto';

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
  static toSimpleDisplay(preference: SportPreferenceWithGameModes): SportPreferenceResponseData {
    return {
      gameModes: preference.userGameModePreferences.map((gameMode) => gameMode.gameMode),
      level: preference.level,
      sport: preference.sport as Sport,
      uid: preference.uid,
    };
  }
}
