export const USER_SUGGESTION_CONFIG = {
  SCORES: {
    CITY_BONUS: 500,
    LEVEL_MATCH_SCORE_PER_PAIR: 200,
    SEARCH_EXACT_BONUS: 300,
    SEARCH_PARTIAL_BONUS: 100,
    SPORT_SCORE_PER_MATCH: 1000,
  },
  THRESHOLDS: {
    WORD_SIMILARITY_THRESHOLD: 0.4,
  },
};

export const DEFAULT_USER_DATA = {
  FIRSTNAME: 'Utilisateur',
  LASTNAME: 'Supprimé',
};

export const PLAY_AREA_CONFIG = {
  // 2 decimals ≈ 1 km: the exact position of the user is never stored
  COORDINATES_DECIMALS: 2,
  RADIUS_KM_VALUES: [5, 10, 20, 30],
};
