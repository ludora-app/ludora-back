import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { Sport } from 'src/shared/constants/constants';
import { CreateBaseRatingDto } from '../input/create-rating.dto';

export class BasketRatingDto extends PickType(CreateBaseRatingDto, [
  'sessionUid',
  'evaluatedUid',
  'shoot',
  'defense',
  'dribble',
]) {
  @ApiProperty({ enum: [Sport.BASKETBALL], example: Sport.BASKETBALL })
  @IsIn([Sport.BASKETBALL])
  readonly sport: Sport.BASKETBALL;
}

export class FootRatingDto extends PickType(CreateBaseRatingDto, [
  'sessionUid',
  'evaluatedUid',
  'shoot',
  'defense',
  'passing',
]) {
  @ApiProperty({ enum: [Sport.FOOTBALL], example: Sport.FOOTBALL })
  @IsIn([Sport.FOOTBALL])
  readonly sport: Sport.FOOTBALL;
}

export class PadelRatingDto extends PickType(CreateBaseRatingDto, [
  'sessionUid',
  'evaluatedUid',
  'smash',
  'volley',
  'placement',
]) {
  @ApiProperty({ enum: [Sport.PADEL], example: Sport.PADEL })
  @IsIn([Sport.PADEL])
  readonly sport: Sport.PADEL;
}

export class TennisRatingDto extends PickType(CreateBaseRatingDto, [
  'sessionUid',
  'evaluatedUid',
  'serve',
  'forehand',
  'placement',
]) {
  @ApiProperty({ enum: [Sport.TENNIS], example: Sport.TENNIS })
  @IsIn([Sport.TENNIS])
  readonly sport: Sport.TENNIS;
}

export class VolleyRatingDto extends PickType(CreateBaseRatingDto, [
  'sessionUid',
  'evaluatedUid',
  'serve',
  'spike',
  'reception',
]) {
  @ApiProperty({ enum: [Sport.VOLLEYBALL], example: Sport.VOLLEYBALL })
  @IsIn([Sport.VOLLEYBALL])
  readonly sport: Sport.VOLLEYBALL;
}
export class PingPongRatingDto extends PickType(CreateBaseRatingDto, [
  'sessionUid',
  'evaluatedUid',
  'serve',
  'attack',
  'defense',
]) {
  @ApiProperty({ enum: [Sport.PING_PONG], example: Sport.PING_PONG })
  @IsIn([Sport.PING_PONG])
  readonly sport: Sport.PING_PONG;
}

export class BadmintonRatingDto extends PickType(CreateBaseRatingDto, [
  'sessionUid',
  'evaluatedUid',
  'serve',
  'smash',
  'defense',
]) {
  @ApiProperty({ enum: [Sport.BADMINTON], example: Sport.BADMINTON })
  @IsIn([Sport.BADMINTON])
  readonly sport: Sport.BADMINTON;
}
