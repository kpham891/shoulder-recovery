import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuantityStepper } from '../drinks/quantity-stepper';

describe('QuantityStepper', () => {
  it('renders with default value of 1', () => {
    render(<QuantityStepper value={1} onChange={() => {}} />);
    expect(screen.getByTestId('quantity-value')).toHaveTextContent('1');
  });

  it('clicking + increments to 2', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantityStepper value={1} onChange={onChange} />);
    await user.click(screen.getByLabelText('Increase quantity'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('clicking + at max (10) does not call onChange (button disabled)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantityStepper value={10} onChange={onChange} />);
    const plusBtn = screen.getByLabelText('Increase quantity');
    expect(plusBtn).toBeDisabled();
    await user.click(plusBtn);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clicking − from 1 does not go to 0 (button disabled at min)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantityStepper value={1} onChange={onChange} />);
    const minusBtn = screen.getByLabelText('Decrease quantity');
    expect(minusBtn).toBeDisabled();
    await user.click(minusBtn);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clicking − from 3 goes to 2', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantityStepper value={3} onChange={onChange} />);
    await user.click(screen.getByLabelText('Decrease quantity'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('displays current value', () => {
    render(<QuantityStepper value={5} onChange={() => {}} />);
    expect(screen.getByTestId('quantity-value')).toHaveTextContent('5');
  });

  it('calls onChange callback with new value on each change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantityStepper value={4} onChange={onChange} />);
    await user.click(screen.getByLabelText('Increase quantity'));
    expect(onChange).toHaveBeenCalledWith(5);
    await user.click(screen.getByLabelText('Decrease quantity'));
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
