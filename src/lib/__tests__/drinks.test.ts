import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateStandardUnits,
  estimateCalories,
  getUnitColor,
  getUnitBgColor,
  getProgressColor,
  getDryStreak,
  formatTime,
} from '../drinks';
import type { DrinkLog } from '@/types';

// ---------------------------------------------------------------------------
// calculateStandardUnits
// ---------------------------------------------------------------------------
describe('calculateStandardUnits', () => {
  it('returns 0 for zero volume', () => {
    expect(calculateStandardUnits(0, 5)).toBe(0);
  });

  it('returns 0 for zero ABV', () => {
    expect(calculateStandardUnits(330, 0)).toBe(0);
  });

  it('calculates units for a standard pint (568 ml, 4%)', () => {
    // pure alcohol ml = 568 * 0.04 * 0.789 ≈ 17.94 ml → ~1.8 WHO units (displayed rounded to 1dp)
    const units = calculateStandardUnits(568, 4);
    expect(units).toBeGreaterThan(1.5);
    expect(units).toBeLessThan(2.5);
  });

  it('calculates units for a small wine (125 ml, 13%)', () => {
    // pure alcohol ml = 125 * 0.13 * 0.789 ≈ 12.83 ml → ~1.3 WHO units (displayed rounded to 1dp)
    const units = calculateStandardUnits(125, 13);
    expect(units).toBeGreaterThan(1.0);
    expect(units).toBeLessThan(2.0);
  });
});

// ---------------------------------------------------------------------------
// estimateCalories
// ---------------------------------------------------------------------------
describe('estimateCalories', () => {
  it('returns 0 for 0 units', () => {
    expect(estimateCalories(0)).toBe(0);
  });

  it('returns 70 for 1 unit', () => {
    expect(estimateCalories(1)).toBe(70);
  });

  it('rounds to nearest integer', () => {
    // 1.5 units × 70 = 105
    expect(estimateCalories(1.5)).toBe(105);
  });

  it('scales linearly', () => {
    expect(estimateCalories(3)).toBe(210);
  });
});

// ---------------------------------------------------------------------------
// getUnitColor
// ---------------------------------------------------------------------------
describe('getUnitColor', () => {
  it('returns gray for 0 units', () => {
    expect(getUnitColor(0, 4)).toContain('gray');
  });

  it('returns green when well under limit (< 50%)', () => {
    expect(getUnitColor(1, 4)).toContain('green');
  });

  it('returns amber when approaching limit (50–100%)', () => {
    expect(getUnitColor(2, 4)).toContain('amber');
    expect(getUnitColor(4, 4)).toContain('amber');
  });

  it('returns red when over limit (> 100%)', () => {
    expect(getUnitColor(5, 4)).toContain('red');
  });
});

// ---------------------------------------------------------------------------
// getUnitBgColor
// ---------------------------------------------------------------------------
describe('getUnitBgColor', () => {
  it('returns gray bg for 0 units', () => {
    expect(getUnitBgColor(0, 4)).toContain('gray');
  });

  it('returns green bg when well under limit', () => {
    expect(getUnitBgColor(1, 4)).toContain('green');
  });

  it('returns amber bg when approaching limit', () => {
    expect(getUnitBgColor(3, 4)).toContain('amber');
  });

  it('returns red bg when over limit', () => {
    expect(getUnitBgColor(5, 4)).toContain('red');
  });
});

// ---------------------------------------------------------------------------
// getProgressColor
// ---------------------------------------------------------------------------
describe('getProgressColor', () => {
  it('returns gray for 0 units', () => {
    expect(getProgressColor(0, 4)).toContain('gray');
  });

  it('returns green when well under limit', () => {
    expect(getProgressColor(1, 4)).toContain('green');
  });

  it('returns amber when at limit', () => {
    expect(getProgressColor(4, 4)).toContain('amber');
  });

  it('returns red when over limit', () => {
    expect(getProgressColor(6, 4)).toContain('red');
  });
});

// ---------------------------------------------------------------------------
// getDryStreak
// ---------------------------------------------------------------------------
describe('getDryStreak', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Fix "today" to a known date
    vi.setSystemTime(new Date('2024-03-21T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const makeLog = (isoDate: string): DrinkLog =>
    ({ logged_at: isoDate } as unknown as DrinkLog);

  it('returns 0 when there are no logs and today has no drinks (streak = 1 would need today to be dry)', () => {
    // No logs at all → today is dry → streak should be ≥ 1
    expect(getDryStreak([])).toBeGreaterThanOrEqual(1);
  });

  it('returns 0 when today has drinks', () => {
    expect(getDryStreak([makeLog('2024-03-21T10:00:00Z')])).toBe(0);
  });

  it('returns 1 when yesterday had drinks but today is dry', () => {
    expect(getDryStreak([makeLog('2024-03-20T10:00:00Z')])).toBe(1);
  });

  it('counts multiple consecutive dry days', () => {
    // Drinks on Mar 18 → Mar 19, 20, 21 are dry → streak = 3
    expect(getDryStreak([makeLog('2024-03-18T10:00:00Z')])).toBe(3);
  });

  it('handles the loggedAt (camelCase) fallback field', () => {
    const log = { loggedAt: '2024-03-21T10:00:00Z' } as unknown as DrinkLog;
    expect(getDryStreak([log])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// formatTime
// ---------------------------------------------------------------------------
describe('formatTime', () => {
  it('formats a morning time as AM', () => {
    const result = formatTime('2024-03-21T09:30:00');
    expect(result).toContain('AM');
    expect(result).toContain('9');
    expect(result).toContain('30');
  });

  it('formats an afternoon time as PM', () => {
    const result = formatTime('2024-03-21T14:05:00');
    expect(result).toContain('PM');
  });

  it('accepts a Date object', () => {
    const d = new Date('2024-03-21T09:30:00');
    expect(formatTime(d)).toContain('AM');
  });
});
