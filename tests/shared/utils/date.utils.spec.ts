import { DateUtils } from '../../../src/shared/utils/date.utils';

describe('DateUtils', () => {
  describe('getHoursForPeriod', () => {
    it('should cover 6:00 to midnight without gap between the periods', () => {
      const morning = DateUtils.getHoursForPeriod('MORNING');
      const afternoon = DateUtils.getHoursForPeriod('AFTERNOON');
      const evening = DateUtils.getHoursForPeriod('EVENING');

      expect(morning).toEqual({ max: 12, min: 6 });
      expect(afternoon).toEqual({ max: 17, min: 12 });
      expect(evening).toEqual({ max: 24, min: 17 });
    });

    it('should return the whole day for an unknown period', () => {
      expect(DateUtils.getHoursForPeriod('UNKNOWN')).toEqual({ max: 24, min: 0 });
    });
  });

  describe('getPeriodForHour', () => {
    it.each([
      [6, 'MORNING'],
      [11, 'MORNING'],
      [12, 'AFTERNOON'],
      [16, 'AFTERNOON'],
      [17, 'EVENING'],
      [23, 'EVENING'],
    ])('should put %i:00 in the %s', (hour, period) => {
      expect(DateUtils.getPeriodForHour(hour)).toBe(period);
    });

    it('should return null before 6:00', () => {
      expect(DateUtils.getPeriodForHour(5)).toBeNull();
    });
  });
});
