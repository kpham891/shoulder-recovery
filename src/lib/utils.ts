import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function daysAgo(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function getStreak(logs: { date: string }[]): number {
  if (logs.length === 0) return 0;

  const sorted = [...logs].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length; i++) {
    const logDate = new Date(sorted[i].date);
    logDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (logDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function getPainColor(pain: number): string {
  if (pain <= 2) return 'text-green-600';
  if (pain <= 4) return 'text-green-500';
  if (pain <= 6) return 'text-yellow-500';
  if (pain <= 8) return 'text-orange-500';
  return 'text-red-500';
}

export function getPainBgColor(pain: number): string {
  if (pain <= 2) return 'bg-green-100';
  if (pain <= 4) return 'bg-green-50';
  if (pain <= 6) return 'bg-yellow-50';
  if (pain <= 8) return 'bg-orange-50';
  return 'bg-red-50';
}
