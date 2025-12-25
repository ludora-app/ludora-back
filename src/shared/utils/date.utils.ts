import * as dayjs from 'dayjs';
import 'dayjs/locale/fr';

export class DateUtils {
  /**
   * @type {number}
   * @description The number of milliseconds in 15 minutes
   */
  static readonly FIFTEEN_MINUTES = 15 * 60 * 1000;
  /**
   * @type {number}
   * @description The number of milliseconds in 24 hours
   */
  static readonly TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  /**
   * @type {number}
   * @description The number of milliseconds in 7 days
   */
  static readonly SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  /**
   * The method `timeStringToMinutes` converts a time string in the format "HH:MM" to the total number
   * of minutes.
   * @param {string} time - A string representing time in the format "HH:MM"
   * @returns The method `timeStringToMinutes` takes a time string in the format "HH:MM" and converts
   * it to the total number of minutes. The method splits the time string at the colon ":" and maps the
   * resulting array of strings to numbers. It then calculates the total number of minutes by multiplying
   * the hours by 60 and adding the minutes. The method returns the total number of minutes as a
   */
  public static timeStringToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * The method `formatDate` takes a date string as input and returns the date formatted as
   * 'DD/MM/YYYY'.
   * @param {string} date - The `formatDate` method takes a date string as input and uses the `dayjs`
   * library to format it in the 'DD/MM/YYYY' format. You can pass a date string in any valid format to
   * this method, and it will return the date in the specified format.
   * @returns The method `formatDate` takes a date string as input, formats it using the dayjs library
   * to the format 'DD/MM/YYYY', and returns the formatted date string.
   */
  public static formatDate(date: string): string {
    return dayjs(date).format('DD/MM/YYYY');
  }

  /**
   * Format the hour to be displayed as hh:mm
   * @param date - The date to format
   * @returns The formatted hour
   */
  public static formatHour(date: string): string {
    return dayjs(date).format('HH:mm');
  }

  /**
   * Format the day of the week to be displayed as dddd DD/MM
   * @param date - The date to format
   * @returns The formatted day of the week
   * @returns "Aujourd'hui" if the date is today
   * @returns "Hier" if the date is yesterday
   */
  public static getDayOfWeek(date: string): string {
    return dayjs(date)
      .locale('fr')
      .format('dddd DD/MM')
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  /**
   * Get the day of the week number from a date (0 is Sunday, 6 is Saturday)
   * @param date - The date to get the day of the week number from
   * @returns The day of the week number
   */
  public static getDayOfWeekNumber(date: string): number {
    return dayjs(date).get('day');
  }

  public static getEstimatedTime(startDate: string, endDate: string) {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const durationInMinutes = end.diff(start, 'minutes');
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    return `${hours}h${minutes > 0 ? minutes : ''}`;
  }

  /**
   * Returns the min and max hours for a given time period
   * @param period - The time period (MORNING, AFTERNOON, EVENING)
   * @returns Object with min and max hours
   */
  public static getHoursForPeriod(period: string): { min: number; max: number } {
    switch (period) {
      case 'MORNING':
        return { max: 12, min: 9 };
      case 'AFTERNOON':
        return { max: 17, min: 12 };
      case 'EVENING':
        return { max: 22, min: 17 };
      default:
        return { max: 24, min: 0 }; // Fallback
    }
  }
}
