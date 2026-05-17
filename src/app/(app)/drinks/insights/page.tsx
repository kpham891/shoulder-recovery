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
import { NumberInput } from '@/components/ui/number-input';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Settings,
  Trash2,
  Plus,
  Pencil,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
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
  Tooltip as RechartsTooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  LineChart,
  ComposedChart,
  Line,
  Legend,
} from 'recharts';

// ─── Constants ───────────────────────────────────────────────────────

type Period = '7d' | '30d' | '90d' | '12mo' | 'all';

const PERIOD_LABELS: { key: Period; label: string }[] = [
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: '12mo', label: '12mo' },
  { key: 'all', label: 'All' },
];

const CATEGORY_COLORS: Record<string, string> = {
  beer: '#3b82f6',
  'cider-seltzer': '#06b6d4',
  wine: '#8b5cf6',
  'sake-soju': '#ec4899',
  spirits: '#f59e0b',
  cocktails: '#f97316',
};

const CATEGORY_LABELS: Record<string, string> = {
  beer: 'Beer',
  'cider-seltzer': 'Cider',
  wine: 'Wine',
  'sake-soju': 'Sake/Soju',
  spirits: 'Spirits',
  cocktails: 'Cocktails',
};

// ─── Helpers ─────────────────────────────────────────────────────────

function getDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekKey(d: Date): string {
  const start = new Date(d);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return getDateKey(start);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function getLogDrinks(l: DrinkLog): number {
  const units = l.standard_units ?? l.standardUnits ?? 0;
  const qty = l.quantity ?? 1;
  return units * qty;
}

function formatDateLabel(dateKey: string): string {
  const d = new Date(dateKey + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatWeekLabel(dateKey: string): string {
  const d = new Date(dateKey + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
      {children}
    </h2>
  );
}

// ─── Component ───────────────────────────────────────────────────────

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

  const weeklyLimit = goal?.weekly_unit_limit ?? goal?.weeklyUnitLimit ?? 14;
  const dailyLimit = goal?.daily_unit_limit ?? goal?.dailyUnitLimit ?? 2;
  const yearlyTarget = goal?.yearly_drink_target ?? goal?.yearlyDrinkTarget ?? null;

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

  // ─── Filtered logs ─────────────────────────────────────────────────

  const filteredLogs = useMemo(() => {
    if (period === 'all') return logs;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const cutoff = daysAgo(days);
    return logs.filter((l) => new Date(l.logged_at || l.loggedAt || '') >= cutoff);
  }, [logs, period]);

  // ─── Weekly bar chart data ─────────────────────────────────────────

  const weeklyData = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : period === '12mo' ? 365 : 730;
    const map = new Map<string, number>();

    // Generate week buckets
    for (let i = days - 1; i >= 0; i--) {
      const d = daysAgo(i);
      const key = getWeekKey(d);
      if (!map.has(key)) map.set(key, 0);
    }

    filteredLogs.forEach((l) => {
      const d = new Date(l.logged_at || l.loggedAt || '');
      const key = getWeekKey(d);
      if (map.has(key)) map.set(key, (map.get(key) || 0) + getLogDrinks(l));
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, drinks]) => {
        const rounded = Math.round(drinks * 10) / 10;
        let fill = '#22c55e'; // green — under goal
        if (rounded > weeklyLimit * 1.2) fill = '#ef4444'; // red — >20% over
        else if (rounded > weeklyLimit) fill = '#f59e0b'; // amber — within 20% over
        return {
          week: key,
          label: formatWeekLabel(key),
          drinks: rounded,
          fill,
        };
      });
  }, [filteredLogs, period, weeklyLimit]);

  // ─── Daily data (for trend line overlay) ───────────────────────────

  const dailyData = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : period === '12mo' ? 365 : 365;
    const map = new Map<string, number>();
    filteredLogs.forEach((l) => {
      const d = new Date(l.logged_at || l.loggedAt || '');
      const key = getDateKey(d);
      map.set(key, (map.get(key) || 0) + getLogDrinks(l));
    });
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = daysAgo(i);
      const key = getDateKey(d);
      result.push({ date: key, drinks: map.get(key) || 0 });
    }
    return result;
  }, [filteredLogs, period]);

  // ─── Rolling 7-day avg ────────────────────────────────────────────

  const trendData = useMemo(() => {
    if (!showTrend) return [];
    // Aggregate daily avg into weekly buckets to overlay on weekly chart
    const weekMap = new Map<string, { total: number; count: number }>();
    dailyData.forEach((d) => {
      const date = new Date(d.date + 'T12:00:00');
      const wk = getWeekKey(date);
      const cur = weekMap.get(wk) || { total: 0, count: 0 };
      cur.total += d.drinks;
      cur.count++;
      weekMap.set(wk, cur);
    });
    return weeklyData.map((w) => {
      const entry = weekMap.get(w.week);
      const dailyAvg = entry && entry.count > 0 ? entry.total / entry.count : 0;
      return { ...w, dailyAvg: Math.round(dailyAvg * 10) / 10 };
    });
  }, [dailyData, weeklyData, showTrend]);

  // ─── Stats ─────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // This week (Sun-Sat)
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const thisWeekLogs = logs.filter(l => {
      const d = new Date(l.logged_at || l.loggedAt || '');
      return d >= weekStart;
    });
    const thisWeekDrinks = thisWeekLogs.reduce((s, l) => s + getLogDrinks(l), 0);
    const daysLeftInWeek = 6 - ((now.getDay() + 6) % 7);

    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthLogs = logs.filter(l => {
      const d = new Date(l.logged_at || l.loggedAt || '');
      return d >= monthStart;
    });
    const thisMonthDrinks = thisMonthLogs.reduce((s, l) => s + getLogDrinks(l), 0);

    // Last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const lastMonthLogs = logs.filter(l => {
      const d = new Date(l.logged_at || l.loggedAt || '');
      return d >= lastMonthStart && d <= lastMonthEnd;
    });
    const lastMonthDrinks = lastMonthLogs.reduce((s, l) => s + getLogDrinks(l), 0);
    const monthChange = lastMonthDrinks > 0
      ? Math.round(((thisMonthDrinks - lastMonthDrinks) / lastMonthDrinks) * 100)
      : 0;

    // Avg per week (last 8 weeks)
    const eightWeeksAgo = new Date(now);
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    const last8wLogs = logs.filter(l => {
      const d = new Date(l.logged_at || l.loggedAt || '');
      return d >= eightWeeksAgo;
    });
    const last8wDrinks = last8wLogs.reduce((s, l) => s + getLogDrinks(l), 0);
    const avgPerWeek = last8wDrinks / 8;

    // Best dry streak (all time)
    const allDayMap = new Map<string, number>();
    logs.forEach(l => {
      const d = new Date(l.logged_at || l.loggedAt || '');
      const key = getDateKey(d);
      allDayMap.set(key, (allDayMap.get(key) || 0) + getLogDrinks(l));
    });
    // Build sequential day list from first log to today
    let bestStreak = 0;
    let cur = 0;
    if (logs.length > 0) {
      const firstDate = new Date(logs[0].logged_at || logs[0].loggedAt || '');
      firstDate.setHours(0, 0, 0, 0);
      const cursor = new Date(firstDate);
      while (cursor <= now) {
        const key = getDateKey(cursor);
        if (!allDayMap.has(key) || allDayMap.get(key)! === 0) {
          cur++;
          bestStreak = Math.max(bestStreak, cur);
        } else {
          cur = 0;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    return {
      thisWeekDrinks: displayUnits(thisWeekDrinks),
      thisWeekDrinksRaw: thisWeekDrinks,
      daysLeftInWeek,
      bestStreak,
      thisMonthDrinks: displayUnits(thisMonthDrinks),
      thisMonthDrinksRaw: thisMonthDrinks,
      lastMonthDrinks: displayUnits(lastMonthDrinks),
      lastMonthDrinksRaw: lastMonthDrinks,
      monthChange,
      avgPerWeek: displayUnits(avgPerWeek),
      avgPerWeekRaw: avgPerWeek,
    };
  }, [logs]);

  // ─── Yearly pacing ────────────────────────────────────────────────

  const yearPacing = useMemo(() => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31);
    const totalDaysInYear = (yearEnd.getTime() - yearStart.getTime()) / (86400000) + 1;
    const dayOfYear = Math.floor((now.getTime() - yearStart.getTime()) / 86400000) + 1;
    const yearPercent = Math.round((dayOfYear / totalDaysInYear) * 100);

    const yearLogs = logs.filter(l => {
      const d = new Date(l.logged_at || l.loggedAt || '');
      return d >= yearStart;
    });
    const yearDrinks = yearLogs.reduce((s, l) => s + getLogDrinks(l), 0);

    if (!yearlyTarget) {
      return { yearDrinks: displayUnits(yearDrinks), yearPercent, goalPercent: null, verdict: null, target: null };
    }

    const goalPercent = Math.round((yearDrinks / yearlyTarget) * 100);
    const verdict = goalPercent <= yearPercent ? 'ahead' : 'behind';

    return {
      yearDrinks: displayUnits(yearDrinks),
      yearDrinksRaw: yearDrinks,
      yearPercent,
      goalPercent,
      verdict,
      target: yearlyTarget,
    };
  }, [logs, yearlyTarget]);

  // ─── This week's category breakdown (horizontal stacked bar) ──────

  const weekCategoryData = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

    const catMap = new Map<string, number>();
    logs.forEach(l => {
      const d = new Date(l.logged_at || l.loggedAt || '');
      if (d >= weekStart) {
        const cat = l.category || 'beer';
        catMap.set(cat, (catMap.get(cat) || 0) + getLogDrinks(l));
      }
    });

    const total = Array.from(catMap.values()).reduce((s, v) => s + v, 0);
    return {
      categories: Array.from(catMap.entries())
        .map(([cat, drinks]) => ({
          category: cat,
          name: CATEGORY_LABELS[cat] || cat,
          drinks: Math.round(drinks * 10) / 10,
          color: CATEGORY_COLORS[cat] || '#6b7280',
          percent: total > 0 ? (drinks / total) * 100 : 0,
        }))
        .sort((a, b) => b.drinks - a.drinks),
      total: Math.round(total * 10) / 10,
    };
  }, [logs]);

  // ─── Heatmap ──────────────────────────────────────────────────────

  const heatmapData = useMemo(() => {
    const { year, month } = heatmapMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = (firstDay.getDay() + 6) % 7;

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

  // ─── Calendar color scale (5 levels) ──────────────────────────────

  function getHeatColor(drinks: number): string {
    if (drinks <= 0) return 'bg-slate-100 dark:bg-slate-800';
    if (drinks <= 2) return 'bg-green-200 dark:bg-green-900';
    if (drinks <= 5) return 'bg-yellow-200 dark:bg-yellow-800';
    if (drinks <= 9) return 'bg-orange-300 dark:bg-orange-700';
    return 'bg-red-400 dark:bg-red-700';
  }

  function getHeatTextColor(drinks: number): string {
    if (drinks <= 0) return 'text-slate-400 dark:text-slate-500';
    if (drinks <= 2) return 'text-green-800 dark:text-green-200';
    if (drinks <= 5) return 'text-yellow-900 dark:text-yellow-100';
    return 'text-white';
  }

  // ─── Day sheet handlers ───────────────────────────────────────────

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

  // ─── Custom tooltip for bar chart ─────────────────────────────────

  function WeeklyTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
    if (!active || !payload?.length || !label) return null;
    const drinks = payload[0].value;
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white shadow-xl">
        <p>
          {label} · <span className="font-semibold">{drinks} drinks</span> · Goal: {weeklyLimit}
        </p>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <p className="text-center text-gray-500 animate-pulse">Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/drinks" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold dark:text-white">Drink Insights</h1>
        </div>
        <Link href="/drinks/settings">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </Button>
        </Link>
      </div>

      {/* ─── YOUR HABITS ─────────────────────────────────────────── */}
      <SectionHeading>Your habits</SectionHeading>
      <div className="grid grid-cols-2 gap-3 mb-10">
        {/* This week */}
        <Card className="rounded-xl">
          <CardContent className="py-4">
            <p className="text-3xl font-bold dark:text-white">{stats.thisWeekDrinks}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              of {weeklyLimit} goal · {stats.daysLeftInWeek}d left
            </p>
            {/* Mini progress bar */}
            <div className="mt-2 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  stats.thisWeekDrinksRaw > weeklyLimit * 1.2 ? 'bg-red-500'
                    : stats.thisWeekDrinksRaw > weeklyLimit ? 'bg-amber-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min((stats.thisWeekDrinksRaw / weeklyLimit) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Best streak */}
        <Card className="rounded-xl">
          <CardContent className="py-4">
            <p className="text-3xl font-bold dark:text-white">{stats.bestStreak}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">best dry streak (days)</p>
          </CardContent>
        </Card>

        {/* This month */}
        <Card className="rounded-xl">
          <CardContent className="py-4 overflow-hidden">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-3xl font-bold dark:text-white truncate">{stats.thisMonthDrinks}</p>
              {stats.monthChange !== 0 && stats.lastMonthDrinksRaw > 0 && (
                <span className={`flex items-center text-xs font-medium ${
                  stats.monthChange <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                }`}>
                  {stats.monthChange <= 0
                    ? <TrendingDown className="w-3 h-3 mr-0.5" />
                    : <TrendingUp className="w-3 h-3 mr-0.5" />
                  }
                  {Math.abs(stats.monthChange)}%
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">this month vs last</p>
          </CardContent>
        </Card>

        {/* Avg per week */}
        <Card className="rounded-xl">
          <CardContent className="py-4">
            <p className="text-3xl font-bold dark:text-white">{stats.avgPerWeek}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">avg per week (8w)</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── THIS YEAR ───────────────────────────────────────────── */}
      <SectionHeading>This year</SectionHeading>
      <Card className="rounded-xl mb-10">
        <CardContent className="py-5">
          {yearlyTarget ? (
            <>
              {/* Yearly pacing */}
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-sm font-medium dark:text-white">
                  {yearPacing.yearDrinks} of {yearlyTarget} drinks
                </p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  yearPacing.verdict === 'ahead'
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                    : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                }`}>
                  {yearPacing.verdict === 'ahead' ? 'Under pace' : 'Over pace'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    yearPacing.verdict === 'ahead' ? 'bg-green-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(yearPacing.goalPercent || 0, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {yearPacing.goalPercent}% of goal used · {yearPacing.yearPercent}% of year elapsed
              </p>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Set a yearly goal to see pacing
              </p>
              <Link href="/drinks/settings">
                <Button variant="outline" size="sm">Set goal</Button>
              </Link>
            </div>
          )}

        </CardContent>
      </Card>

      {/* ─── WEEKLY INTAKE ───────────────────────────────────────── */}
      <SectionHeading>Weekly intake</SectionHeading>

      {/* Period selector */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-4">
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

      <Card className="rounded-xl mb-4">
        <CardContent className="pt-6">
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              {showTrend ? (
                <ComposedChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(trendData.length / 6))} axisLine={false} tickLine={false} angle={trendData.length > 8 ? -45 : 0} textAnchor={trendData.length > 8 ? 'end' : 'middle'} height={trendData.length > 8 ? 50 : 30} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<WeeklyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Legend />
                  <Bar dataKey="drinks" name="Weekly drinks" radius={[4, 4, 0, 0]}>
                    {trendData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                  <Line dataKey="dailyAvg" name="Daily avg" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <ReferenceLine y={weeklyLimit} stroke="#94a3b8" strokeDasharray="6 4" label={{ value: 'Your goal', position: 'right', fontSize: 10, fill: '#94a3b8' }} />
                </ComposedChart>
              ) : (
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(weeklyData.length / 6))} axisLine={false} tickLine={false} angle={weeklyData.length > 8 ? -45 : 0} textAnchor={weeklyData.length > 8 ? 'end' : 'middle'} height={weeklyData.length > 8 ? 50 : 30} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<WeeklyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="drinks" name="Weekly drinks" radius={[4, 4, 0, 0]}>
                    {weeklyData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                  <ReferenceLine y={weeklyLimit} stroke="#94a3b8" strokeDasharray="6 4" label={{ value: 'Your goal', position: 'right', fontSize: 10, fill: '#94a3b8' }} />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 dark:text-gray-500 py-8">No data for this period</p>
          )}

          <div className="flex items-center space-x-2 mt-3">
            <Checkbox
              id="show-trend"
              checked={showTrend}
              onCheckedChange={(checked) => setShowTrend(checked === true)}
            />
            <Label htmlFor="show-trend" className="text-sm font-normal cursor-pointer">
              Show daily average overlay
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Horizontal stacked bar — category breakdown for this week */}
      {weekCategoryData.total > 0 && (
        <Card className="rounded-xl mb-10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">This week by category</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Stacked bar */}
            <div className="h-6 rounded-full overflow-hidden flex mb-3">
              {weekCategoryData.categories.map((cat) => (
                <div
                  key={cat.category}
                  className="h-full flex items-center justify-center text-[10px] font-medium text-white overflow-hidden transition-all"
                  style={{ width: `${cat.percent}%`, backgroundColor: cat.color, minWidth: cat.percent > 0 ? '4px' : '0' }}
                  title={`${cat.name}: ${cat.drinks} drinks`}
                >
                  {cat.percent >= 15 && `${cat.drinks}`}
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {weekCategoryData.categories.map((cat) => (
                <div key={cat.category} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{cat.name} · {cat.drinks}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── HISTORY ─────────────────────────────────────────────── */}
      <SectionHeading>History</SectionHeading>

      {/* Calendar heatmap */}
      <Card className="rounded-xl">
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
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
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
                    : `${getHeatColor(cell.drinks)} cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 dark:hover:ring-offset-gray-900 active:scale-95${cell.key === getDateKey(new Date()) ? ' ring-2 ring-blue-500 dark:ring-blue-400' : ''}`
                }`}
                title={cell.padded ? '' : `${formatDateLabel(cell.key)}: ${cell.drinks.toFixed(1)} drinks`}
              >
                {!cell.padded && (
                  <span className={`text-xs ${cell.key === getDateKey(new Date()) ? 'font-bold text-white' : `font-medium ${getHeatTextColor(cell.drinks)}`}`}>
                    {cell.day}
                  </span>
                )}
              </button>
            ))}
          </div>
          {/* 5-level legend */}
          <div className="flex items-center gap-1 mt-3 justify-end">
            <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">Less</span>
            <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-gray-700" />
            <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
            <div className="w-3 h-3 rounded-sm bg-yellow-200 dark:bg-yellow-800" />
            <div className="w-3 h-3 rounded-sm bg-orange-300 dark:bg-orange-700" />
            <div className="w-3 h-3 rounded-sm bg-red-400 dark:bg-red-700" />
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">More</span>
          </div>
        </CardContent>
      </Card>

      {/* ─── Day detail Sheet ────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto sm:max-h-none sm:h-full md:max-w-md">
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
                      <div className="text-center">
                        <span className="text-3xl font-bold text-blue-700 dark:text-blue-300">{editLiveUnits}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">standard drinks</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Volume</Label>
                        <VolumeChips category={editCategory} value={editVolume} onChange={setEditVolume} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">ABV</Label>
                        <div className="relative w-28">
                          <NumberInput allowDecimal value={editAbv || null} onChange={(v) => setEditAbv(v ?? 0)} className="pr-8" min={0} max={100} />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Quantity</Label>
                        <QuantityStepper value={editQuantity} onChange={setEditQuantity} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Date</Label>
                        <TimeChips value={editTime} onChange={setEditTime} defaultSelected="custom" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Note</Label>
                        <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="e.g. at dinner with friends" />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleSaveEdit(log.id)} disabled={editSaving || !editName} className="flex-1">
                          {editSaving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button onClick={cancelEdit} variant="outline" className="flex-1" disabled={editSaving}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  );
                }

                const emoji = CATEGORY_EMOJI[log.category] || '';
                const name = log.drink_name || log.drinkName || 'Unknown';
                const time = formatTime(log.logged_at || log.loggedAt || '');
                const drinks = displayUnits(getLogDrinks(log));
                const vol = log.volume_ml ?? log.volumeMl ?? 0;
                const abv = log.abv_percent ?? log.abvPercent ?? 0;
                const qty = log.quantity ?? 1;

                return (
                  <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <span className="text-xl">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium dark:text-white truncate">
                        {qty > 1 ? `${qty}x ` : ''}{name}
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
                    <button onClick={() => startEdit(log)} className="p-1.5 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors rounded hover:bg-blue-50 dark:hover:bg-blue-900/20" aria-label="Edit drink log">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteLog(log.id)} className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20" aria-label="Delete drink log">
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
