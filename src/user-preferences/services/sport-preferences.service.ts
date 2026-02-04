import { PinoLogger } from 'nestjs-pino';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';

import { CreateSportPreferenceDto } from '../dto/input/create-sport-preference.dto';
import { SportPreferenceResponseData } from '../dto/output/sport-preference.response.dto';

@Injectable()
export class SportPreferencesService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SportPreferencesService.name);
  }
  async create(
    createSportPreferenceDto: CreateSportPreferenceDto,
  ): Promise<SportPreferenceResponseData> {
    const { level, sport, userUid } = createSportPreferenceDto;
    const existingUser = await this.usersService.findOne(userUid, USERSELECT.checkIfUserExists);

    if (!existingUser) {
      this.logger.error(`User not found: ${userUid}`);
      throw new NotFoundException('User not found');
    }

    const existingSportPreference = await this.prisma.userSportPreferences.findFirst({
      where: { sport, userUid },
    });

    if (existingSportPreference) {
      this.logger.error(`Sport preference already exists: ${sport} for user: ${userUid}`);
      throw new BadRequestException('Sport preference already exists');
    }

    const newSportPreference = await this.prisma.userSportPreferences.create({
      data: { level, sport, userUid },
    });

    return newSportPreference;
  }

  async findAllByUserUid(userUid: string): Promise<PaginatedDataDto<SportPreferenceResponseData>> {
    const existingUser = await this.usersService.findOne(userUid, USERSELECT.checkIfUserExists);
    if (!existingUser) {
      this.logger.error(`User not found: ${userUid}`);
      throw new NotFoundException('User not found');
    }
    const sportPreferences = await this.prisma.userSportPreferences.findMany({
      select: {
        createdAt: true,
        level: true,
        sport: true,
        uid: true,
      },
      where: { userUid },
    });
    return { items: sportPreferences, nextCursor: null, totalCount: sportPreferences.length };
  }

  async findOne(uid: string): Promise<SportPreferenceResponseData> {
    const existingSportPreference = await this.prisma.userSportPreferences.findUnique({
      select: {
        createdAt: true,
        level: true,
        sport: true,
        uid: true,
      },
      where: { uid },
    });

    return existingSportPreference;
  }

  async remove(uid: string, userUid: string): Promise<void> {
    const existingSportPreference = await this.prisma.userSportPreferences.findUnique({
      where: { uid },
    });

    if (!existingSportPreference || existingSportPreference.userUid !== userUid) {
      this.logger.error(`Sport preference not found: ${uid}`);
      throw new NotFoundException('Sport preference not found');
    }

    await this.prisma.userSportPreferences.delete({ where: { uid } });
    this.logger.info(`Sport preference deleted: ${uid}`);
  }
}
