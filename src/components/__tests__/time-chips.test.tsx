import { describe, it, expect } from 'vitest';
import { getDateForOption, toLocalInput } from '../drinks/time-chips';

describe('TimeChips — utility functions', () => {
  it('"today" option returns noon today as a local datetime string', () => {
    const result = getDateForOption('today');
    const expected = toLocalInput(new Date());
    expect(result).toBe(expected);
    // Verify it's noon
    expect(result).toMatch(/T12:00$/);
  });

  it('"yesterday" option returns noon yesterday', () => {
    const result = getDateForOption('yesterday');
    const yesterday = new Date(Date.now() - 86400 * 1000);
    const expected = toLocalInput(yesterday);
    expect(result).toBe(expected);
    expect(result).toMatch(/T12:00$/);
  });

  it('"2days" option returns noon two days ago', () => {
    const result = getDateForOption('2days');
    const twoDaysAgo = new Date(Date.now() - 2 * 86400 * 1000);
    const expected = toLocalInput(twoDaysAgo);
    expect(result).toBe(expected);
    expect(result).toMatch(/T12:00$/);
  });

  it('toLocalInput always produces noon in YYYY-MM-DDTHH:MM format', () => {
    const result = toLocalInput(new Date('2025-06-15T14:30:00Z'));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T12:00$/);
  });

  it('toLocalInput sets time to noon regardless of input time', () => {
    const morning = toLocalInput(new Date('2025-06-15T03:00:00'));
    const evening = toLocalInput(new Date('2025-06-15T23:00:00'));
    // Same date, both noon
    expect(morning).toBe(evening);
    expect(morning).toMatch(/T12:00$/);
  });
});
