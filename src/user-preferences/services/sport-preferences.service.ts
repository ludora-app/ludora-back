import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { SportsService } from 'src/sports/sports.service';
import { CreateSportPreferenceData } from '../dto/input/create-sport-preference.dto';
import { SportPreferenceResponseData } from '../dto/output/sport-preference.response.dto';
import { SportPreferencesMapper } from '../mappers/sport-preferences.mapper';

@Injectable()
export class SportPreferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sportsService: SportsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SportPreferencesService.name);
  }

  async findAllByUserUid(userUid: string): Promise<PaginatedDataDto<SportPreferenceResponseData>> {
    const existingUser = await this.prisma.users.findUnique({
      select: { uid: true },
      where: { uid: userUid },
    });
    if (!existingUser) {
      this.logger.error(`User not found: ${userUid}`);
      throw new NotFoundException('User not found');
    }
    const sportPreferences = await this.prisma.userSportPreferences.findMany({
      select: {
        level: true,
        sport: true,
        uid: true,
        userGameModePreferences: {
          select: {
            gameMode: true,
            uid: true,
          },
        },
      },
      where: { userUid },
    });

    const sportPreferencesWithGameModes = sportPreferences.map((sportPreference) =>
      SportPreferencesMapper.toSimpleDisplay(sportPreference),
    );
    return {
      items: sportPreferencesWithGameModes,
      nextCursor: null,
      totalCount: sportPreferences.length,
    };
  }

  async findOne(uid: string): Promise<SportPreferenceResponseData> {
    const existingSportPreference = await this.prisma.userSportPreferences.findUnique({
      select: {
        level: true,
        sport: true,
        uid: true,
        userGameModePreferences: {
          select: {
            gameMode: true,
            uid: true,
          },
        },
      },
      where: { uid },
    });

    if (!existingSportPreference) {
      throw new NotFoundException('Sport preference not found');
    }
    return SportPreferencesMapper.toSimpleDisplay(existingSportPreference);
  }

  /**
   * Clears all the sport/game mode preferences of the connected user.
   */
  async clearPreferences(userUid: string): Promise<void> {
    await this.prisma.userSportPreferences.deleteMany({ where: { userUid } });
    await this.prisma.userGameModePreferences.deleteMany({ where: { userUid } });
    this.logger.debug(`All sport preferences cleared for user: ${userUid}`);
  }

  async createManyWithGameModes(preferences: CreateSportPreferenceData[], userUid: string) {
    // Validate that each preference has a unique sport
    const sports = preferences.map((pref) => pref.sport);
    const uniqueSports = new Set(sports);

    if (uniqueSports.size !== sports.length) {
      this.logger.warn(`Each sport preference must have a unique sport.`);
      throw new BadRequestException('Each sport preference must have a unique sport.');
    }

    // Validate every preference before clearing the existing ones
    for (const pref of preferences) {
      await this.sportsService.assertAllowed(pref.sport, pref.gameModes);
    }

    await this.clearPreferences(userUid);
    await this.prisma.$transaction(async (tx) => {
      for (const pref of preferences) {
        await tx.userSportPreferences.create({
          data: { level: pref.level, sport: pref.sport, userUid },
        });
        for (const gameMode of pref.gameModes) {
          await tx.userGameModePreferences.create({
            data: { gameMode, sport: pref.sport, userUid },
          });
        }
      }
    });
    this.logger.debug(`${preferences.length} sport preferences created`);
  }
}
