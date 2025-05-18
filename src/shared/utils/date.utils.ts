import * as dayjs from 'dayjs';
import 'dayjs/locale/fr';

export class DateUtils {
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
  public static formatDate(date: string) {
    return dayjs(date).format('DD/MM/YYYY');
  }

  /**
   * Format the hour to be displayed as hh:mm
   * @param date - The date to format
   * @returns The formatted hour
   */
  public static formatHour(date: string) {
    return dayjs(date).format('HH:mm');
  }

  /**
   * Format the day of the week to be displayed as dddd DD/MM
   * @param date - The date to format
   * @returns The formatted day of the week
   * @returns "Aujourd'hui" if the date is today
   * @returns "Hier" if the date is yesterday
   */
  public static getDayOfWeek(date: string) {
    return dayjs(date)
      .locale('fr')
      .format('dddd DD/MM')
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  public static getEstimatedTime(startDate: string, endDate: string) {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const durationInMinutes = end.diff(start, 'minutes');
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    return `${hours}h${minutes > 0 ? minutes : ''}`;
  }
}
