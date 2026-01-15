/**
 * Configuration for session suggestion scoring algorithm
 * Defines weights and thresholds for generating session suggestions
 */
export const SESSION_SUGGESTION_CONFIG = {
  // Configuration for session suggestion scoring algorithm
  SCORES: {
    DATE_RANGE_MATCH: 100, // Standard score for date range matches (within start/end dates)

    DATE_TARGET_ADJACENT: 50, // Score for adjacent dates (previous/next day)
    DATE_TARGET_EXACT: 200, // Score for exact date match
    DISTANCE_MAX_POINTS: 50, // Maximum bonus for proximity (within 30km)

    SEARCH_MAX_POINTS: 500, // Maximum bonus for search match
    SPORT_MATCH: 1000, // Highest priority: correct sport
    TIME_PREFERENCE: 30, // Bonus for preferred time slot

    URGENCY_DEFAULT: 10, // Default urgency bonus (< 48h)
    URGENCY_HIGH: 100, // High urgency bonus (< 6h)

    URGENCY_MEDIUM: 50, // Medium urgency bonus (< 24h)
  },

  // Seuils techniques
  THRESHOLDS: {
    DEFAULT_WINDOW_MS: 2 * 24 * 60 * 60 * 1000, // 2 days
    MAX_DISTANCE_METERS: 30000, // 30km
    URGENCY_HIGH_MS: 6 * 60 * 60 * 1000, // 6 hours
    URGENCY_MEDIUM_MS: 24 * 60 * 60 * 1000, // 24 hours
    WORD_SIMILARITY_THRESHOLD: 0.3, // 30% similarity threshold for search pg_trgm
  },
};

export type SessionSuggestionConfig = typeof SESSION_SUGGESTION_CONFIG;
