import { PinoLogger } from 'nestjs-pino';
import { UserSports } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class UserSportPreferencesService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UserSportPreferencesService.name);
  }
  async create(sport: string, userUid: string): Promise<UserSports> {
    const existingUser = await this.usersService.findOne(userUid, USERSELECT.checkIfUserExists);

    if (!existingUser) {
      this.logger.error(`User not found: ${userUid}`);
      throw new NotFoundException('User not found');
    }

    const existingSportPreference = await this.prisma.userSports.findFirst({
      where: { sport, userUid },
    });

    if (existingSportPreference) {
      this.logger.error(`Sport preference already exists: ${sport} for user: ${userUid}`);
      throw new BadRequestException('Sport preference already exists');
    }

    const newSportPreference = await this.prisma.userSports.create({
      data: { sport, userUid },
    });

    return newSportPreference;
  }

  async findAllByUserUid(userUid: string): Promise<UserSports[]> {
    const existingUser = await this.usersService.findOne(userUid, USERSELECT.checkIfUserExists);
    if (!existingUser) {
      this.logger.error(`User not found: ${userUid}`);
      throw new NotFoundException('User not found');
    }
    const sportPreferences = await this.prisma.userSports.findMany({
      where: { userUid },
    });
    return sportPreferences;
  }

  async findOne(uid: string): Promise<UserSports> {
    const existingSportPreference = await this.prisma.userSports.findUnique({
      where: { uid },
    });

    return existingSportPreference;
  }

  async remove(uid: string, userUid: string): Promise<void> {
    const existingSportPreference = await this.prisma.userSports.findUnique({
      where: { uid },
    });

    if (!existingSportPreference || existingSportPreference.userUid !== userUid) {
      this.logger.error(`Sport preference not found: ${uid}`);
      throw new NotFoundException('Sport preference not found');
    }

    await this.prisma.userSports.delete({ where: { uid } });
    this.logger.info(`Sport preference deleted: ${uid}`);
  }
}
