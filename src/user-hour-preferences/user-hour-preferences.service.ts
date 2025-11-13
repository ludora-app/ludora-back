import { PinoLogger } from 'nestjs-pino';
import { UserHourPreferences } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { CheckHourPreferenceDto } from './dto/input/check-hour-preference.dto';
import { CreateUserHourPreferenceDto } from './dto/input/create-user-hour-preference.dto';
import { UpdateUserHourPreferenceDto } from './dto/input/update-user-hour-preference.dto';

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
    const { dayOfWeek, preferenceType, timePeriod } = createUserHourPreferenceDto;

    if (!existingUser) {
      this.logger.error(`User not found: ${userUid}`);
      throw new NotFoundException('User not found');
    }

    const existingHourPreference = await this.checkIfHourPreferenceExists({
      dayOfWeek,
      timePeriod,
      userUid,
    });
    if (existingHourPreference)
      throw new BadRequestException(
        'An hour preference already exists for this day and time period',
      );

    const newHourPreference = await this.prisma.userHourPreferences.create({
      data: {
        dayOfWeek,
        timePeriod,
        type: preferenceType,
        userUid,
      },
    });
    return newHourPreference;
  }

  findAllByUserUid(userUid: string) {
    return `This action returns all userHourPreferences`;
  }

  /**
   * This TypeScript function checks if a specific hour preference exists for a user.
   * @param {CheckHourPreferenceDto} checkHourPreferenceDto - The `checkHourPreferenceDto` parameter
   * contains the following properties:
   * @returns The function `checkIfHourPreferenceExists` is returning a boolean value - `true` if an
   * existing hour preference is found for the specified day of week, time period, and user UID, and
   * `false` if no existing hour preference is found.
   */
  async checkIfHourPreferenceExists(checkHourPreferenceDto: CheckHourPreferenceDto) {
    const { dayOfWeek, timePeriod, userUid } = checkHourPreferenceDto;
    const existingHourPreference = await this.prisma.userHourPreferences.findFirst({
      where: { dayOfWeek, timePeriod, userUid },
    });
    this.logger.debug(`Existing hour preference: ${existingHourPreference}`);
    return existingHourPreference ? true : false;
  }

  findOne(id: number) {
    return `This action returns a #${id} userHourPreference`;
  }

  update(id: number, updateUserHourPreferenceDto: UpdateUserHourPreferenceDto) {
    return `This action updates a #${id} userHourPreference`;
  }

  remove(id: number) {
    return `This action removes a #${id} userHourPreference`;
  }
}
