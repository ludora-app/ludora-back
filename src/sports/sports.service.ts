import { BadRequestException, Injectable } from '@nestjs/common';
import { GameModes } from 'generated/prisma/enums';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { SportCollectionItemDto } from './dto/output/sport-collection-response.dto';
import { SportMapper } from './mappers/sport.mapper';

@Injectable()
export class SportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SportsService.name);
  }

  /**
   * Lists the opened sports (activatedAt set), ordered by opening date then by name.
   * Not paginated: the table only holds a handful of rows.
   */
  async findAllActivated(): Promise<PaginatedDataDto<SportCollectionItemDto>> {
    this.logger.debug('Fetching activated sports');

    const sports = await this.prisma.sports.findMany({
      orderBy: [{ activatedAt: 'asc' }, { name: 'asc' }],
      select: { gameModes: true, name: true },
      where: { activatedAt: { not: null } },
    });

    this.logger.debug(`${sports.length} activated sports found`);

    return {
      items: SportMapper.fromRawToCollectionItems(sports),
      nextCursor: null,
      totalCount: sports.length,
    };
  }

  /**
   * Checks that a sport is opened and that every given game mode is allowed for it.
   * @throws BadRequestException when the sport is not opened or a game mode is not allowed
   */
  async assertAllowed(sport: string, gameModes: GameModes[]): Promise<void> {
    this.logger.debug(`Checking sport ${sport} with game modes [${gameModes.join(', ')}]`);

    const existingSport = await this.prisma.sports.findUnique({
      select: { activatedAt: true, gameModes: true },
      where: { name: sport.toUpperCase() },
    });

    if (!existingSport?.activatedAt) {
      this.logger.warn(`Sport not available: ${sport}`);
      throw new BadRequestException(`The sport ${sport} is not available`);
    }

    const forbiddenGameModes = gameModes.filter(
      (gameMode) => !existingSport.gameModes.includes(gameMode),
    );

    if (forbiddenGameModes.length > 0) {
      this.logger.warn(
        `Game modes [${forbiddenGameModes.join(', ')}] not allowed for sport ${sport}`,
      );
      throw new BadRequestException(
        `The game mode ${forbiddenGameModes.join(', ')} is not allowed for the sport ${sport}`,
      );
    }
  }
}
