import { GameModes } from 'generated/prisma/enums';
import { Sport } from 'src/shared/constants/constants';

import { SportPreferenceResponseData } from '../dto/output/sport-preference.response.dto';

export interface SportPreferenceWithGameModes extends SportPreferences {
  userGameModePreferences?: {
    gameMode: GameModes;
    uid: string;
  }[];
}

export interface SportPreferences {
  uid: string;
  sport: string;
  level: number;
}

export class SportPreferencesMapper {
  static toSimpleDisplay(preference: SportPreferenceWithGameModes): SportPreferenceResponseData {
    return {
      gameModes: preference.userGameModePreferences?.map((gameMode) => gameMode.gameMode) || [],
      level: preference.level,
      sport: preference.sport as Sport,
      uid: preference.uid,
    };
  }

  static toSimpleArrayWithGameModes(preferences: SportPreferences[]): Sport[] {
    return preferences?.map((preference) => preference.sport as Sport) || [];
  }

  static toFindAllDisplay(preference: SportPreferences) {
    return {
      level: preference.level,
      sport: preference.sport as Sport,
      uid: preference.uid,
    };
  }
}
