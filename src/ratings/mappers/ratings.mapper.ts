import { BadRequestException } from '@nestjs/common';
import { Sport } from 'src/shared/constants/constants';
import { RatingEntity } from '../dto/input/base-rating.dto';
import {
  CreateBadmintonRatingDto,
  CreateBasketRatingDto,
  CreateFootRatingDto,
  CreatePadelRatingDto,
  CreatePingPongRatingDto,
  CreateRatingDto,
  CreateTennisRatingDto,
  CreateVolleyRatingDto,
} from '../dto/input/create-rating.dto';
import { RatingResponseData } from '../dto/output/rating-response.dto';

/**
 * Extracts the three sport-specific notes from a {@link CreateRatingDto}
 * and maps them to the generic `note1`, `note2`, `note3` fields of a {@link RatingEntity}.
 *
 * Each sport defines its own implementation to map its domain-specific fields
 * (e.g. `shoot`, `defense`) to the normalized database columns.
 *
 * @param dto - The sport-specific rating DTO received from the client
 * @returns The three normalized notes ready to be persisted
 *
 * @example
 * Basketball extractor: shoot → note1, defense → note2, dribble → note3
 * const extractor: SportNotesExtractor = (dto) => {
 *   const d = dto as CreateBasketRatingDto;
 *   return { note1: d.shoot, note2: d.defense, note3: d.dribble };
 * };
 */
type SportNotesExtractor = (
  dto: CreateRatingDto,
) => Pick<RatingEntity, 'note1' | 'note2' | 'note3'>;

const sportExtractors: Record<Sport, SportNotesExtractor> = {
  [Sport.BASKETBALL]: (dto) => {
    const d = dto as CreateBasketRatingDto;
    return { note1: d.shoot, note2: d.defense, note3: d.dribble };
  },
  [Sport.FOOTBALL]: (dto) => {
    const d = dto as CreateFootRatingDto;
    return { note1: d.shoot, note2: d.defense, note3: d.passing };
  },
  [Sport.PADEL]: (dto) => {
    const d = dto as CreatePadelRatingDto;
    return { note1: d.smash, note2: d.volley, note3: d.placement };
  },
  [Sport.TENNIS]: (dto) => {
    const d = dto as CreateTennisRatingDto;
    return { note1: d.serve, note2: d.forehand, note3: d.placement };
  },
  [Sport.VOLLEYBALL]: (dto) => {
    const d = dto as CreateVolleyRatingDto;
    return { note1: d.serve, note2: d.spike, note3: d.reception };
  },
  [Sport.PING_PONG]: (dto) => {
    const d = dto as CreatePingPongRatingDto;
    return { note1: d.serve, note2: d.attack, note3: d.defense };
  },
  [Sport.BADMINTON]: (dto) => {
    const d = dto as CreateBadmintonRatingDto;
    return { note1: d.serve, note2: d.smash, note3: d.defense };
  },
};
export class RatingsMapper {
  static toEntity(
    dto: CreateRatingDto,
    evaluatorUid: string,
    sessionUid: string,
    sport: Sport,
  ): RatingEntity {
    const extractor = sportExtractors[sport];
    if (!extractor) throw new BadRequestException(`Unsupported sport`);

    return {
      sessionUid,
      evaluatedUid: dto.evaluatedUid,
      evaluatorUid,
      sport,
      ...extractor(dto),
    };
  }

  static toDto(entity: RatingEntity): RatingResponseData {
    const base = {
      sessionUid: entity.sessionUid,
      evaluatedUid: entity.evaluatedUid,
    };

    const sport = entity.sport as Sport;
    switch (sport) {
      case Sport.BASKETBALL:
        return {
          ...base,
          sport: Sport.BASKETBALL,
          shoot: entity.note1,
          defense: entity.note2,
          dribble: entity.note3,
        };
      case Sport.FOOTBALL:
        return {
          ...base,
          sport: Sport.FOOTBALL,
          shoot: entity.note1,
          defense: entity.note2,
          passing: entity.note3,
        };
      case Sport.PADEL:
        return {
          ...base,
          sport: Sport.PADEL,
          smash: entity.note1,
          volley: entity.note2,
          placement: entity.note3,
        };
      case Sport.TENNIS:
        return {
          ...base,
          sport: Sport.TENNIS,
          serve: entity.note1,
          forehand: entity.note2,
          placement: entity.note3,
        };
      case Sport.VOLLEYBALL:
        return {
          ...base,
          sport: Sport.VOLLEYBALL,
          serve: entity.note1,
          spike: entity.note2,
          reception: entity.note3,
        };
      case Sport.PING_PONG:
        return {
          ...base,
          sport: Sport.PING_PONG,
          serve: entity.note1,
          attack: entity.note2,
          defense: entity.note3,
        };
      case Sport.BADMINTON:
        return {
          ...base,
          sport: Sport.BADMINTON,
          serve: entity.note1,
          smash: entity.note2,
          defense: entity.note3,
        };
      default: {
        const _exhaustive: never = sport;
        throw new BadRequestException(`Unsupported sport`);
      }
    }
  }
}
