import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { Sport } from 'src/shared/constants/constants';
import { CreateRatingDto } from './dto/input/create-rating.dto';
import {
  BadmintonRatingDto,
  BasketRatingDto,
  FootRatingDto,
  PadelRatingDto,
  PingPongRatingDto,
  TennisRatingDto,
  VolleyRatingDto,
} from './dto/output/rating-response.dto';
import { RatingsService } from './ratings.service';

@Controller('ratings')
@ApiExtraModels(
  BasketRatingDto,
  FootRatingDto,
  BadmintonRatingDto,
  PingPongRatingDto,
  PadelRatingDto,
  TennisRatingDto,
  VolleyRatingDto,
)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(BasketRatingDto) },
        { $ref: getSchemaPath(FootRatingDto) },
        { $ref: getSchemaPath(BadmintonRatingDto) },
        { $ref: getSchemaPath(PingPongRatingDto) },
        { $ref: getSchemaPath(PadelRatingDto) },
        { $ref: getSchemaPath(TennisRatingDto) },
        { $ref: getSchemaPath(VolleyRatingDto) },
      ],
      discriminator: {
        propertyName: 'sport',
        mapping: {
          [Sport.BASKETBALL]: getSchemaPath(BasketRatingDto),
          [Sport.FOOTBALL]: getSchemaPath(FootRatingDto),
          [Sport.BADMINTON]: getSchemaPath(BadmintonRatingDto),
          [Sport.PING_PONG]: getSchemaPath(PingPongRatingDto),
          [Sport.PADEL]: getSchemaPath(PadelRatingDto),
          [Sport.TENNIS]: getSchemaPath(TennisRatingDto),
          [Sport.VOLLEYBALL]: getSchemaPath(VolleyRatingDto),
        },
      },
    },
  })
  create(@Body() createRatingDto: CreateRatingDto) {
    return this.ratingsService.create(createRatingDto);
  }

  @Get()
  findAll() {
    return this.ratingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ratingsService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ratingsService.remove(+id);
  }
}
