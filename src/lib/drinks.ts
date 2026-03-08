import { DrinkLog } from '@/types';

/** WHO standard unit = 10 ml pure alcohol */
export function calculateStandardUnits(volume_ml: number, abv_percent: number): number {
  return Math.round(((volume_ml * abv_percent) / 100 / 10) * 10) / 10;
}

/** Rough calorie estimate: ~70 kcal per standard unit */
export function estimateCalories(units: number): number {
  return Math.round(units * 70);
}

/** Text color class based on how close to daily limit */
export function getUnitColor(units: number, dailyLimit: number): string {
  if (units <= 0) return 'text-gray-500 dark:text-gray-400';
  const ratio = units / dailyLimit;
  if (ratio < 0.5) return 'text-green-600 dark:text-green-400';
  if (ratio <= 1) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

/** Background color class based on how close to daily limit */
export function getUnitBgColor(units: number, dailyLimit: number): string {
  if (units <= 0) return 'bg-gray-200 dark:bg-gray-700';
  const ratio = units / dailyLimit;
  if (ratio < 0.5) return 'bg-green-500 dark:bg-green-600';
  if (ratio <= 1) return 'bg-amber-500 dark:bg-amber-600';
  return 'bg-red-500 dark:bg-red-600';
}

/** Progress bar color class */
export function getProgressColor(units: number, dailyLimit: number): string {
  if (units <= 0) return 'bg-gray-300 dark:bg-gray-600';
  const ratio = units / dailyLimit;
  if (ratio < 0.5) return 'bg-green-500';
  if (ratio <= 1) return 'bg-amber-500';
  return 'bg-red-500';
}

/** Count consecutive dry days ending at today (or yesterday if today has drinks) */
export function getDryStreak(drinkLogs: DrinkLog[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build a set of dates that have drinks
  const datesWithDrinks = new Set<string>();
  drinkLogs.forEach((log) => {
    const d = new Date(log.logged_at || log.loggedAt || '');
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    datesWithDrinks.add(key);
  });

  let streak = 0;
  const cursor = new Date(today);

  // If today has drinks, streak is 0
  const todayKey = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
  if (datesWithDrinks.has(todayKey)) return 0;

  // Walk backwards from today
  for (let i = 0; i < 365; i++) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (datesWithDrinks.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/** Format a date/timestamp as "3:42 PM" */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
