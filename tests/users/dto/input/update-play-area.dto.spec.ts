import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdatePlayAreaDto } from 'src/users/dto/input/update-play-area.dto';

describe('UpdatePlayAreaDto', () => {
  const validPlayArea = { latitude: 48.86, longitude: 2.38, radiusKm: 10 };

  const getErrorProperties = async (playArea: Record<string, unknown>) => {
    const errors = await validate(plainToInstance(UpdatePlayAreaDto, playArea));
    return errors.map((error) => error.property);
  };

  it('should accept a valid play area', async () => {
    expect(await getErrorProperties(validPlayArea)).toEqual([]);
  });

  it.each([5, 10, 20, 30])('should accept a radius of %i km', async (radiusKm) => {
    expect(await getErrorProperties({ ...validPlayArea, radiusKm })).toEqual([]);
  });

  it.each([0, 15, 50])('should reject a radius of %i km', async (radiusKm) => {
    expect(await getErrorProperties({ ...validPlayArea, radiusKm })).toEqual(['radiusKm']);
  });

  it('should reject coordinates out of range', async () => {
    expect(await getErrorProperties({ ...validPlayArea, latitude: 91, longitude: -181 })).toEqual([
      'latitude',
      'longitude',
    ]);
  });
});
