'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  ArrowRight,
  Flame,
  Heart,
  Plus,
  TrendingDown,
  TrendingUp,
  Trophy,
  Wine,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getStreak, formatDateShort, getPainColor, isToday } from '@/lib/utils';
import { currentRecoveryStage } from '@/lib/rules-engine';
import { getDryStreak } from '@/lib/drinks';
import type { UserProfile, DailyLog, Milestone, DrinkLog, DrinkGoal } from '@/types';

export default function HomePage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [drinkLogs, setDrinkLogs] = useState<DrinkLog[]>([]);
  const [todayDrinkLogs, setTodayDrinkLogs] = useState<DrinkLog[]>([]);
  const [drinkGoal, setDrinkGoal] = useState<DrinkGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [profileRes, logsRes, milestonesRes, drinkLogsRes, todayDrinksRes, goalRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(14),
      supabase.from('milestones').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(5),
      supabase.from('drink_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(90),
      supabase.from('drink_logs').select('*').eq('user_id', user.id)
        .gte('logged_at', todayStart.toISOString())
        .lte('logged_at', todayEnd.toISOString()),
      supabase.from('drink_goals').select('*').eq('user_id', user.id).single(),
    ]);

    if (profileRes.data) setProfile(profileRes.data as unknown as UserProfile);
    if (logsRes.data) setLogs(logsRes.data as unknown as DailyLog[]);
    if (milestonesRes.data) setMilestones(milestonesRes.data as unknown as Milestone[]);
    if (drinkLogsRes.data) setDrinkLogs(drinkLogsRes.data as unknown as DrinkLog[]);
    if (todayDrinksRes.data) setTodayDrinkLogs(todayDrinksRes.data as unknown as DrinkLog[]);
    if (goalRes.data) setDrinkGoal(goalRes.data as unknown as DrinkGoal);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  // Shoulder stats
  const latestLog = logs[0] || null;
  const shoulderStreak = getStreak(logs);
  const stage = profile ? currentRecoveryStage(profile, logs) : 'early-rehab';
  const hasLoggedToday = latestLog && isToday(latestLog.date);
  const painData = logs.slice().reverse().map(l => l.pain);
  const avgPain = painData.length > 0 ? painData.reduce((a, b) => a + b, 0) / painData.length : 0;
  const recentPain = painData.slice(-3);
  const oldPain = painData.slice(0, 3);
  const painTrend = recentPain.length > 0 && oldPain.length > 0
    ? (recentPain.reduce((a, b) => a + b, 0) / recentPain.length) -
      (oldPain.reduce((a, b) => a + b, 0) / oldPain.length)
    : 0;

  // Drink stats
  const dailyLimit = drinkGoal?.daily_unit_limit ?? drinkGoal?.dailyUnitLimit ?? 2;
  const weeklyLimit = drinkGoal?.weekly_unit_limit ?? drinkGoal?.weeklyUnitLimit ?? 14;

  function getLogUnits(l: DrinkLog): number {
    const units = l.standard_units ?? l.standardUnits ?? 0;
    const qty = l.quantity ?? 1;
    return units * qty;
  }

  const todayUnits = todayDrinkLogs.reduce((sum, l) => sum + getLogUnits(l), 0);
  const dryStreak = getDryStreak(drinkLogs);

  // Weekly units (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);
  const weeklyUnits = drinkLogs
    .filter(l => new Date(l.logged_at || l.loggedAt || '').getTime() >= weekAgo.getTime())
    .reduce((sum, l) => sum + getLogUnits(l), 0);

  // Recent activity: combine shoulder logs + drink logs + milestones, sorted by date
  type ActivityItem = { date: Date; type: 'shoulder' | 'drink' | 'milestone'; label: string; sub: string; color: string };
  const activities: ActivityItem[] = [];

  logs.slice(0, 5).forEach(log => {
    activities.push({
      date: new Date(log.date),
      type: 'shoulder',
      label: `Pain: ${log.pain}/10`,
      sub: `Flex: ${log.flexion_bucket || log.flexionBucket}${(log.did_rehab || log.didRehab) ? ' | Rehab' : ''}`,
      color: log.pain <= 3 ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
        : log.pain <= 6 ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
        : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400',
    });
  });

  todayDrinkLogs.slice(0, 3).forEach(log => {
    activities.push({
      date: new Date(log.logged_at || log.loggedAt || ''),
      type: 'drink',
      label: `${log.drink_name || log.drinkName}`,
      sub: `${getLogUnits(log).toFixed(1)} std drinks${(log.quantity ?? 1) > 1 ? ` (x${log.quantity})` : ''}`,
      color: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400',
    });
  });

  milestones.slice(0, 3).forEach(m => {
    activities.push({
      date: new Date(m.date),
      type: 'milestone',
      label: m.type.replace(/-/g, ' '),
      sub: m.value ? String(m.value) : 'Achievement unlocked',
      color: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400',
    });
  });

  activities.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header with streaks */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Home</h1>
        <div className="flex items-center gap-2">
          {shoulderStreak > 0 && (
            <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-lg text-sm">
              <Flame className="w-4 h-4" />
              <span className="font-medium">{shoulderStreak}d</span>
            </div>
          )}
        </div>
      </div>

      {/* Log launcher button */}
      <Button
        size="lg"
        className="w-full mb-6 text-lg py-6"
        onClick={() => setSheetOpen(true)}
      >
        <Plus className="w-5 h-5 mr-2" />
        Log something
      </Button>

      {/* Log launcher sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="mb-4">
            <SheetTitle>What do you want to log?</SheetTitle>
            <SheetDescription>Choose a category to get started</SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-4 pb-4">
            <Link href="/log" onClick={() => setSheetOpen(false)}>
              <Card className="cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                <CardContent className="flex flex-col items-center gap-2 py-6">
                  <Heart className="w-8 h-8 text-rose-500" />
                  <span className="font-medium dark:text-white">Shoulder</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Pain, ROM, rehab</span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/drinks/log" onClick={() => setSheetOpen(false)}>
              <Card className="cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                <CardContent className="flex flex-col items-center gap-2 py-6">
                  <Wine className="w-8 h-8 text-purple-500" />
                  <span className="font-medium dark:text-white">Drink</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Beer, wine, spirits</span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Shoulder card */}
        <Link href="/recovery">
          <Card className="h-full hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1 text-xs">
                <Heart className="w-3 h-3" /> Shoulder
              </CardDescription>
            </CardHeader>
            <CardContent>
              {latestLog ? (
                <>
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
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    avg pain (14d) · {stage.replace('-', ' ')}
                  </p>
                  {!hasLoggedToday && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Not logged today</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No logs yet</p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Drinks card */}
        <Link href="/drinks">
          <Card className="h-full hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1 text-xs">
                <Wine className="w-3 h-3" /> Drinks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">
                {todayUnits.toFixed(1)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                std drinks today · {weeklyUnits.toFixed(1)}/{weeklyLimit} this week
              </p>
              {dryStreak > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">{dryStreak} day dry streak</p>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.slice(0, 8).map((activity, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b dark:border-gray-700 last:border-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${activity.color}`}>
                  {activity.type === 'shoulder' && <Heart className="w-4 h-4" />}
                  {activity.type === 'drink' && <Wine className="w-4 h-4" />}
                  {activity.type === 'milestone' && <Trophy className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium dark:text-white">{activity.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDateShort(activity.date)} · {activity.sub}
                  </p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No activity yet. Start by logging something!
              </p>
            )}
          </div>
          {activities.length > 0 && (
            <Link href="/insights" className="block mt-4">
              <Button variant="outline" size="sm" className="w-full">
                View Insights <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
