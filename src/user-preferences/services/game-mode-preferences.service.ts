import { PinoLogger } from 'nestjs-pino';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';

import { UpdateGameModePreferenceDto } from '../dto/input/update-game-mode-preference.dto';
import { CreateGameModePreferencesDto } from '../dto/input/create-game-mode-preferences.dto';
import { GameModePreferenceResponseData } from '../dto/output/game-mode-preference-response.dto';

@Injectable()
export class GameModePreferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly usersService: UsersService,
  ) {
    this.logger.setContext(GameModePreferencesService.name);
  }

  async create(dto: CreateGameModePreferencesDto): Promise<GameModePreferenceResponseData> {
    const { gameMode, sport, userUid } = dto;
    const existingUser = await this.usersService.findOne(userUid, USERSELECT.checkIfUserExists);
    if (!existingUser) {
      this.logger.error(`User not found: ${userUid}`);
      throw new NotFoundException('User not found');
    }
    const existingSportPreference = await this.prisma.userSportPreferences.findFirst({
      where: { sport, userUid },
    });

    if (!existingSportPreference) {
      this.logger.error(`Sport preference not found: ${sport} for user: ${userUid}`);
      throw new BadRequestException(
        'You must set a sport preference before setting a game mode preference',
      );
    }
    const existingGameModePreference = await this.prisma.userGameModePreferences.findFirst({
      where: { gameMode, sport, userUid },
    });
    if (existingGameModePreference) {
      this.logger.error(`Game mode preference already exists: ${gameMode} for user: ${userUid}`);
      throw new BadRequestException('Game mode preference already exists');
    }
    const newGameModePreference = await this.prisma.userGameModePreferences.create({
      data: { gameMode, sport, userUid },
      select: {
        createdAt: true,
        gameMode: true,
        sport: true,
        uid: true,
      },
    });
    return newGameModePreference;
  }

  async findAllByUserUid(
    userUid: string,
  ): Promise<PaginatedDataDto<GameModePreferenceResponseData>> {
    const existingUser = await this.usersService.findOne(userUid, USERSELECT.checkIfUserExists);
    if (!existingUser) {
      this.logger.error(`User not found: ${userUid}`);
      throw new NotFoundException('User not found');
    }
    const gameModePreferences = await this.prisma.userGameModePreferences.findMany({
      select: {
        createdAt: true,
        gameMode: true,
        sport: true,
        uid: true,
      },
      where: { userUid },
    });
    return { items: gameModePreferences, nextCursor: null, totalCount: gameModePreferences.length };
  }

  async update(uid: string, userUid: string, dto: UpdateGameModePreferenceDto): Promise<void> {
    const { gameMode, sport } = dto;

    const existingGameModePreference = await this.prisma.userGameModePreferences.findFirst({
      where: { uid, userUid },
    });

    if (!existingGameModePreference) {
      this.logger.error(`Game mode preference not found: ${uid}`);
      throw new NotFoundException('Game mode preference not found');
    }

    await this.prisma.userGameModePreferences.update({
      data: { gameMode, sport },
      where: { uid, userUid },
    });
  }

  async remove(uid: string, userUid: string): Promise<void> {
    const existingGameModePreference = await this.prisma.userGameModePreferences.findFirst({
      where: { uid, userUid },
    });
    if (!existingGameModePreference) {
      this.logger.error(`Game mode preference not found: ${uid}`);
      throw new NotFoundException('Game mode preference not found');
    }

    await this.prisma.userGameModePreferences.delete({ where: { uid, userUid } });
    this.logger.debug(`Game mode preference deleted: ${uid}`);
    return;
  }
}
