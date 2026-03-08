'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DrinkLog, DrinkGoal } from '@/types';
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
  const supabase = createClient();

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

  // Units per day
  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    filteredLogs.forEach((l) => {
      const d = new Date(l.logged_at || l.loggedAt || '');
      const key = getDateKey(d);
      map.set(key, (map.get(key) || 0) + (l.standard_units ?? l.standardUnits ?? 0));
    });

    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : period === '12mo' ? 365 : 365;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = daysAgo(i);
      const key = getDateKey(d);
      const units = map.get(key) || 0;
      result.push({
        date: key,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        units: Math.round(units * 10) / 10,
        fill: units === 0 ? '#d1d5db' : units <= dailyLimit * 0.5 ? '#22c55e' : units <= dailyLimit ? '#f59e0b' : '#ef4444',
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
      map.set(key, (map.get(key) || 0) + (l.standard_units ?? l.standardUnits ?? 0));
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, units]) => ({
        week: key,
        label: `${key.slice(5)}`,
        units: Math.round(units * 10) / 10,
        fill: units <= weeklyLimit * 0.5 ? '#22c55e' : units <= weeklyLimit ? '#f59e0b' : '#ef4444',
      }));
  }, [filteredLogs, period, weeklyLimit]);

  // Rolling 7-day average
  const trendData = useMemo(() => {
    if (!showTrend) return [];
    return dailyData.map((_, i, arr) => {
      const slice = arr.slice(Math.max(0, i - 6), i + 1);
      const avg = slice.reduce((s, d) => s + d.units, 0) / slice.length;
      return { date: arr[i].date, label: arr[i].label, avg: Math.round(avg * 10) / 10 };
    });
  }, [dailyData, showTrend]);

  // Stats
  const stats = useMemo(() => {
    const totalUnits = filteredLogs.reduce((s, l) => s + (l.standard_units ?? l.standardUnits ?? 0), 0);
    const daysInPeriod = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : period === '12mo' ? 365 : Math.max(1, dailyData.length);
    const weeksInPeriod = daysInPeriod / 7;
    const dryDays = dailyData.filter((d) => d.units === 0).length;
    const dryPercent = daysInPeriod > 0 ? Math.round((dryDays / daysInPeriod) * 100) : 0;

    // Longest dry streak
    let maxStreak = 0;
    let cur = 0;
    dailyData.forEach((d) => {
      if (d.units === 0) {
        cur++;
        maxStreak = Math.max(maxStreak, cur);
      } else {
        cur = 0;
      }
    });

    return {
      totalUnits: Math.round(totalUnits * 10) / 10,
      avgPerWeek: Math.round((totalUnits / Math.max(weeksInPeriod, 1)) * 10) / 10,
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
      map.set(cat, (map.get(cat) || 0) + (l.standard_units ?? l.standardUnits ?? 0));
    });
    return Array.from(map.entries())
      .map(([category, units]) => ({
        category,
        name: CATEGORY_LABELS[category] || category,
        units: Math.round(units * 10) / 10,
      }))
      .sort((a, b) => b.units - a.units);
  }, [filteredLogs]);

  // Heatmap data
  const heatmapData = useMemo(() => {
    const { year, month } = heatmapMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay(); // 0=Sun

    // Build day→units map from all logs
    const dayMap = new Map<string, number>();
    logs.forEach((l) => {
      const d = new Date(l.logged_at || l.loggedAt || '');
      const key = getDateKey(d);
      dayMap.set(key, (dayMap.get(key) || 0) + (l.standard_units ?? l.standardUnits ?? 0));
    });

    const cells: { key: string; units: number; day: number; padded: boolean }[] = [];
    for (let i = 0; i < startPad; i++) {
      cells.push({ key: `pad-${i}`, units: -1, day: 0, padded: true });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const key = getDateKey(new Date(year, month, d));
      cells.push({ key, units: dayMap.get(key) || 0, day: d, padded: false });
    }
    return cells;
  }, [heatmapMonth, logs]);

  function getHeatColor(units: number): string {
    if (units <= 0) return 'bg-gray-100 dark:bg-gray-800';
    if (units <= dailyLimit * 0.33) return 'bg-amber-200 dark:bg-amber-900/50';
    if (units <= dailyLimit * 0.66) return 'bg-amber-400 dark:bg-amber-700';
    return 'bg-amber-600 dark:bg-amber-500';
  }

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
          <CardTitle className="text-lg">
            {useWeekly ? 'Units per Week' : 'Units per Day'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              {showTrend && !useWeekly ? (
                <LineChart data={dailyData.map((d, i) => ({ ...d, avg: trendData[i]?.avg ?? 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(dailyData.length / 8))} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="units" name="Units" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <Line dataKey="avg" name="7-day avg" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <ReferenceLine y={dailyLimit} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Limit', fontSize: 10 }} />
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(chartData.length / 8))} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="units" name="Units" radius={[2, 2, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                  <ReferenceLine y={refLimit} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Limit', fontSize: 10 }} />
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
            <p className="text-2xl font-bold dark:text-white">{stats.totalUnits}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total units</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold dark:text-white">{stats.avgPerWeek}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg / week</p>
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
            <p className="text-xs text-gray-500 dark:text-gray-400">Longest streak</p>
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
              <div
                key={cell.key}
                className={`aspect-square rounded-sm ${
                  cell.padded ? '' : getHeatColor(cell.units)
                }`}
                title={cell.padded ? '' : `${cell.key}: ${cell.units.toFixed(1)} units`}
              />
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 justify-end">
            <span className="text-xs text-gray-400 dark:text-gray-500">Less</span>
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-900/50" />
            <div className="w-3 h-3 rounded-sm bg-amber-400 dark:bg-amber-700" />
            <div className="w-3 h-3 rounded-sm bg-amber-600 dark:bg-amber-500" />
            <span className="text-xs text-gray-400 dark:text-gray-500">More</span>
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
                    dataKey="units"
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
