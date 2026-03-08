import { describe, it, expect } from 'vitest';
import { calculateUnits, displayUnits } from '../units-calculator';

describe('calculateUnits', () => {
  it('330ml at 5% quantity 1 → 1.65', () => {
    expect(calculateUnits(330, 5, 1)).toBeCloseTo(1.65, 5);
  });

  it('330ml at 5% displays as 1.7', () => {
    expect(displayUnits(calculateUnits(330, 5, 1))).toBe(1.7);
  });

  it('568ml at 4% quantity 1 → 2.272', () => {
    expect(calculateUnits(568, 4, 1)).toBeCloseTo(2.272, 5);
  });

  it('568ml at 4% displays as 2.3', () => {
    expect(displayUnits(calculateUnits(568, 4, 1))).toBe(2.3);
  });

  it('175ml at 13% quantity 1 → 2.275 (medium wine)', () => {
    expect(calculateUnits(175, 13, 1)).toBeCloseTo(2.275, 5);
  });

  it('25ml at 40% quantity 1 → 1.0 (shot)', () => {
    expect(calculateUnits(25, 40, 1)).toBeCloseTo(1.0, 5);
  });

  it('330ml at 5% quantity 2 → 3.3 (quantity multiplier)', () => {
    expect(calculateUnits(330, 5, 2)).toBeCloseTo(3.3, 5);
  });

  it('quantity 0 returns 0', () => {
    expect(calculateUnits(330, 5, 0)).toBe(0);
  });

  it('negative quantity throws', () => {
    expect(() => calculateUnits(330, 5, -1)).toThrow();
  });

  it('zero volume returns 0', () => {
    expect(calculateUnits(0, 5, 1)).toBe(0);
  });

  it('zero ABV returns 0 (non-alcoholic)', () => {
    expect(calculateUnits(330, 0, 1)).toBe(0);
  });

  it('large values: 1000ml at 15% quantity 5 → correct result', () => {
    // 5 * (1000 * 15) / 1000 = 75
    const result = calculateUnits(1000, 15, 5);
    expect(result).toBeCloseTo(75, 5);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('default quantity is 1', () => {
    expect(calculateUnits(330, 5)).toBeCloseTo(1.65, 5);
  });
});
