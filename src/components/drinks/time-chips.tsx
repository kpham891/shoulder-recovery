'use client';

import { useState, useEffect, useRef } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

type TimeOption = 'now' | '30m' | '1h' | '2h' | 'custom';

interface TimeChipsProps {
  value: string; // local datetime string (YYYY-MM-DDTHH:MM)
  onChange: (localDatetimeString: string) => void;
}

const QUICK_OPTIONS: { key: Exclude<TimeOption, 'custom'>; label: string }[] = [
  { key: 'now', label: 'Now' },
  { key: '30m', label: '30m ago' },
  { key: '1h', label: '1h ago' },
  { key: '2h', label: '2h ago' },
];

function toLocalInput(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function getTimeForOption(option: TimeOption): string {
  const now = new Date();
  switch (option) {
    case 'now': return toLocalInput(now);
    case '30m': return toLocalInput(new Date(now.getTime() - 30 * 60 * 1000));
    case '1h': return toLocalInput(new Date(now.getTime() - 60 * 60 * 1000));
    case '2h': return toLocalInput(new Date(now.getTime() - 120 * 60 * 1000));
    default: return toLocalInput(now);
  }
}

function formatHumanTime(localStr: string): string {
  if (!localStr) return '';
  const d = new Date(localStr);
  const time = format(d, 'h:mm a');
  if (isToday(d)) return `Today, ${time}`;
  if (isYesterday(d)) return `Yesterday, ${time}`;
  return format(d, 'MMM d, h:mm a');
}

function formatCustomChipLabel(localStr: string): string {
  if (!localStr) return 'Custom';
  const d = new Date(localStr);
  return format(d, 'MMM d, h:mm a');
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 15, 30, 45];

function CustomTimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const d = value ? new Date(value) : new Date();
  const [selectedDay, setSelectedDay] = useState<Date>(d);
  const [hour, setHour] = useState(() => {
    const h = d.getHours() % 12;
    return h === 0 ? 12 : h;
  });
  const [minute, setMinute] = useState(() => {
    const m = d.getMinutes();
    return MINUTES.reduce((prev, curr) => (Math.abs(curr - m) < Math.abs(prev - m) ? curr : prev));
  });
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(() => (d.getHours() >= 12 ? 'PM' : 'AM'));

  useEffect(() => {
    const result = new Date(selectedDay);
    let h24 = hour % 12;
    if (ampm === 'PM') h24 += 12;
    result.setHours(h24, minute, 0, 0);
    onChange(toLocalInput(result));
  }, [selectedDay, hour, minute, ampm]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      <DayPicker
        mode="single"
        selected={selectedDay}
        onSelect={(day) => day && setSelectedDay(day)}
        disabled={{ after: new Date() }}
        classNames={{
          root: 'text-sm',
          months: 'flex flex-col',
          month_caption: 'flex justify-center py-1 font-medium dark:text-white',
          nav: 'flex items-center justify-between absolute inset-x-0 top-0 px-2 py-1',
          button_previous: 'p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300',
          button_next: 'p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300',
          month_grid: 'w-full border-collapse',
          weekdays: 'flex',
          weekday: 'flex-1 text-center text-xs text-gray-400 dark:text-gray-500 py-1',
          week: 'flex',
          day: 'flex-1 text-center',
          day_button: 'w-8 h-8 mx-auto rounded-full text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors',
          selected: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-full',
          today: 'font-bold',
          disabled: 'text-gray-300 dark:text-gray-600 cursor-not-allowed hover:bg-transparent',
          outside: 'text-gray-300 dark:text-gray-600',
        }}
      />
      <div className="flex items-center gap-2">
        <select
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          className="flex-1 h-10 rounded-md border bg-background px-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          aria-label="Hour"
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span className="text-gray-400 dark:text-gray-500 font-bold">:</span>
        <select
          value={minute}
          onChange={(e) => setMinute(Number(e.target.value))}
          className="flex-1 h-10 rounded-md border bg-background px-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          aria-label="Minute"
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
          ))}
        </select>
        <div className="flex rounded-full border dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            onClick={() => setAmpm('AM')}
            className={`px-3 py-2 text-xs font-semibold transition-colors ${
              ampm === 'AM'
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => setAmpm('PM')}
            className={`px-3 py-2 text-xs font-semibold transition-colors ${
              ampm === 'PM'
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
}

export function TimeChips({ value, onChange }: TimeChipsProps) {
  const [selected, setSelected] = useState<TimeOption>('now');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const customLabel = selected === 'custom' ? formatCustomChipLabel(value) : 'Custom';

  function handleSelect(option: Exclude<TimeOption, 'custom'>) {
    setSelected(option);
    onChange(getTimeForOption(option));
  }

  function handleCustomSelect() {
    setSelected('custom');
  }

  const humanTime = formatHumanTime(value);

  return (
    <div className="space-y-2" data-testid="time-chips">
      {/* Human-readable summary */}
      {humanTime && (
        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{humanTime}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {QUICK_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            data-testid={`time-chip-${opt.key}`}
            onClick={() => handleSelect(opt.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selected === opt.key
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {opt.label}
          </button>
        ))}

        {/* Desktop: Popover */}
        <div className="hidden md:block">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                data-testid="time-chip-custom"
                onClick={() => {
                  handleCustomSelect();
                  setPopoverOpen(true);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selected === 'custom'
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {customLabel}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <CustomTimePicker value={value} onChange={onChange} />
            </PopoverContent>
          </Popover>
        </div>

        {/* Mobile: inline toggle */}
        <button
          type="button"
          data-testid="time-chip-custom-mobile"
          onClick={handleCustomSelect}
          className={`md:hidden px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selected === 'custom'
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {customLabel}
        </button>
      </div>

      {/* Mobile: inline custom picker */}
      {selected === 'custom' && (
        <div className="md:hidden" data-testid="custom-time-input">
          <CustomTimePicker value={value} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

export { getTimeForOption, toLocalInput };
