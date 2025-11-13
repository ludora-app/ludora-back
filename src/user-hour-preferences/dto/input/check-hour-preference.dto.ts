import { TimePeriod } from '@prisma/client';

/**
 * @description
 * This DTO is used to check if a user already has a recurrenthour preference for a given day and time period
 * No need for class-validator decorators here because the data is already validated
 *
 */
export class CheckHourPreferenceDto {
  userUid: string;
  dayOfWeek: number;
  timePeriod: TimePeriod;
}
