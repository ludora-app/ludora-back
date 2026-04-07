import { OmitType } from '@nestjs/swagger';
import {
  BadmintonRatingDto,
  BasketRatingDto,
  FootRatingDto,
  PadelRatingDto,
  PingPongRatingDto,
  TennisRatingDto,
  VolleyRatingDto,
} from '../output/rating-response.dto';

export class CreateBasketRatingDto extends OmitType(BasketRatingDto, ['sessionUid', 'sport']) {}
export class CreateFootRatingDto extends OmitType(FootRatingDto, ['sessionUid', 'sport']) {}
export class CreatePadelRatingDto extends OmitType(PadelRatingDto, ['sessionUid', 'sport']) {}
export class CreateTennisRatingDto extends OmitType(TennisRatingDto, ['sessionUid', 'sport']) {}
export class CreateVolleyRatingDto extends OmitType(VolleyRatingDto, ['sessionUid', 'sport']) {}
export class CreatePingPongRatingDto extends OmitType(PingPongRatingDto, ['sessionUid', 'sport']) {}
export class CreateBadmintonRatingDto extends OmitType(BadmintonRatingDto, [
  'sessionUid',
  'sport',
]) {}

export type CreateRatingDto =
  | CreateBasketRatingDto
  | CreateFootRatingDto
  | CreatePadelRatingDto
  | CreateTennisRatingDto
  | CreateVolleyRatingDto
  | CreatePingPongRatingDto
  | CreateBadmintonRatingDto;
