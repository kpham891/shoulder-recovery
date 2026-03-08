import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeChips, getTimeForOption, toLocalInput } from '../drinks/time-chips';

describe('TimeChips', () => {
  it('renders all 5 chips: Now, 30m ago, 1h ago, 2h ago, Custom', () => {
    render(<TimeChips value="" onChange={() => {}} />);
    expect(screen.getByTestId('time-chip-now')).toHaveTextContent('Now');
    expect(screen.getByTestId('time-chip-30m')).toHaveTextContent('30m ago');
    expect(screen.getByTestId('time-chip-1h')).toHaveTextContent('1h ago');
    expect(screen.getByTestId('time-chip-2h')).toHaveTextContent('2h ago');
    expect(screen.getByTestId('time-chip-custom')).toHaveTextContent('Custom');
  });

  it('"Now" is selected by default (has active styling)', () => {
    render(<TimeChips value="" onChange={() => {}} />);
    const nowChip = screen.getByTestId('time-chip-now');
    expect(nowChip.className).toContain('bg-blue-600');
  });

  it('clicking "30m ago" selects it and deselects "Now"', async () => {
    const user = userEvent.setup();
    render(<TimeChips value="" onChange={() => {}} />);
    await user.click(screen.getByTestId('time-chip-30m'));
    expect(screen.getByTestId('time-chip-30m').className).toContain('bg-blue-600');
    expect(screen.getByTestId('time-chip-now').className).not.toContain('bg-blue-600');
  });

  it('clicking "Custom" shows the datetime-local input', async () => {
    const user = userEvent.setup();
    render(<TimeChips value="" onChange={() => {}} />);
    expect(screen.queryByTestId('custom-time-input')).toBeNull();
    await user.click(screen.getByTestId('time-chip-custom'));
    expect(screen.getByTestId('custom-time-input')).toBeTruthy();
  });

  it('clicking "Custom" hides the chips-based selection styling from "Now"', async () => {
    const user = userEvent.setup();
    render(<TimeChips value="" onChange={() => {}} />);
    await user.click(screen.getByTestId('time-chip-custom'));
    expect(screen.getByTestId('time-chip-now').className).not.toContain('bg-blue-600');
    expect(screen.getByTestId('time-chip-custom').className).toContain('bg-blue-600');
  });

  it('"Now" chip returns a local time string close to now', () => {
    const nowLocal = toLocalInput(new Date());
    const result = getTimeForOption('now');
    // Both are local datetime strings in the same format — compare directly
    expect(result).toBe(nowLocal);
  });

  it('"1h ago" chip returns a local time string close to 1 hour ago', () => {
    const oneHourAgo = toLocalInput(new Date(Date.now() - 3600 * 1000));
    const result = getTimeForOption('1h');
    expect(result).toBe(oneHourAgo);
  });
});
