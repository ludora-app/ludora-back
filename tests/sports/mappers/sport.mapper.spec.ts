import { GameModes } from 'generated/prisma/enums';
import { Sport } from 'src/shared/constants/constants';
import { SportMapper } from 'src/sports/mappers/sport.mapper';

describe('SportMapper', () => {
  it('should map game modes to their code and max players per team, keeping the order', () => {
    const result = SportMapper.fromRawToCollectionItem({
      gameModes: [GameModes.ELEVEN_V_ELEVEN, GameModes.ONE_V_ONE, GameModes.FIVE_V_FIVE],
      name: Sport.FOOTBALL,
    });

    expect(result).toEqual({
      gameModes: [
        { code: GameModes.ELEVEN_V_ELEVEN, playersPerTeam: 11 },
        { code: GameModes.ONE_V_ONE, playersPerTeam: 1 },
        { code: GameModes.FIVE_V_FIVE, playersPerTeam: 5 },
      ],
      name: Sport.FOOTBALL,
    });
  });

  it('should map a list of sports', () => {
    const result = SportMapper.fromRawToCollectionItems([
      { gameModes: [], name: Sport.TENNIS },
      { gameModes: [GameModes.TWO_V_TWO], name: Sport.PADEL },
    ]);

    expect(result).toEqual([
      { gameModes: [], name: Sport.TENNIS },
      { gameModes: [{ code: GameModes.TWO_V_TWO, playersPerTeam: 2 }], name: Sport.PADEL },
    ]);
  });
});
