import { BadRequestException } from '@nestjs/common';
import { RatingsMapper } from 'src/ratings/mappers/ratings.mapper';
import { Sport } from 'src/shared/constants/constants';

describe('RatingsMapper', () => {
  const evaluatorUid = 'evaluator-123';
  const sessionUid = 'session-456';
  const evaluatedUid = 'evaluated-789';

  describe('toEntity', () => {
    it('should map Basketball DTO to entity', () => {
      const dto = {
        evaluatedUid,
        shoot: 1,
        defense: 2,
        dribble: 3,
      };
      const result = RatingsMapper.toEntity(dto as any, evaluatorUid, sessionUid, Sport.BASKETBALL);

      expect(result).toEqual({
        sessionUid,
        evaluatedUid,
        evaluatorUid,
        sport: Sport.BASKETBALL,
        note1: 1,
        note2: 2,
        note3: 3,
      });
    });

    it('should map Football DTO to entity', () => {
      const dto = {
        evaluatedUid,
        shoot: 4,
        defense: 5,
        passing: 1,
      };
      const result = RatingsMapper.toEntity(dto as any, evaluatorUid, sessionUid, Sport.FOOTBALL);

      expect(result).toEqual({
        sessionUid,
        evaluatedUid,
        evaluatorUid,
        sport: Sport.FOOTBALL,
        note1: 4,
        note2: 5,
        note3: 1,
      });
    });

    it('should map Padel DTO to entity', () => {
      const dto = {
        evaluatedUid,
        smash: 1,
        volley: 2,
        placement: 3,
      };
      const result = RatingsMapper.toEntity(dto as any, evaluatorUid, sessionUid, Sport.PADEL);

      expect(result).toEqual({
        sessionUid,
        evaluatedUid,
        evaluatorUid,
        sport: Sport.PADEL,
        note1: 1,
        note2: 2,
        note3: 3,
      });
    });

    it('should throw BadRequestException for unsupported sport', () => {
      const dto = { evaluatedUid };
      expect(() =>
        RatingsMapper.toEntity(dto as any, evaluatorUid, sessionUid, 'INVALID' as any),
      ).toThrow(BadRequestException);
    });
  });

  describe('toDto', () => {
    it('should map Basketball entity to DTO', () => {
      const entity = {
        sessionUid,
        evaluatedUid,
        evaluatorUid,
        sport: Sport.BASKETBALL,
        note1: 1,
        note2: 2,
        note3: 3,
      };
      const result = RatingsMapper.toDto(entity as any);

      expect(result).toEqual({
        sessionUid,
        evaluatedUid,
        sport: Sport.BASKETBALL,
        shoot: 1,
        defense: 2,
        dribble: 3,
      });
    });

    it('should map Football entity to DTO', () => {
      const entity = {
        sessionUid,
        evaluatedUid,
        evaluatorUid,
        sport: Sport.FOOTBALL,
        note1: 4,
        note2: 5,
        note3: 1,
      };
      const result = RatingsMapper.toDto(entity as any);

      expect(result).toEqual({
        sessionUid,
        evaluatedUid,
        sport: Sport.FOOTBALL,
        shoot: 4,
        defense: 5,
        passing: 1,
      });
    });

    it('should throw BadRequestException for unsupported sport in toDto', () => {
      const entity = {
        sessionUid,
        evaluatedUid,
        sport: 'INVALID',
      };
      expect(() => RatingsMapper.toDto(entity as any)).toThrow(BadRequestException);
    });
  });
});
