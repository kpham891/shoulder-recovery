'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  value: number | null;
  onChange: (value: number | null) => void;
  allowDecimal?: boolean;
  min?: number;
  max?: number;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, allowDecimal = false, min, max, className, onFocus, onBlur, ...props }, ref) => {
    const [display, setDisplay] = React.useState(() => (value != null ? String(value) : ''));
    const focused = React.useRef(false);

    // Sync display from external value only when not editing
    React.useEffect(() => {
      if (!focused.current) {
        setDisplay(value != null ? String(value) : '');
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      if (raw === '') {
        setDisplay('');
        onChange(null);
        return;
      }

      // Allow a trailing decimal point as an intermediate state
      if (allowDecimal && /^\d*\.$/.test(raw)) {
        setDisplay(raw);
        return;
      }

      const pattern = allowDecimal ? /^\d*\.?\d*$/ : /^\d+$/;
      if (!pattern.test(raw)) return;

      const num = parseFloat(raw);
      if (isNaN(num)) return;

      setDisplay(raw);
      onChange(num);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
      props.onKeyDown?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      focused.current = true;
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      focused.current = false;

      // Normalize trailing decimal on blur
      if (display.endsWith('.')) {
        const num = parseFloat(display);
        const normalized = isNaN(num) ? '' : String(num);
        setDisplay(normalized);
        onChange(isNaN(num) ? null : num);
      }

      // Clamp to min/max on blur
      if (value != null) {
        let clamped = value;
        if (min != null) clamped = Math.max(min, clamped);
        if (max != null) clamped = Math.min(max, clamped);
        if (clamped !== value) {
          setDisplay(String(clamped));
          onChange(clamped);
        }
      }

      onBlur?.(e);
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        value={display}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);
NumberInput.displayName = 'NumberInput';
