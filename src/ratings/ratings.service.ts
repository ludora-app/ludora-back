import { BadRequestException, Injectable } from '@nestjs/common';
import { RatingStatus, Sessions } from 'generated/prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { SessionPlayersService } from 'src/sessions/services/session-players.service';
import { Sport } from 'src/shared/constants/constants';
import { PrismaService } from './../prisma/prisma.service';
import { CreateRatingDto } from './dto/input/create-rating.dto';
import { RatingsMapper } from './mappers/ratings.mapper';

@Injectable()
export class RatingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly playersService: SessionPlayersService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RatingsService.name);
  }

  async createMany(createRatingDto: CreateRatingDto[], evaluatorUid: string, session: Sessions) {
    const userUids = createRatingDto.map((rating) => rating.evaluatedUid);
    userUids.push(evaluatorUid);

    await this.verifyBeforeCreate(userUids, session);

    const ratings = createRatingDto.map((rating) =>
      RatingsMapper.toEntity(rating, evaluatorUid, session.uid, session.sport as Sport),
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.userRatings.createMany({
        data: ratings,
        skipDuplicates: true,
      });
      await this.playersService.updateRatingStatus(
        evaluatorUid,
        session.uid,
        RatingStatus.VALIDATED,
        tx,
      );
    });

    this.logger.debug(
      `Ratings created successfully for player ${evaluatorUid} in session ${session.uid}`,
    );
  }

  private async verifyBeforeCreate(userUids: string[], session: Sessions) {
    if (session.endDate < new Date()) {
      throw new BadRequestException('You cannot rate a session after it has ended');
    }
    const areAllPlayers = await this.playersService.checkIfUsersArePlayers(session.uid, userUids);

    if (!areAllPlayers) {
      this.logger.error(
        `Error while creating ratings: Not all users are players of this session [${session.uid}]`,
      );
      throw new BadRequestException('Not all users are players of this session');
    }
  }
}
