'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ChevronLeft, ChevronRight, Info, Trash2, Plus, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DrinkLog, DrinkGoal } from '@/types';
import { formatTime } from '@/lib/drinks';
import { CATEGORY_EMOJI } from '@/lib/drinks-library';
import { calculateUnits, displayUnits } from '@/lib/units-calculator';
import { VolumeChips } from '@/components/drinks/volume-chips';
import { QuantityStepper } from '@/components/drinks/quantity-stepper';
import { TimeChips, toLocalInput } from '@/components/drinks/time-chips';
import { DrinkCategory } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

type Period = '7d' | '30d' | '90d' | '12mo' | 'all';

const PERIOD_LABELS: { key: Period; label: string }[] = [
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: '12mo', label: '12mo' },
  { key: 'all', label: 'All' },
];

const PIE_COLORS = ['#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#6b7280'];
const CATEGORY_LABELS: Record<string, string> = {
  beer: 'Beer',
  wine: 'Wine',
  spirits: 'Spirits',
  cider: 'Cider',
  other: 'Other',
};

function getDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekKey(d: Date): string {
  const start = new Date(d);
  start.setDate(start.getDate() - start.getDay());
  return getDateKey(start);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

/** Get total standard drinks for a log entry, accounting for quantity */
function getLogDrinks(l: DrinkLog): number {
  const units = l.standard_units ?? l.standardUnits ?? 0;
  const qty = l.quantity ?? 1;
  // The DB generated column already includes quantity, but if standard_units
  // was computed without quantity (legacy rows), multiply here as safety net.
  // If standard_units already includes qty, the entry will have qty=1 or
  // standard_units will already reflect the full amount.
  return units * qty;
}

function formatDateLabel(dateKey: string): string {
  const d = new Date(dateKey + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function InsightsPage() {
  const [logs, setLogs] = useState<DrinkLog[]>([]);
  const [goal, setGoal] = useState<DrinkGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30d');
  const [showTrend, setShowTrend] = useState(false);
  const [heatmapMonth, setHeatmapMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editVolume, setEditVolume] = useState(330);
  const [editAbv, setEditAbv] = useState(5);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editTime, setEditTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCategory, setEditCategory] = useState<DrinkCategory>('beer');
  const [editSaving, setEditSaving] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const dailyLimit = goal?.daily_unit_limit ?? goal?.dailyUnitLimit ?? 2;
  const weeklyLimit = goal?.weekly_unit_limit ?? goal?.weeklyUnitLimit ?? 14;

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [logsRes, goalRes] = await Promise.all([
      supabase
        .from('drink_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: true }),
      supabase
        .from('drink_goals')
        .select('*')
        .eq('user_id', user.id)
        .single(),
    ]);

    setLogs(logsRes.data || []);
    if (goalRes.data) setGoal(goalRes.data);
    setLoading(false);
  }

  // Filter logs by period
  const filteredLogs = useMemo(() => {
    if (period === 'all') return logs;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const cutoff = daysAgo(days);
    return logs.filter((l) => new Date(l.logged_at || l.loggedAt || '') >= cutoff);
  }, [logs, period]);

  // Standard drinks per day
  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    filteredLogs.forEach((l) => {
      const d = new Date(l.logged_at || l.loggedAt || '');
      const key = getDateKey(d);
      map.set(key, (map.get(key) || 0) + getLogDrinks(l));
    });

    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : period === '12mo' ? 365 : 365;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = daysAgo(i);
      const key = getDateKey(d);
      const drinks = map.get(key) || 0;
      result.push({
        date: key,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        drinks: Math.round(drinks * 10) / 10,
        fill: drinks === 0 ? '#d1d5db' : drinks <= dailyLimit * 0.5 ? '#22c55e' : drinks <= dailyLimit ? '#f59e0b' : '#ef4444',
      });
    }
    return result;
  }, [filteredLogs, period, dailyLimit]);

  // Weekly data for 90d+
  const weeklyData = useMemo(() => {
    if (period !== '90d' && period !== '12mo' && period !== 'all') return [];
    const map = new Map<string, number>();
    filteredLogs.forEach((l) => {
      const d = new Date(l.logged_at || l.loggedAt || '');
      const key = getWeekKey(d);
      map.set(key, (map.get(key) || 0) + getLogDrinks(l));
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, drinks]) => ({
        week: key,
        label: `${key.slice(5)}`,
        drinks: Math.round(drinks * 10) / 10,
        fill: drinks <= weeklyLimit * 0.5 ? '#22c55e' : drinks <= weeklyLimit ? '#f59e0b' : '#ef4444',
      }));
  }, [filteredLogs, period, weeklyLimit]);

  // Rolling 7-day average
  const trendData = useMemo(() => {
    if (!showTrend) return [];
    return dailyData.map((_, i, arr) => {
      const slice = arr.slice(Math.max(0, i - 6), i + 1);
      const avg = slice.reduce((s, d) => s + d.drinks, 0) / slice.length;
      return { date: arr[i].date, label: arr[i].label, avg: Math.round(avg * 10) / 10 };
    });
  }, [dailyData, showTrend]);

  // Stats
  const stats = useMemo(() => {
    const totalDrinks = filteredLogs.reduce((s, l) => s + getLogDrinks(l), 0);
    const daysInPeriod = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : period === '12mo' ? 365 : Math.max(1, dailyData.length);
    const weeksInPeriod = daysInPeriod / 7;
    const dryDays = dailyData.filter((d) => d.drinks === 0).length;
    const dryPercent = daysInPeriod > 0 ? Math.round((dryDays / daysInPeriod) * 100) : 0;

    // Longest dry streak
    let maxStreak = 0;
    let cur = 0;
    dailyData.forEach((d) => {
      if (d.drinks === 0) {
        cur++;
        maxStreak = Math.max(maxStreak, cur);
      } else {
        cur = 0;
      }
    });

    return {
      totalDrinks: displayUnits(totalDrinks),
      avgPerWeek: displayUnits(totalDrinks / Math.max(weeksInPeriod, 1)),
      dryDays,
      dryPercent,
      longestStreak: maxStreak,
    };
  }, [filteredLogs, dailyData, period]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    filteredLogs.forEach((l) => {
      const cat = l.category || 'other';
      map.set(cat, (map.get(cat) || 0) + getLogDrinks(l));
    });
    return Array.from(map.entries())
      .map(([category, drinks]) => ({
        category,
        name: CATEGORY_LABELS[category] || category,
        drinks: Math.round(drinks * 10) / 10,
      }))
      .sort((a, b) => b.drinks - a.drinks);
  }, [filteredLogs]);

  // Heatmap data
  const heatmapData = useMemo(() => {
    const { year, month } = heatmapMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay(); // 0=Sun

    // Build day→drinks map from all logs
    const dayMap = new Map<string, number>();
    logs.forEach((l) => {
      const d = new Date(l.logged_at || l.loggedAt || '');
      const key = getDateKey(d);
      dayMap.set(key, (dayMap.get(key) || 0) + getLogDrinks(l));
    });

    const cells: { key: string; drinks: number; day: number; padded: boolean }[] = [];
    for (let i = 0; i < startPad; i++) {
      cells.push({ key: `pad-${i}`, drinks: -1, day: 0, padded: true });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const key = getDateKey(new Date(year, month, d));
      cells.push({ key, drinks: dayMap.get(key) || 0, day: d, padded: false });
    }
    return cells;
  }, [heatmapMonth, logs]);

  // Logs for the selected day in the sheet
  const selectedDayLogs = useMemo(() => {
    if (!selectedDay) return [];
    return logs.filter((l) => {
      const d = new Date(l.logged_at || l.loggedAt || '');
      return getDateKey(d) === selectedDay;
    }).sort((a, b) => {
      const aTime = new Date(a.logged_at || a.loggedAt || '').getTime();
      const bTime = new Date(b.logged_at || b.loggedAt || '').getTime();
      return bTime - aTime;
    });
  }, [selectedDay, logs]);

  function getHeatColor(drinks: number): string {
    if (drinks <= 0) return 'bg-gray-100 dark:bg-gray-800';
    const ratio = drinks / dailyLimit;
    if (ratio <= 0.5) return 'bg-green-200 dark:bg-green-900/50';
    if (ratio <= 0.75) return 'bg-green-400 dark:bg-green-700';
    if (ratio <= 1) return 'bg-amber-400 dark:bg-amber-600';
    if (ratio <= 1.5) return 'bg-red-400 dark:bg-red-700';
    return 'bg-red-600 dark:bg-red-500';
  }

  function getHeatTextColor(drinks: number): string {
    if (drinks <= 0) return 'text-gray-400 dark:text-gray-500';
    const ratio = drinks / dailyLimit;
    if (ratio <= 0.5) return 'text-green-800 dark:text-green-200';
    return 'text-white dark:text-white';
  }

  function handleDayClick(dateKey: string) {
    setSelectedDay(dateKey);
    setSheetOpen(true);
  }

  async function handleDeleteLog(logId: string) {
    const { error } = await supabase.from('drink_logs').delete().eq('id', logId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setLogs((prev) => prev.filter((l) => l.id !== logId));
    toast({ title: 'Deleted', description: 'Drink log removed' });
  }

  function startEdit(log: DrinkLog) {
    setEditingLogId(log.id);
    setEditName(log.drink_name || log.drinkName || '');
    setEditVolume(log.volume_ml ?? log.volumeMl ?? 330);
    setEditAbv(log.abv_percent ?? log.abvPercent ?? 5);
    setEditQuantity(log.quantity ?? 1);
    setEditTime(toLocalInput(new Date(log.logged_at || log.loggedAt || '')));
    setEditNotes(log.notes || '');
    setEditCategory(log.category || 'beer');
    setEditSaving(false);
  }

  function cancelEdit() {
    setEditingLogId(null);
  }

  async function handleSaveEdit(logId: string) {
    setEditSaving(true);
    const { error } = await supabase
      .from('drink_logs')
      .update({
        drink_name: editName,
        volume_ml: editVolume,
        abv_percent: editAbv,
        quantity: editQuantity,
        logged_at: new Date(editTime).toISOString(),
        notes: editNotes || null,
      })
      .eq('id', logId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setEditSaving(false);
      return;
    }

    setLogs((prev) =>
      prev.map((l) =>
        l.id === logId
          ? {
              ...l,
              drink_name: editName,
              drinkName: editName,
              volume_ml: editVolume,
              volumeMl: editVolume,
              abv_percent: editAbv,
              abvPercent: editAbv,
              quantity: editQuantity,
              logged_at: new Date(editTime).toISOString(),
              loggedAt: new Date(editTime).toISOString(),
              standard_units: (editVolume * editAbv) / 1000,
              standardUnits: (editVolume * editAbv) / 1000,
              notes: editNotes || undefined,
            }
          : l
      )
    );

    setEditingLogId(null);
    toast({ title: 'Updated', description: 'Drink log updated' });
  }

  const editLiveUnits = editingLogId
    ? displayUnits(calculateUnits(editVolume, editAbv, editQuantity))
    : 0;

  const useWeekly = period === '90d' || period === '12mo' || period === 'all';
  const chartData = useWeekly ? weeklyData : dailyData;
  const refLimit = useWeekly ? weeklyLimit : dailyLimit;

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <p className="text-center text-gray-500 animate-pulse">Loading insights…</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/drinks" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold dark:text-white">Drink Insights</h1>
      </div>

      {/* Period selector */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {PERIOD_LABELS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              period === p.key
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">
              {useWeekly ? 'Standard drinks per week' : 'Standard drinks per day'}
            </CardTitle>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-56 text-center z-10">
                1 standard drink = 10ml pure alcohol (e.g. a 330ml beer at 5%)
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              {showTrend && !useWeekly ? (
                <LineChart data={dailyData.map((d, i) => ({ ...d, avg: trendData[i]?.avg ?? 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(dailyData.length / 8))} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      [value, name === 'avg' ? '7-day avg' : 'Standard drinks']
                    }
                  />
                  <Legend />
                  <Bar dataKey="drinks" name="Standard drinks" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <Line dataKey="avg" name="7-day avg" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <ReferenceLine y={dailyLimit} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `${dailyLimit} limit`, fontSize: 10 }} />
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(chartData.length / 8))} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [value, 'Standard drinks']}
                  />
                  <Bar dataKey="drinks" name="Standard drinks" radius={[2, 2, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                  <ReferenceLine y={refLimit} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `${refLimit} limit`, fontSize: 10 }} />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 dark:text-gray-500 py-8">No data for this period</p>
          )}

          {!useWeekly && (
            <div className="flex items-center space-x-2 mt-3">
              <Checkbox
                id="show-trend"
                checked={showTrend}
                onCheckedChange={(checked) => setShowTrend(checked === true)}
              />
              <Label htmlFor="show-trend" className="text-sm font-normal cursor-pointer">
                Show 7-day rolling average
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold dark:text-white">{stats.totalDrinks}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total standard drinks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold dark:text-white">{stats.avgPerWeek}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg drinks / week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold dark:text-white">
              {stats.dryDays} <span className="text-sm font-normal text-gray-400">({stats.dryPercent}%)</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Dry days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold dark:text-white">{stats.longestStreak}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Longest dry streak</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const { year, month } = heatmapMonth;
                  const prev = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
                  setHeatmapMonth(prev);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <ChevronLeft className="w-4 h-4 dark:text-gray-300" />
              </button>
              <span className="text-sm font-medium dark:text-white min-w-[100px] text-center">
                {new Date(heatmapMonth.year, heatmapMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  const { year, month } = heatmapMonth;
                  const next = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
                  setHeatmapMonth(next);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <ChevronRight className="w-4 h-4 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center text-xs text-gray-400 dark:text-gray-500">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {heatmapData.map((cell) => (
              <button
                key={cell.key}
                type="button"
                disabled={cell.padded}
                onClick={() => !cell.padded && handleDayClick(cell.key)}
                className={`aspect-square rounded-sm flex items-center justify-center transition-transform ${
                  cell.padded
                    ? ''
                    : `${getHeatColor(cell.drinks)} cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 dark:hover:ring-offset-gray-900 active:scale-95`
                }`}
                title={cell.padded ? '' : `${formatDateLabel(cell.key)}: ${cell.drinks.toFixed(1)} standard drinks`}
              >
                {!cell.padded && (
                  <span className={`text-xs font-medium ${getHeatTextColor(cell.drinks)}`}>
                    {cell.day}
                  </span>
                )}
              </button>
            ))}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 justify-end">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
              <span className="text-xs text-gray-400 dark:text-gray-500">Dry</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
              <span className="text-xs text-gray-400 dark:text-gray-500">Under limit</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-amber-400 dark:bg-amber-600" />
              <span className="text-xs text-gray-400 dark:text-gray-500">Near limit</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-red-500 dark:bg-red-600" />
              <span className="text-xs text-gray-400 dark:text-gray-500">Over limit</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category breakdown */}
      {categoryData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="drinks"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Standard drinks']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto sm:max-h-none sm:h-full md:max-w-md" >
          <SheetHeader>
            <SheetTitle>
              {selectedDay ? formatDateLabel(selectedDay) : ''}
            </SheetTitle>
            <SheetDescription>
              {selectedDayLogs.length === 0
                ? 'No drinks logged this day'
                : `${selectedDayLogs.length} drink${selectedDayLogs.length === 1 ? '' : 's'} — ${displayUnits(selectedDayLogs.reduce((s, l) => s + getLogDrinks(l), 0))} standard drinks`
              }
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-3">
            {selectedDayLogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 dark:text-gray-500 mb-4">Nothing logged yet</p>
                <Button asChild variant="outline">
                  <Link href="/drinks/log">
                    <Plus className="w-4 h-4 mr-2" />
                    Log a drink
                  </Link>
                </Button>
              </div>
            ) : (
              selectedDayLogs.map((log) => {
                if (editingLogId === log.id) {
                  return (
                    <div key={log.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-4">
                      {/* Live units badge */}
                      <div className="text-center">
                        <span className="text-3xl font-bold text-blue-700 dark:text-blue-300">{editLiveUnits}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">standard drinks</p>
                      </div>

                      {/* Name */}
                      <div className="space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </div>

                      {/* Volume */}
                      <div className="space-y-1">
                        <Label className="text-xs">Volume</Label>
                        <VolumeChips
                          category={editCategory}
                          value={editVolume}
                          onChange={setEditVolume}
                        />
                      </div>

                      {/* ABV */}
                      <div className="space-y-1">
                        <Label className="text-xs">ABV</Label>
                        <div className="relative w-28">
                          <Input
                            type="number"
                            step="0.1"
                            value={editAbv}
                            onChange={(e) => setEditAbv(Number(e.target.value) || 0)}
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="space-y-1">
                        <Label className="text-xs">Quantity</Label>
                        <QuantityStepper value={editQuantity} onChange={setEditQuantity} />
                      </div>

                      {/* Time */}
                      <div className="space-y-1">
                        <Label className="text-xs">Time</Label>
                        <TimeChips
                          value={editTime}
                          onChange={setEditTime}
                          defaultSelected="custom"
                        />
                      </div>

                      {/* Note */}
                      <div className="space-y-1">
                        <Label className="text-xs">Note</Label>
                        <Input
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="e.g. at dinner with friends"
                        />
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSaveEdit(log.id)}
                          disabled={editSaving || !editName}
                          className="flex-1"
                        >
                          {editSaving ? 'Saving…' : 'Save'}
                        </Button>
                        <Button
                          onClick={cancelEdit}
                          variant="outline"
                          className="flex-1"
                          disabled={editSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  );
                }

                const emoji = CATEGORY_EMOJI[log.category] || '🍹';
                const name = log.drink_name || log.drinkName || 'Unknown';
                const time = formatTime(log.logged_at || log.loggedAt || '');
                const drinks = displayUnits(getLogDrinks(log));
                const vol = log.volume_ml ?? log.volumeMl ?? 0;
                const abv = log.abv_percent ?? log.abvPercent ?? 0;
                const qty = log.quantity ?? 1;

                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <span className="text-xl">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium dark:text-white truncate">
                        {qty > 1 ? `${qty}× ` : ''}{name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {time} · {vol}ml · {abv}% ABV
                      </p>
                      {log.notes && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{log.notes}</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 whitespace-nowrap">
                      {drinks}
                    </span>
                    <button
                      onClick={() => startEdit(log)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      aria-label="Edit drink log"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      aria-label="Delete drink log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
