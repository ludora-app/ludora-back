import { GameModes } from 'generated/prisma/enums';

export interface GameModePlayers {
  maxPlayersPerTeam: number;
  minPlayersPerTeam: number;
  teamsPerGame: number;
}

/**
 * Single source of truth for the number of players of each game mode.
 * The total number of players of a game is `maxPlayersPerTeam * 2`.
 */
export const GAME_MODE_PLAYERS: Record<GameModes, GameModePlayers> = {
  [GameModes.ONE_V_ONE]: { maxPlayersPerTeam: 1, minPlayersPerTeam: 1, teamsPerGame: 1 },
  [GameModes.TWO_V_TWO]: { maxPlayersPerTeam: 2, minPlayersPerTeam: 2, teamsPerGame: 1 },
  [GameModes.THREE_V_THREE]: { maxPlayersPerTeam: 3, minPlayersPerTeam: 3, teamsPerGame: 1 },
  [GameModes.FOUR_V_FOUR]: { maxPlayersPerTeam: 4, minPlayersPerTeam: 3, teamsPerGame: 1 },
  [GameModes.FIVE_V_FIVE]: { maxPlayersPerTeam: 5, minPlayersPerTeam: 3, teamsPerGame: 1 },
  [GameModes.SIX_V_SIX]: { maxPlayersPerTeam: 6, minPlayersPerTeam: 4, teamsPerGame: 1 },
  [GameModes.SEVEN_V_SEVEN]: { maxPlayersPerTeam: 7, minPlayersPerTeam: 5, teamsPerGame: 1 },
  [GameModes.EIGHT_V_EIGHT]: { maxPlayersPerTeam: 8, minPlayersPerTeam: 5, teamsPerGame: 1 },
  [GameModes.TEN_V_TEN]: { maxPlayersPerTeam: 10, minPlayersPerTeam: 7, teamsPerGame: 1 },
  [GameModes.ELEVEN_V_ELEVEN]: { maxPlayersPerTeam: 11, minPlayersPerTeam: 8, teamsPerGame: 1 },
};

/** Total number of players of a game (both teams) for a game mode. */
export function getGameModeTotalPlayers(gameMode: GameModes): number {
  return GAME_MODE_PLAYERS[gameMode].maxPlayersPerTeam * 2;
}
