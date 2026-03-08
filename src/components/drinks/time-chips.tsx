'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';

type TimeOption = 'now' | '30m' | '1h' | '2h' | 'custom';

interface TimeChipsProps {
  value: string; // ISO string for datetime-local
  onChange: (isoString: string) => void;
}

const OPTIONS: { key: TimeOption; label: string }[] = [
  { key: 'now', label: 'Now' },
  { key: '30m', label: '30m ago' },
  { key: '1h', label: '1h ago' },
  { key: '2h', label: '2h ago' },
  { key: 'custom', label: 'Custom' },
];

function toLocalInput(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function getTimeForOption(option: TimeOption): string {
  const now = new Date();
  switch (option) {
    case 'now':
      return toLocalInput(now);
    case '30m':
      return toLocalInput(new Date(now.getTime() - 30 * 60 * 1000));
    case '1h':
      return toLocalInput(new Date(now.getTime() - 60 * 60 * 1000));
    case '2h':
      return toLocalInput(new Date(now.getTime() - 120 * 60 * 1000));
    default:
      return toLocalInput(now);
  }
}

export function TimeChips({ value, onChange }: TimeChipsProps) {
  const [selected, setSelected] = useState<TimeOption>('now');

  function handleSelect(option: TimeOption) {
    setSelected(option);
    if (option !== 'custom') {
      onChange(getTimeForOption(option));
    }
  }

  return (
    <div className="space-y-2" data-testid="time-chips">
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => (
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
      </div>

      {selected === 'custom' && (
        <div className="relative" data-testid="custom-time-input">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-10"
          />
        </div>
      )}
    </div>
  );
}

export { getTimeForOption, toLocalInput };
