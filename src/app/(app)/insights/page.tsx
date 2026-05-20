'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowRight,
  Heart,
  TrendingDown,
  TrendingUp,
  Wine,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getPainColor } from '@/lib/utils';
import { currentRecoveryStage } from '@/lib/rules-engine';
import { getDryStreak } from '@/lib/drinks';
import { displayUnits } from '@/lib/units-calculator';
import type { UserProfile, DailyLog, DrinkLog, DrinkGoal } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

function getDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getLogDrinks(l: DrinkLog): number {
  const units = l.standard_units ?? l.standardUnits ?? 0;
  const qty = l.quantity ?? 1;
  return units * qty;
}

export default function CombinedInsightsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [shoulderLogs, setShoulderLogs] = useState<DailyLog[]>([]);
  const [drinkLogs, setDrinkLogs] = useState<DrinkLog[]>([]);
  const [drinkGoal, setDrinkGoal] = useState<DrinkGoal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, logsRes, drinkRes, goalRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('logs').select('*').eq('user_id', user.id).order('date', { ascending: true }),
      supabase.from('drink_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: true }),
      supabase.from('drink_goals').select('*').eq('user_id', user.id).single(),
    ]);

    if (profileRes.data) setProfile(profileRes.data as unknown as UserProfile);
    if (logsRes.data) setShoulderLogs(logsRes.data as unknown as DailyLog[]);
    if (drinkRes.data) setDrinkLogs(drinkRes.data as unknown as DrinkLog[]);
    if (goalRes.data) setDrinkGoal(goalRes.data as unknown as DrinkGoal);

    setLoading(false);
  }

  // Shoulder analytics
  const painChartData = useMemo(() => {
    return shoulderLogs.slice(-30).map(l => ({
      date: l.date,
      pain: l.pain,
      instability: l.instability,
      sleep: l.sleep_impact ?? l.sleepImpact ?? 0,
    }));
  }, [shoulderLogs]);

  const stage = profile ? currentRecoveryStage(profile, shoulderLogs.slice().reverse()) : 'early-rehab';
  const avgPain = shoulderLogs.length > 0
    ? shoulderLogs.slice(-14).reduce((s, l) => s + l.pain, 0) / Math.min(shoulderLogs.length, 14)
    : 0;
  const recentLogs = shoulderLogs.slice(-3);
  const oldLogs = shoulderLogs.slice(-14, -11);
  const painTrend = recentLogs.length > 0 && oldLogs.length > 0
    ? (recentLogs.reduce((s, l) => s + l.pain, 0) / recentLogs.length) -
      (oldLogs.reduce((s, l) => s + l.pain, 0) / oldLogs.length)
    : 0;

  // YTD shoulder analytics
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const ytdLogs = shoulderLogs.filter(l => new Date(l.date + 'T12:00:00') >= yearStart);
  const ytdAvgPain = ytdLogs.length > 0
    ? ytdLogs.reduce((s, l) => s + l.pain, 0) / ytdLogs.length
    : 0;
  const ytdLowPainDays = ytdLogs.filter(l => l.pain <= 3).length;
  const daysElapsed = Math.floor((Date.now() - yearStart.getTime()) / 86400000) + 1;
  const ytdConsistency = daysElapsed > 0 ? Math.round((ytdLogs.length / daysElapsed) * 100) : 0;
  const ytdFirstHalf = ytdLogs.slice(0, Math.ceil(ytdLogs.length / 2));
  const ytdSecondHalf = ytdLogs.slice(Math.ceil(ytdLogs.length / 2));
  const ytdPainTrend = ytdFirstHalf.length > 0 && ytdSecondHalf.length > 0
    ? (ytdSecondHalf.reduce((s, l) => s + l.pain, 0) / ytdSecondHalf.length) -
      (ytdFirstHalf.reduce((s, l) => s + l.pain, 0) / ytdFirstHalf.length)
    : 0;

  // Drink analytics
  const dailyLimit = drinkGoal?.daily_unit_limit ?? drinkGoal?.dailyUnitLimit ?? 2;
  const weeklyLimit = drinkGoal?.weekly_unit_limit ?? drinkGoal?.weeklyUnitLimit ?? 14;

  const drinkChartData = useMemo(() => {
    const byDay: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      byDay[getDateKey(d)] = 0;
    }
    drinkLogs.forEach(l => {
      const d = new Date(l.logged_at || l.loggedAt || '');
      const key = getDateKey(d);
      if (key in byDay) byDay[key] = (byDay[key] || 0) + getLogDrinks(l);
    });
    return Object.entries(byDay).map(([date, units]) => ({
      date: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      units: Math.round(units * 10) / 10,
    }));
  }, [drinkLogs]);

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weeklyUnits = drinkLogs
    .filter(l => new Date(l.logged_at || l.loggedAt || '').getTime() >= weekStart.getTime())
    .reduce((s, l) => s + getLogDrinks(l), 0);

  const last30 = new Date();
  last30.setDate(last30.getDate() - 30);
  last30.setHours(0, 0, 0, 0);
  const monthlyLogs = drinkLogs.filter(l => new Date(l.logged_at || l.loggedAt || '').getTime() >= last30.getTime());
  const totalUnits30d = monthlyLogs.reduce((s, l) => s + getLogDrinks(l), 0);
  const dryDays30d = 30 - new Set(monthlyLogs.map(l => getDateKey(new Date(l.logged_at || l.loggedAt || '')))).size;
  const dryStreak = getDryStreak(drinkLogs);

  // YTD drink analytics
  const ytdDrinkLogs = drinkLogs.filter(l => new Date(l.logged_at || l.loggedAt || '').getTime() >= yearStart.getTime());
  const ytdTotalDrinks = ytdDrinkLogs.reduce((s, l) => s + getLogDrinks(l), 0);
  const ytdDrinkDays = new Set(ytdDrinkLogs.map(l => getDateKey(new Date(l.logged_at || l.loggedAt || '')))).size;
  const ytdDryDays = daysElapsed - ytdDrinkDays;
  const weeksElapsed = daysElapsed / 7;
  const ytdWeeklyAvg = weeksElapsed > 0 ? ytdTotalDrinks / weeksElapsed : 0;
  const yearlyTarget = drinkGoal?.yearly_drink_target ?? drinkGoal?.yearlyDrinkTarget ?? null;
  const ytdTargetPct = yearlyTarget && yearlyTarget > 0 ? Math.round((ytdTotalDrinks / yearlyTarget) * 100) : null;
  const yearPct = Math.round((daysElapsed / 365) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-6">Insights</h1>

      <Tabs defaultValue="shoulder">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="shoulder" className="flex-1 gap-1">
            <Heart className="w-4 h-4" /> Shoulder
          </TabsTrigger>
          <TabsTrigger value="drinks" className="flex-1 gap-1">
            <Wine className="w-4 h-4" /> Drinks
          </TabsTrigger>
        </TabsList>

        {/* ─── Shoulder Tab ─── */}
        <TabsContent value="shoulder">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Avg Pain (14d)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${getPainColor(avgPain)}`}>
                    {avgPain.toFixed(1)}
                  </span>
                  {painTrend !== 0 && (
                    <span className={painTrend < 0 ? 'text-green-600' : 'text-red-500'}>
                      {painTrend < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Stage</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium capitalize dark:text-white">{stage.replace('-', ' ')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Total Logs</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold dark:text-white">{shoulderLogs.length}</span>
              </CardContent>
            </Card>
          </div>

          {/* YTD summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">This Year (YTD)</CardTitle>
              <CardDescription>{new Date().getFullYear()} · {daysElapsed} days elapsed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Logs</p>
                  <p className="text-2xl font-bold dark:text-white">{ytdLogs.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">entries</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Pain</p>
                  <div className="flex items-center gap-1">
                    <span className={`text-2xl font-bold ${getPainColor(ytdAvgPain)}`}>
                      {ytdLogs.length > 0 ? ytdAvgPain.toFixed(1) : '—'}
                    </span>
                    {ytdLogs.length > 1 && (
                      <span className={ytdPainTrend < 0 ? 'text-green-600' : 'text-red-500'}>
                        {ytdPainTrend < 0
                          ? <TrendingDown className="w-4 h-4" />
                          : <TrendingUp className="w-4 h-4" />}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">/ 10</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Low-Pain Days</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{ytdLowPainDays}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">pain ≤ 3</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Consistency</p>
                  <p className="text-2xl font-bold dark:text-white">{ytdConsistency}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">days logged</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pain chart */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Pain & Instability (last 30 logs)</CardTitle>
            </CardHeader>
            <CardContent>
              {painChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={painChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v: string) => {
                        const d = new Date(v + 'T12:00:00');
                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }}
                    />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      labelFormatter={(v: string) => {
                        const d = new Date(v + 'T12:00:00');
                        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                      }}
                    />
                    <Line type="monotone" dataKey="pain" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Pain" />
                    <Line type="monotone" dataKey="instability" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} name="Instability" />
                    <Line type="monotone" dataKey="sleep" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2 }} name="Sleep Impact" />
                    <ReferenceLine y={3} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Low pain', fontSize: 10 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No shoulder logs yet</p>
              )}
            </CardContent>
          </Card>

          {/* ROM progress */}
          {shoulderLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ROM Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shoulderLogs.slice(-5).reverse().map(log => (
                    <div key={log.id} className="flex items-center justify-between text-sm border-b dark:border-gray-700 pb-2 last:border-0">
                      <span className="text-gray-500 dark:text-gray-400">
                        {new Date(log.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex gap-4">
                        <span className="dark:text-gray-300">Flex: {log.flexion_bucket || log.flexionBucket}</span>
                        <span className="dark:text-gray-300">Abd: {log.abduction_bucket || log.abductionBucket}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Drinks Tab ─── */}
        <TabsContent value="drinks">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">This Week</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold dark:text-white">{displayUnits(weeklyUnits)}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">/ {weeklyLimit} limit</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Last 30 Days</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold dark:text-white">{displayUnits(totalUnits30d)}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">std drinks</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Dry Days (30d)</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold dark:text-white">{dryDays30d}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">of 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Dry Streak</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold dark:text-white">{dryStreak}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">consecutive days</p>
              </CardContent>
            </Card>
          </div>

          {/* YTD drinks summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">This Year (YTD)</CardTitle>
              <CardDescription>{new Date().getFullYear()} · {daysElapsed} days elapsed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Drinks</p>
                  <p className="text-2xl font-bold dark:text-white">{displayUnits(ytdTotalDrinks)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">std drinks</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Weekly Avg</p>
                  <p className="text-2xl font-bold dark:text-white">{displayUnits(ytdWeeklyAvg)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">/ {weeklyLimit} limit</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dry Days</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{ytdDryDays}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">of {daysElapsed} days</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {yearlyTarget ? 'vs Target' : 'Year %'}
                  </p>
                  <p className={`text-2xl font-bold ${yearlyTarget && ytdTargetPct !== null && ytdTargetPct > yearPct ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                    {yearlyTarget && ytdTargetPct !== null ? `${ytdTargetPct}%` : `${yearPct}%`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {yearlyTarget
                      ? `of ${yearlyTarget} target · year ${yearPct}%`
                      : 'of year elapsed'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily drinks chart (last 30 days) */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Daily Std Drinks (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              {drinkChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={drinkChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <ReferenceLine y={dailyLimit} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Daily limit', fontSize: 10 }} />
                    <Bar dataKey="units" fill="#8b5cf6" radius={[2, 2, 0, 0]} name="Std Drinks" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No drink logs yet</p>
              )}
            </CardContent>
          </Card>

          {/* Full insights link */}
          <Link href="/drinks/insights">
            <Button variant="outline" className="w-full">
              Full Drink Insights <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </TabsContent>
      </Tabs>
    </div>
  );
}
