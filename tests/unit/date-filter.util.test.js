const { resolveCreatedAtFilter, parseDateOnly } = require('../../src/utils/date-filter.util');

describe('date-filter.util', () => {
  describe('parseDateOnly', () => {
    it('should return null for empty values', () => {
      expect(parseDateOnly('')).toBeNull();
      expect(parseDateOnly(null)).toBeNull();
      expect(parseDateOnly(undefined)).toBeNull();
    });

    it('should parse the start of a local calendar day', () => {
      const date = parseDateOnly('2026-07-13', false);

      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(6);
      expect(date.getDate()).toBe(13);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
    });

    it('should parse the end of a local calendar day', () => {
      const date = parseDateOnly('2026-07-13', true);

      expect(date.getHours()).toBe(23);
      expect(date.getMinutes()).toBe(59);
      expect(date.getSeconds()).toBe(59);
    });

    it('should reject malformed dates', () => {
      expect(() => parseDateOnly('13/07/2026')).toThrow();

      try {
        parseDateOnly('13/07/2026');
        throw new Error('expected to throw');
      } catch (error) {
        expect(error).toMatchObject({ code: 'INVALID_DATE', statusCode: 400 });
      }
    });

    it('should reject impossible calendar dates', () => {
      expect(() => parseDateOnly('2026-02-31')).toThrow();

      try {
        parseDateOnly('2026-02-31');
      } catch (error) {
        expect(error).toMatchObject({ code: 'INVALID_DATE' });
      }
    });
  });

  describe('resolveCreatedAtFilter', () => {
    it('should return undefined when no dates are provided', () => {
      expect(resolveCreatedAtFilter('', '')).toBeUndefined();
    });

    it('should keep a one-sided start filter', () => {
      const filter = resolveCreatedAtFilter('2026-07-01', undefined);

      expect(filter.gte).toBeInstanceOf(Date);
      expect(filter.lte).toBeUndefined();
    });

    it('should reject an inverted range', () => {
      expect(() => resolveCreatedAtFilter('2026-08-10', '2026-08-01')).toThrow();

      try {
        resolveCreatedAtFilter('2026-08-10', '2026-08-01');
      } catch (error) {
        expect(error).toMatchObject({ code: 'INVALID_DATE_RANGE', statusCode: 400 });
      }
    });
  });
});
