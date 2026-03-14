import { Injectable, NotFoundException } from '@nestjs/common';
import { UserHourPreferenceType } from 'generated/prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';

import { HourPreferenceData } from '../dto/input/create-hour-preference.dto';

@Injectable()
export class HourPreferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(HourPreferencesService.name);
  }

  async createMany(hourPreferences: HourPreferenceData[], userUid: string) {
    const validHourPreferences = this.validateHourPreferences(hourPreferences);
    await this.clearPreferences(userUid);

    await this.prisma.$transaction(async (tx) => {
      for (const hourPreference of validHourPreferences) {
        let date: Date | undefined;

        if (hourPreference.date) {
          const parsed = new Date(hourPreference.date);
          if (!Number.isNaN(parsed.getTime())) {
            date = parsed;
          }
        }
        await tx.userHourPreferences.create({
          data: {
            date,
            dayOfWeek: hourPreference.dayOfWeek,
            timePeriod: hourPreference.timePeriod,
            type: hourPreference.type,
            userUid,
          },
        });
      }
    });
    this.logger.debug(`${validHourPreferences.length} hour preferences created`);
  }

  async findAllByUserUid(userUid: string): Promise<PaginatedDataDto<HourPreferenceData>> {
    const existingUser = await this.prisma.users.findUnique({
      select: { uid: true },
      where: { uid: userUid },
    });

    if (!existingUser) {
      this.logger.error(`User not found: ${userUid}`);
      throw new NotFoundException('User not found');
    }
    this.logger.debug(`Finding all hour preferences for user: ${userUid}`);
    const hourPreferences = await this.prisma.userHourPreferences.findMany({
      select: {
        date: true,
        dayOfWeek: true,
        timePeriod: true,
        type: true,
      },
      where: {
        OR: [
          { type: UserHourPreferenceType.RECURRENT, userUid },
          { date: { gt: new Date() }, userUid },
        ],
      },
    });
    return { items: hourPreferences, nextCursor: null, totalCount: hourPreferences.length };
  }

  async findOne(uid: string) {
    return await this.prisma.userHourPreferences.findUnique({
      where: { uid },
    });
  }

  /**
   * Check for duplicates and skip if already covered by a RECURRENT hour preference
   * @param hourPreferences
   * @returns
   */
  private validateHourPreferences(hourPreferences: HourPreferenceData[]): HourPreferenceData[] {
    const validHourPreferences = [];
    // Process RECURRENT first so ONE_TIME can be skipped when covered by a RECURRENT
    const sorted = [...hourPreferences].sort((a, b) =>
      a.type === b.type ? 0 : a.type === UserHourPreferenceType.RECURRENT ? -1 : 1,
    );
    for (const hourPreference of sorted) {
      if (hourPreference.type === UserHourPreferenceType.RECURRENT) {
        const existingPref = validHourPreferences.find(
          (pref) =>
            pref.type === UserHourPreferenceType.RECURRENT &&
            pref.dayOfWeek === hourPreference.dayOfWeek &&
            pref.timePeriod === hourPreference.timePeriod,
        );
        if (!existingPref) {
          validHourPreferences.push(hourPreference);
        } else {
          this.logger.warn(`Recurrent hour preference already exists, skipping`);
        }
      } else {
        // ONE_TIME: skip if already covered by a RECURRENT (same dayOfWeek + timePeriod)
        const dayOfWeekFromDate = hourPreference.date
          ? new Date(hourPreference.date).getUTCDay()
          : undefined;
        const coveredByRecurrent =
          dayOfWeekFromDate !== undefined &&
          validHourPreferences.some(
            (pref) =>
              pref.type === UserHourPreferenceType.RECURRENT &&
              pref.dayOfWeek === dayOfWeekFromDate &&
              pref.timePeriod === hourPreference.timePeriod,
          );
        if (coveredByRecurrent) {
          this.logger.warn(
            `One-time hour preference covered by recurrent (dayOfWeek ${dayOfWeekFromDate}, ${hourPreference.timePeriod}), skipping`,
          );
          continue;
        }
        const existingOneTime = validHourPreferences.find(
          (pref) =>
            pref.type === UserHourPreferenceType.ONE_TIME &&
            pref.date != null &&
            hourPreference.date != null &&
            new Date(pref.date).getTime() === new Date(hourPreference.date).getTime() &&
            pref.timePeriod === hourPreference.timePeriod,
        );
        if (!existingOneTime) {
          validHourPreferences.push(hourPreference);
        } else {
          this.logger.warn(`One-time hour preference already exists, skipping`);
        }
      }
    }
    if (validHourPreferences.length !== hourPreferences.length) {
      this.logger.warn(
        `${hourPreferences.length} hour preferences submitted, but ${validHourPreferences.length} are valid, skipping`,
      );
    }
    return validHourPreferences;
  }

  async clearPreferences(userUid: string): Promise<void> {
    await this.prisma.userHourPreferences.deleteMany({ where: { userUid } });
    this.logger.debug(`${userUid} hour preferences cleared`);
  }
}
