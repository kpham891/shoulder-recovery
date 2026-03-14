import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VolumeChips } from '../drinks/volume-chips';

describe('VolumeChips', () => {
  it('renders correct chip set for beer category (250, 330, 375, 440, 568)', () => {
    render(<VolumeChips category="beer" value={330} onChange={() => {}} />);
    expect(screen.getByTestId('volume-chip-250')).toHaveTextContent('250ml');
    expect(screen.getByTestId('volume-chip-330')).toHaveTextContent('330ml');
    expect(screen.getByTestId('volume-chip-375')).toHaveTextContent('375ml');
    expect(screen.getByTestId('volume-chip-440')).toHaveTextContent('440ml');
    expect(screen.getByTestId('volume-chip-568')).toHaveTextContent('568ml');
  });

  it('renders correct chip set for wine category (125, 175, 250, 750)', () => {
    render(<VolumeChips category="wine" value={175} onChange={() => {}} />);
    expect(screen.getByTestId('volume-chip-125')).toHaveTextContent('125ml');
    expect(screen.getByTestId('volume-chip-175')).toHaveTextContent('175ml');
    expect(screen.getByTestId('volume-chip-250')).toHaveTextContent('250ml');
    expect(screen.getByTestId('volume-chip-750')).toHaveTextContent('750ml');
  });

  it('renders correct chip set for spirits category (30, 60)', () => {
    render(<VolumeChips category="spirits" value={30} onChange={() => {}} />);
    expect(screen.getByTestId('volume-chip-30')).toHaveTextContent('30ml');
    expect(screen.getByTestId('volume-chip-60')).toHaveTextContent('60ml');
  });

  it('renders correct chip set for sake-soju category (30, 50, 180, 300, 360)', () => {
    render(<VolumeChips category="sake-soju" value={180} onChange={() => {}} />);
    expect(screen.getByTestId('volume-chip-30')).toHaveTextContent('30ml');
    expect(screen.getByTestId('volume-chip-50')).toHaveTextContent('50ml');
    expect(screen.getByTestId('volume-chip-180')).toHaveTextContent('180ml');
    expect(screen.getByTestId('volume-chip-300')).toHaveTextContent('300ml');
    expect(screen.getByTestId('volume-chip-360')).toHaveTextContent('360ml');
  });

  it('renders correct chip set for cocktails category (100, 150, 200, 250)', () => {
    render(<VolumeChips category="cocktails" value={200} onChange={() => {}} />);
    expect(screen.getByTestId('volume-chip-100')).toHaveTextContent('100ml');
    expect(screen.getByTestId('volume-chip-150')).toHaveTextContent('150ml');
    expect(screen.getByTestId('volume-chip-200')).toHaveTextContent('200ml');
    expect(screen.getByTestId('volume-chip-250')).toHaveTextContent('250ml');
  });

  it('pre-selects the chip matching the drink default volume', () => {
    render(<VolumeChips category="beer" value={330} onChange={() => {}} />);
    const chip330 = screen.getByTestId('volume-chip-330');
    expect(chip330.className).toContain('bg-blue-600');
  });

  it('clicking a chip calls onChange with the new volume', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<VolumeChips category="beer" value={330} onChange={onChange} />);
    await user.click(screen.getByTestId('volume-chip-440'));
    expect(onChange).toHaveBeenCalledWith(440);
  });

  it('manual input field accepts custom value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<VolumeChips category="beer" value={330} onChange={onChange} />);
    const input = screen.getByTestId('volume-manual-input');
    await user.clear(input);
    await user.type(input, '500');
    expect(onChange).toHaveBeenCalled();
  });

  it('manual input updates the selected chip (or deselects all if no chip matches)', () => {
    render(<VolumeChips category="beer" value={500} onChange={() => {}} />);
    const chips = [250, 330, 375, 440, 568];
    chips.forEach((ml) => {
      expect(screen.getByTestId(`volume-chip-${ml}`).className).not.toContain('bg-blue-600');
    });
  });
});
