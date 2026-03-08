'use client';

import { Input } from '@/components/ui/input';
import { DrinkCategory } from '@/types';
import { VOLUME_CHIPS } from '@/lib/drinks-library';

interface VolumeChipsProps {
  category: DrinkCategory;
  value: number;
  onChange: (volume: number) => void;
}

export function VolumeChips({ category, value, onChange }: VolumeChipsProps) {
  const chips = VOLUME_CHIPS[category] || [250, 330, 500];

  return (
    <div className="space-y-2" data-testid="volume-chips">
      <div className="flex flex-wrap gap-2">
        {chips.map((ml) => (
          <button
            key={ml}
            type="button"
            data-testid={`volume-chip-${ml}`}
            onClick={() => onChange(ml)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              value === ml
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {ml}ml
          </button>
        ))}
      </div>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        placeholder="Custom ml"
        className="w-28"
        data-testid="volume-manual-input"
      />
    </div>
  );
}
