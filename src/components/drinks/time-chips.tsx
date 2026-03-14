'use client';

import { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

type DateOption = 'today' | 'yesterday' | '2days' | 'custom';

interface TimeChipsProps {
  value: string; // local datetime string (YYYY-MM-DDTHH:MM)
  onChange: (localDatetimeString: string) => void;
  defaultSelected?: DateOption;
}

const QUICK_OPTIONS: { key: Exclude<DateOption, 'custom'>; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '2days', label: '2 days ago' },
];

/** Convert a Date to a local datetime string at noon */
function toLocalInput(date: Date): string {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function getDateForOption(option: DateOption): string {
  const now = new Date();
  switch (option) {
    case 'today': return toLocalInput(now);
    case 'yesterday': return toLocalInput(new Date(now.getTime() - 86400 * 1000));
    case '2days': return toLocalInput(new Date(now.getTime() - 2 * 86400 * 1000));
    default: return toLocalInput(now);
  }
}

function formatHumanDate(localStr: string): string {
  if (!localStr) return '';
  const d = new Date(localStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

function formatCustomChipLabel(localStr: string): string {
  if (!localStr) return 'Custom';
  const d = new Date(localStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

function CustomDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const d = value ? new Date(value) : new Date();
  const [selectedDay, setSelectedDay] = useState<Date>(d);

  function handleSelect(day: Date | undefined) {
    if (!day) return;
    setSelectedDay(day);
    onChange(toLocalInput(day));
  }

  return (
    <DayPicker
      mode="single"
      selected={selectedDay}
      onSelect={handleSelect}
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
  );
}

export function TimeChips({ value, onChange, defaultSelected = 'today' }: TimeChipsProps) {
  const [selected, setSelected] = useState<DateOption>(defaultSelected);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const customLabel = selected === 'custom' ? formatCustomChipLabel(value) : 'Custom';

  function handleSelect(option: Exclude<DateOption, 'custom'>) {
    setSelected(option);
    onChange(getDateForOption(option));
  }

  function handleCustomSelect() {
    setSelected('custom');
  }

  const humanDate = formatHumanDate(value);

  return (
    <div className="space-y-2" data-testid="time-chips">
      {/* Human-readable summary */}
      {humanDate && (
        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{humanDate}</p>
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
              <CustomDatePicker value={value} onChange={onChange} />
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
          <CustomDatePicker value={value} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

export { getDateForOption, toLocalInput };
