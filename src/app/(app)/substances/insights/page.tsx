'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SubstanceLog } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';

// ─── Constants ────────────────────────────────────────────────────────

type Period = '7d' | '30d' | '90d' | 'all';

const PERIOD_LABELS: { key: Period; label: string }[] = [
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: 'all', label: 'All' },
];

const SUBSTANCE_COLORS: Record<string, string> = {
  Cannabis: '#a78bfa',
  MDMA: '#f472b6',
  Psilocybin: '#fb923c',
  Cocaine: '#38bdf8',
  Ketamine: '#34d399',
  Other: '#94a3b8',
};

function getDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function getStartDate(period: Period): Date | null {
  switch (period) {
    case '7d': return daysAgo(6);
    case '30d': return daysAgo(29);
    case '90d': return daysAgo(89);
    case 'all': return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────

export default function SubstanceInsightsPage() {
  const [logs, setLogs] = useState<SubstanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30d');
  const supabase = createClient();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('substance_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(1000);

    setLogs(data || []);
    setLoading(false);
  }

  const filteredLogs = useMemo(() => {
    const start = getStartDate(period);
    if (!start) return logs;
    return logs.filter((l) => new Date(l.logged_at || l.loggedAt || '') >= start);
  }, [logs, period]);

  // Frequency by substance
  const substanceFrequency = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach((l) => {
      counts[l.substance] = (counts[l.substance] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([substance, count]) => ({ substance, count, fill: SUBSTANCE_COLORS[substance] || '#94a3b8' }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLogs]);

  // Daily usage over time (stacked by substance)
  const dailyData = useMemo(() => {
    const start = getStartDate(period) || (logs.length > 0 ? new Date(logs[logs.length - 1].logged_at || logs[logs.length - 1].loggedAt || '') : new Date());
    const end = new Date();
    const dayMap: Record<string, Record<string, number>> = {};

    // Initialize all days
    const cursor = new Date(start);
    while (cursor <= end) {
      dayMap[getDateKey(cursor)] = {};
      cursor.setDate(cursor.getDate() + 1);
    }

    filteredLogs.forEach((l) => {
      const key = getDateKey(new Date(l.logged_at || l.loggedAt || ''));
      if (dayMap[key]) {
        dayMap[key][l.substance] = (dayMap[key][l.substance] || 0) + 1;
      }
    });

    const substances = [...new Set(filteredLogs.map((l) => l.substance))];
    return {
      data: Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, subs]) => ({
          date: date.slice(5), // MM-DD
          ...subs,
        })),
      substances,
    };
  }, [filteredLogs, period, logs]);

  // Summary stats
  const totalEntries = filteredLogs.length;
  const uniqueSubstances = new Set(filteredLogs.map((l) => l.substance)).size;
  const avgIntensity = filteredLogs.filter((l) => l.intensity).length > 0
    ? (filteredLogs.reduce((sum, l) => sum + (l.intensity || 0), 0) / filteredLogs.filter((l) => l.intensity).length).toFixed(1)
    : '—';

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <p className="text-center text-gray-500 animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/substances" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold dark:text-white">Substance Insights</h1>
      </div>

      {/* Period picker */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {PERIOD_LABELS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${
              period === p.key
                ? 'bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{totalEntries}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">entries</p>
            </div>
            <div>
              <p className="text-2xl font-bold dark:text-white">{uniqueSubstances}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">substances</p>
            </div>
            <div>
              <p className="text-2xl font-bold dark:text-white">{avgIntensity}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">avg intensity</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Frequency by substance bar chart */}
      {substanceFrequency.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">By Substance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={substanceFrequency} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis dataKey="substance" type="category" width={80} tick={{ fontSize: 12 }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {substanceFrequency.map((entry) => (
                    <Cell key={entry.substance} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Daily usage over time */}
      {dailyData.data.length > 0 && dailyData.substances.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Usage Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData.data} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  interval={period === '7d' ? 0 : 'preserveStartEnd'}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                {dailyData.substances.map((s) => (
                  <Bar
                    key={s}
                    dataKey={s}
                    stackId="a"
                    fill={SUBSTANCE_COLORS[s] || '#94a3b8'}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {filteredLogs.length === 0 && (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <p>No data for this period</p>
        </div>
      )}
    </div>
  );
}
