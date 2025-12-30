export enum SessionScope {
  PAST = 'PAST',
  UPCOMING = 'UPCOMING',
  ALL = 'ALL',
}

export enum Sport {
  BASKETBALL = 'BASKETBALL',
  FOOTBALL = 'FOOTBALL',
  TENNIS = 'TENNIS',
  VOLLEYBALL = 'VOLLEYBALL',
  PADDEL = 'PADDEL',
  BADMINTON = 'BADMINTON',
  PING_PONG = 'PING-PONG',
}

export enum StorageFolderName {
  SESSIONS = 'sessions',
  USERS = 'users',
  PARTNERS = 'partners',
  FIELDS = 'fields',
  CONVERSATIONS = 'conversations',
}

export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  RESET = 'reset',
}

/**
 * @description The level of the user for the sport, from 1 to 3
 */
export enum UserSportLevel {
  BEGINNER = 1,
  INTERMEDIATE = 2,
  ADVANCED = 3,
}

/**
 * @description The level of the session for the sport, from 0 to 3
 */
export enum SessionSportLevel {
  ANY = 0,
  BEGINNER = 1,
  INTERMEDIATE = 2,
  ADVANCED = 3,
}
