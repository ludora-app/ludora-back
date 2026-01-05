import { GameModes } from 'generated/prisma/enums';

export const FIELD_SUGGESTION_CONFIG = {
  SCORES: {
    AVAILABILITY_BONUS: 150,
    DISTANCE_MAX_POINTS: 300,
    PARTNER_BONUS: 200,
    RANK_MULTIPLIER: 200,
    SEARCH_MAX_POINTS: 500,
  },
  THRESHOLDS: {
    MAX_DISTANCE_KM: 30,
    WORD_SIMILARITY_THRESHOLD: 0.2,
  },
};

export const GAME_MODE_PLAYERS_COUNT = {
  [GameModes.EIGHT_V_EIGHT]: 16,
  [GameModes.ELEVEN_V_ELEVEN]: 22,
  [GameModes.FIVE_V_FIVE]: 10,
  [GameModes.FOUR_V_FOUR]: 8,
  [GameModes.ONE_V_ONE]: 2,
  [GameModes.SEVEN_V_SEVEN]: 14,
  [GameModes.SIX_V_SIX]: 12,
  [GameModes.TEN_V_TEN]: 20,
  [GameModes.THREE_V_THREE]: 6,
  [GameModes.TWO_V_TWO]: 4,
};
