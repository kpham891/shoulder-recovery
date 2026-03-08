import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getTimeForOption, toLocalInput } from '../drinks/time-chips';

describe('TimeChips — utility functions', () => {
  it('"Now" option returns a local time string close to now', () => {
    const nowLocal = toLocalInput(new Date());
    const result = getTimeForOption('now');
    expect(result).toBe(nowLocal);
  });

  it('"1h ago" option returns a local time string close to 1 hour ago', () => {
    const oneHourAgo = toLocalInput(new Date(Date.now() - 3600 * 1000));
    const result = getTimeForOption('1h');
    expect(result).toBe(oneHourAgo);
  });

  it('"30m ago" option returns a local time string close to 30 min ago', () => {
    const thirtyMinAgo = toLocalInput(new Date(Date.now() - 30 * 60 * 1000));
    const result = getTimeForOption('30m');
    expect(result).toBe(thirtyMinAgo);
  });

  it('"2h ago" option returns a local time string close to 2 hours ago', () => {
    const twoHoursAgo = toLocalInput(new Date(Date.now() - 120 * 60 * 1000));
    const result = getTimeForOption('2h');
    expect(result).toBe(twoHoursAgo);
  });

  it('toLocalInput produces a valid datetime-local format', () => {
    const result = toLocalInput(new Date('2025-06-15T14:30:00Z'));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
