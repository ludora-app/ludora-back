import { Sport } from '../constants/constants';

export class SportsMapper {
  static fromPrismaTypeToEnum(x: { sport: string }): Sport | undefined {
    switch (x.sport) {
      case 'FOOTBALL':
        return Sport.FOOTBALL;
      case 'BASKETBALL':
        return Sport.BASKETBALL;
      case 'TENNIS':
        return Sport.TENNIS;
      case 'PADEL':
        return Sport.PADEL;
      case 'VOLLEYBALL':
        return Sport.VOLLEYBALL;
      case 'PING-PONG':
        return Sport.PING_PONG;
      case 'BADMINTON':
        return Sport.BADMINTON;
      default:
        return undefined;
    }
  }

  static toEnum(entities: { sport: string }[]): Sport[] {
    return entities
      .map((entity) => SportsMapper.fromPrismaTypeToEnum(entity))
      .filter(Boolean) as Sport[];
  }
}
