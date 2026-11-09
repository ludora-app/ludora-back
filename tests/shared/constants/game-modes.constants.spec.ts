import { GameModes } from 'generated/prisma/enums';
import {
  GAME_MODE_PLAYERS,
  getGameModeTotalPlayers,
} from 'src/shared/constants/game-modes.constants';

describe('game modes constants', () => {
  it('should define the players of every game mode', () => {
    for (const gameMode of Object.values(GameModes)) {
      const players = GAME_MODE_PLAYERS[gameMode];
      expect(players).toBeDefined();
      expect(players.minPlayersPerTeam).toBeLessThanOrEqual(players.maxPlayersPerTeam);
    }
  });

  it('should compute the total number of players of a game', () => {
    expect(getGameModeTotalPlayers(GameModes.ONE_V_ONE)).toBe(2);
    expect(getGameModeTotalPlayers(GameModes.FIVE_V_FIVE)).toBe(10);
    expect(getGameModeTotalPlayers(GameModes.ELEVEN_V_ELEVEN)).toBe(22);
  });
});
