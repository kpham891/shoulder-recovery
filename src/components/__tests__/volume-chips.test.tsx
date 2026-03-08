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

  it('renders correct chip set for wine category (125, 175, 250)', () => {
    render(<VolumeChips category="wine" value={175} onChange={() => {}} />);
    expect(screen.getByTestId('volume-chip-125')).toHaveTextContent('125ml');
    expect(screen.getByTestId('volume-chip-175')).toHaveTextContent('175ml');
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
    // onChange is called on each keystroke
    expect(onChange).toHaveBeenCalled();
  });

  it('manual input updates the selected chip (or deselects all if no chip matches)', () => {
    // Render with a value that doesn't match any chip
    render(<VolumeChips category="beer" value={500} onChange={() => {}} />);
    // No chip should have the active style
    const chips = [250, 330, 375, 440, 568];
    chips.forEach((ml) => {
      expect(screen.getByTestId(`volume-chip-${ml}`).className).not.toContain('bg-blue-600');
    });
  });
});
