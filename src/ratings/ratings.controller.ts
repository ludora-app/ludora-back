import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBody, ApiExtraModels, ApiParam, getSchemaPath } from '@nestjs/swagger';
import { Sessions } from 'generated/prisma/browser';
import { SessionsPipe } from 'src/sessions/pipes/sessions.pipe';
import { Sport } from 'src/shared/constants/constants';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import {
  CreateBadmintonRatingDto,
  CreateBasketRatingDto,
  CreateFootRatingDto,
  CreatePadelRatingDto,
  CreatePingPongRatingDto,
  CreateRatingDto,
  CreateTennisRatingDto,
  CreateVolleyRatingDto,
} from './dto/input/create-rating.dto';
import { RatingsService } from './ratings.service';

@Controller('ratings')
@ApiExtraModels(
  CreateBasketRatingDto,
  CreateFootRatingDto,
  CreateBadmintonRatingDto,
  CreatePingPongRatingDto,
  CreatePadelRatingDto,
  CreateTennisRatingDto,
  CreateVolleyRatingDto,
)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post(':sessionUid')
  @ApiParam({ name: 'sessionUid', type: 'string' })
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(CreateBasketRatingDto) },
        { $ref: getSchemaPath(CreateFootRatingDto) },
        { $ref: getSchemaPath(CreateBadmintonRatingDto) },
        { $ref: getSchemaPath(CreatePingPongRatingDto) },
        { $ref: getSchemaPath(CreatePadelRatingDto) },
        { $ref: getSchemaPath(CreateTennisRatingDto) },
        { $ref: getSchemaPath(CreateVolleyRatingDto) },
      ],
      discriminator: {
        propertyName: 'sport',
        mapping: {
          [Sport.BASKETBALL]: getSchemaPath(CreateBasketRatingDto),
          [Sport.FOOTBALL]: getSchemaPath(CreateFootRatingDto),
          [Sport.BADMINTON]: getSchemaPath(CreateBadmintonRatingDto),
          [Sport.PING_PONG]: getSchemaPath(CreatePingPongRatingDto),
          [Sport.PADEL]: getSchemaPath(CreatePadelRatingDto),
          [Sport.TENNIS]: getSchemaPath(CreateTennisRatingDto),
          [Sport.VOLLEYBALL]: getSchemaPath(CreateVolleyRatingDto),
        },
      },
    },
  })
  createMany(
    @Body() ratings: CreateRatingDto[],
    @Param('sessionUid', SessionsPipe) session: Sessions,
    @CurrentUser('uid') evaluatorUid: string,
  ) {
    return this.ratingsService.createMany(ratings, evaluatorUid, session);
  }
}
