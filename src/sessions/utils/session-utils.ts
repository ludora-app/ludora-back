export type FlattenedPlayer = {
  userUid: string;
  teamUid: string;
  firstname: string;
  lastname: string;
  imageUrl: string | null;
};

export type SessionTeamWithPlayers = {
  sessionPlayers: {
    userUid: string;
    teamUid: string;
    user: {
      firstname: string;
      lastname: string;
      imageUrl: string | null;
    };
  }[];
};

export class SessionUtils {
  /**
   * Flattens the sessionPlayers array to include the user details at the root level
   * @param sessionTeam - A session team with nested player data
   * @returns A session team with flattened player data
   */
  public static formatSessionPlayers<T extends SessionTeamWithPlayers>(
    sessionTeam: T,
  ): Omit<T, 'sessionPlayers'> & { sessionPlayers: FlattenedPlayer[] } {
    const { sessionPlayers, ...rest } = sessionTeam;
    return {
      ...rest,
      sessionPlayers: (sessionPlayers || []).map((player) => ({
        firstname: player.user.firstname,
        imageUrl: player.user.imageUrl,
        lastname: player.user.lastname,
        teamUid: player.teamUid,
        userUid: player.userUid,
      })),
    };
  }

  /**
   * Returns the min and max hours for a given time period
   * @param period - The time period (MORNING, AFTERNOON, EVENING)
   * @returns Object with min and max hours
   */
  public static getHoursForPeriod(period: string): { min: number; max: number } {
    switch (period) {
      case 'MORNING':
        return { max: 12, min: 9 };
      case 'AFTERNOON':
        return { max: 17, min: 12 };
      case 'EVENING':
        return { max: 22, min: 17 };
      default:
        return { max: 24, min: 0 }; // Fallback
    }
  }
}

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

    SPORT_MATCH: 1000, // Highest priority: correct sport
    TIME_PREFERENCE: 30, // Bonus for preferred time slot
    URGENCY_DEFAULT: 10, // Default urgency bonus (< 48h)

    URGENCY_HIGH: 100, // High urgency bonus (< 6h)
    URGENCY_MEDIUM: 50, // Medium urgency bonus (< 24h)
  },

  // Seuils techniques
  THRESHOLDS: {
    DEFAULT_WINDOW_MS: 2 * 24 * 60 * 60 * 1000, // 2 days
    MAX_DISTANCE_METERS: 30000,
    URGENCY_HIGH_MS: 6 * 60 * 60 * 1000, // 6 hours
    URGENCY_MEDIUM_MS: 24 * 60 * 60 * 1000, // 24 hours
  },
};

export type SessionSuggestionConfig = typeof SESSION_SUGGESTION_CONFIG;
