import { describe, expect, it } from 'vitest';
import { addDays, todayBangkok } from '../../src/clock.js';
import { validateGoalRules } from '../../src/features/goals/rules.js';

describe('TEST-F03-07: Bangkok date boundaries and goal rules', () => {
  const bounds = { minMinutes: 1, maxMinutes: 1440 };
  it('accepts today/tomorrow including year rollover', () => {
    expect(() => validateGoalRules({ dailyTargetMinutes: 60, startDate: '2026-12-31' }, bounds, '2026-12-31')).not.toThrow();
    expect(() => validateGoalRules({ dailyTargetMinutes: 60, startDate: '2027-01-01' }, bounds, '2026-12-31')).not.toThrow();
  });
  it('rejects invalid calendar dates, past/far-future dates and fractional/out-of-range targets', () => {
    for (const date of ['2026-02-30', '2026-11-02', '2026-11-05']) {
      expect(() => validateGoalRules({ dailyTargetMinutes: 60, startDate: date }, bounds, '2026-11-03')).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR', status: 422 }));
    }
    for (const target of [0, 1441, 1.5]) {
      expect(() => validateGoalRules({ dailyTargetMinutes: target, startDate: '2026-11-03' }, bounds, '2026-11-03')).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR', status: 422 }));
    }
  });
  it('uses Bangkok midnight, leap day and UTC date arithmetic without host timezone', () => {
    expect(todayBangkok({ now: () => new Date('2026-11-03T16:59:59Z') })).toBe('2026-11-03');
    expect(todayBangkok({ now: () => new Date('2026-11-03T17:00:00Z') })).toBe('2026-11-04');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2028-02-29', 1)).toBe('2028-03-01');
  });
});
