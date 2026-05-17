'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface BottomSheetPickerProps<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onValueChange: (value: T) => void;
}

export function BottomSheetPicker<T extends string>({
  label,
  value,
  options,
  onValueChange,
}: BottomSheetPickerProps<T>) {
  const [open, setOpen] = React.useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <span>{selectedLabel}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="px-0 pb-10">
          <SheetHeader className="px-4 pb-2">
            <SheetTitle className="text-left">{label}</SheetTitle>
          </SheetHeader>
          <div className="divide-y divide-border">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-4 py-4 text-sm active:bg-accent"
              >
                <span className={cn(option.value === value && 'font-medium text-foreground')}>
                  {option.label}
                </span>
                {option.value === value && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
