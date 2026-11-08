import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CompatibleUserFilterDto } from 'src/users/dto/input/compatible-user-filter.dto';

describe('CompatibleUserFilterDto', () => {
  const validFilter = {
    fieldUid: 'field-1',
    level: '2',
    sport: 'FOOTBALL',
    startDate: '2026-11-07T09:00:00.000Z',
  };

  const getErrorProperties = async (filter: Record<string, unknown>) => {
    const errors = await validate(plainToInstance(CompatibleUserFilterDto, filter));
    return errors.map((error) => error.property);
  };

  it('should accept a valid filter with the level sent as a query string', async () => {
    expect(await getErrorProperties(validFilter)).toEqual([]);
  });

  it('should accept the optional game mode and session', async () => {
    expect(
      await getErrorProperties({
        ...validFilter,
        gameMode: 'FIVE_V_FIVE',
        sessionUid: 'session-1',
      }),
    ).toEqual([]);
  });

  it('should require the sport, the level, the start date and the field', async () => {
    expect(await getErrorProperties({})).toEqual(['sport', 'level', 'startDate', 'fieldUid']);
  });

  it('should reject an unknown level, sport or game mode', async () => {
    expect(
      await getErrorProperties({ ...validFilter, gameMode: 'TEN', level: '7', sport: 'GOLF' }),
    ).toEqual(['sport', 'level', 'gameMode']);
  });

  it('should reject a start date that is not ISO 8601', async () => {
    expect(await getErrorProperties({ ...validFilter, startDate: 'saturday' })).toEqual([
      'startDate',
    ]);
  });

  it('should accept an offset cursor', async () => {
    expect(await getErrorProperties({ ...validFilter, cursor: '20' })).toEqual([]);
  });

  it('should reject a cursor that is not an offset', async () => {
    expect(await getErrorProperties({ ...validFilter, cursor: 'abc' })).toEqual(['cursor']);
    expect(await getErrorProperties({ ...validFilter, cursor: '-10' })).toEqual(['cursor']);
  });
});
