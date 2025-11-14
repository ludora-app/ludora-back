import { PinoLogger } from 'nestjs-pino';
import { UsersService } from 'src/users/users.service';
import { DateUtils } from 'src/shared/utils/date.utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { UserHourPreferences, UserHourPreferenceType } from '@prisma/client';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { CheckHourPreferenceDto } from './dto/input/check-hour-preference.dto';
import { CreateUserHourPreferenceDto } from './dto/input/create-user-hour-preference.dto';

@Injectable()
export class UserHourPreferencesService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UserHourPreferencesService.name);
  }

  async create(
    userUid: string,
    createUserHourPreferenceDto: CreateUserHourPreferenceDto,
  ): Promise<UserHourPreferences> {
    const existingUser = await this.usersService.findOne(userUid, USERSELECT.checkIfUserExists);
    const { date, dayOfWeek, preferenceType, timePeriod } = createUserHourPreferenceDto;

    if (!existingUser) {
      this.logger.error(`User not found: ${userUid}`);
      throw new NotFoundException('User not found');
    }

    // ? if the preference type is one time, we need to get the day of the week number from the date
    const dayOfWeekNumber =
      preferenceType === UserHourPreferenceType.ONE_TIME
        ? DateUtils.getDayOfWeekNumber(date)
        : dayOfWeek;

    const existingHourPreference = await this.checkIfRecurrentHourPreferenceExists({
      dayOfWeek: dayOfWeekNumber,
      timePeriod,
      userUid,
    });

    if (existingHourPreference)
      throw new BadRequestException(
        'An hour preference already exists for this day and time period',
      );
    let newHourPreference;
    if (preferenceType === UserHourPreferenceType.ONE_TIME) {
      // ? check if the date is in the past
      if (new Date(date) < new Date()) throw new BadRequestException('The date is in the past');

      newHourPreference = await this.prisma.userHourPreferences.create({
        data: {
          date,
          dayOfWeek: dayOfWeekNumber,
          timePeriod,
          type: preferenceType,
          userUid,
        },
      });
    } else {
      newHourPreference = await this.prisma.userHourPreferences.create({
        data: {
          dayOfWeek,
          timePeriod,
          type: preferenceType,
          userUid,
        },
      });
    }

    return newHourPreference;
  }

  async findAllByUserUid(
    userUid: string,
  ): Promise<{ items: UserHourPreferences[]; nextCursor: string | null; totalCount: number }> {
    const existingUser = await this.usersService.findOne(userUid, USERSELECT.checkIfUserExists);
    if (!existingUser) {
      this.logger.error(`User not found: ${userUid}`);
      throw new NotFoundException('User not found');
    }
    this.logger.debug(`Finding all hour preferences for user: ${userUid}`);
    const hourPreferences = await this.prisma.userHourPreferences.findMany({
      where: {
        OR: [
          { type: UserHourPreferenceType.RECURRENT, userUid },
          { date: { gt: new Date() }, userUid },
        ],
      },
    });
    return { items: hourPreferences, nextCursor: null, totalCount: hourPreferences.length };
  }

  /**
   * This TypeScript function checks if a specific hour preference exists for a user.
   * @param {CheckHourPreferenceDto} checkHourPreferenceDto - The `checkHourPreferenceDto` parameter
   * contains the following properties:
   * @returns The function `checkIfHourPreferenceExists` is returning a boolean value - `true` if an
   * existing hour preference is found for the specified day of week, time period, and user UID, and
   * `false` if no existing hour preference is found.
   */
  async checkIfRecurrentHourPreferenceExists(checkHourPreferenceDto: CheckHourPreferenceDto) {
    const { dayOfWeek, timePeriod, userUid } = checkHourPreferenceDto;
    const existingHourPreference = await this.prisma.userHourPreferences.findFirst({
      where: { dayOfWeek, timePeriod, userUid },
    });
    this.logger.debug(`Existing hour preference: ${existingHourPreference}`);
    return existingHourPreference ? true : false;
  }

  async findOne(uid: string) {
    return await this.prisma.userHourPreferences.findUnique({
      where: { uid },
    });
  }

  async remove(uid: string, userUid: string): Promise<void> {
    const existingHourPreference = await this.findOne(uid);

    if (!existingHourPreference || existingHourPreference.userUid !== userUid) {
      this.logger.error(`Hour preference not found: ${uid}`);
      throw new NotFoundException('Hour preference not found');
    }

    await this.prisma.userHourPreferences.delete({ where: { uid } });
    this.logger.info(`Hour preference deleted: ${uid}`);
  }
}
