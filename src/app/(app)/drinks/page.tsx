'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Droplets, BarChart3, Settings2, Leaf } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DrinkLog, DrinkFavorite, DrinkGoal, SubstanceLog } from '@/types';
import {
  calculateStandardUnits,
  estimateCalories,
  getUnitColor,
  getProgressColor,
  getDryStreak,
  formatTime,
} from '@/lib/drinks';
import { displayUnits } from '@/lib/units-calculator';

const SUBSTANCE_EMOJI: Record<string, string> = {
  Cannabis: '\u{1F33F}',
  MDMA: '\u{1F48A}',
  Psilocybin: '\u{1F344}',
  Cocaine: '\u2744\uFE0F',
  Ketamine: '\u{1F489}',
  Other: '\u{1F9EA}',
};

function formatSubstanceTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

type Tab = 'drinks' | 'substances';

export default function DrinksPage() {
  const [tab, setTab] = useState<Tab>('drinks');
  const [logs, setLogs] = useState<DrinkLog[]>([]);
  const [allLogs, setAllLogs] = useState<DrinkLog[]>([]);
  const [favorites, setFavorites] = useState<DrinkFavorite[]>([]);
  const [goal, setGoal] = useState<DrinkGoal | null>(null);
  const [substanceLogs, setSubstanceLogs] = useState<SubstanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDryDay, setIsDryDay] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const dailyLimit = goal?.daily_unit_limit ?? goal?.dailyUnitLimit ?? 2;

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [logsRes, allLogsRes, favsRes, goalRes, substanceRes] = await Promise.all([
      supabase
        .from('drink_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', todayStart.toISOString())
        .lte('logged_at', todayEnd.toISOString())
        .order('logged_at', { ascending: false }),
      supabase
        .from('drink_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(500),
      supabase
        .from('drink_favorites')
        .select('*')
        .eq('user_id', user.id)
        .limit(10),
      supabase
        .from('drink_goals')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('substance_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', todayStart.toISOString())
        .lte('logged_at', todayEnd.toISOString())
        .order('logged_at', { ascending: false }),
    ]);

    setLogs(logsRes.data || []);
    setAllLogs(allLogsRes.data || []);
    setFavorites(favsRes.data || []);
    if (goalRes.data) setGoal(goalRes.data);
    setSubstanceLogs(substanceRes.data || []);
    setLoading(false);
  }

  const todayUnits = logs.reduce(
    (sum, l) => sum + (l.standard_units ?? l.standardUnits ?? 0),
    0
  );
  const todayCount = logs.length;
  const todayCals = estimateCalories(todayUnits);
  const progress = dailyLimit > 0 ? Math.min((todayUnits / dailyLimit) * 100, 100) : 0;
  const dryStreak = getDryStreak(allLogs);

  // Substance stats
  const substanceTodayCount = substanceLogs.length;
  const substanceCounts: Record<string, number> = {};
  substanceLogs.forEach((l) => {
    substanceCounts[l.substance] = (substanceCounts[l.substance] || 0) + 1;
  });

  async function quickLog(fav: DrinkFavorite) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const vol = fav.volume_ml ?? fav.volumeMl ?? 0;
    const abv = fav.abv_percent ?? fav.abvPercent ?? 0;
    const units = calculateStandardUnits(vol, abv);

    const { error } = await supabase.from('drink_logs').insert({
      user_id: user.id,
      logged_at: new Date().toISOString(),
      drink_name: fav.drink_name ?? fav.drinkName,
      category: fav.category,
      volume_ml: vol,
      abv_percent: abv,
    });

    if (error) {
      toast({ title: 'Error logging drink', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Drink logged', description: `${fav.drink_name ?? fav.drinkName} — ${units} units` });
      loadData();
    }
  }

  async function deleteDrink(id: string) {
    const { error } = await supabase.from('drink_logs').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Drink removed' });
      loadData();
    }
  }

  async function deleteSubstance(id: string) {
    const { error } = await supabase.from('substance_logs').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Entry removed' });
      loadData();
    }
  }

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-white">
          {tab === 'drinks' ? 'Drinks' : 'Substances'}
        </h1>
        <div className="flex gap-2">
          <Link href={tab === 'drinks' ? '/drinks/insights' : '/substances/insights'}>
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-1" />
              Insights
            </Button>
          </Link>
          {tab === 'drinks' && (
            <Link href="/drinks/settings">
              <Button variant="outline" size="sm">
                <Settings2 className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setTab('drinks')}
          className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
            tab === 'drinks'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Drinks
        </button>
        <button
          onClick={() => setTab('substances')}
          className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
            tab === 'substances'
              ? 'bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Substances
        </button>
      </div>

      {/* ─── DRINKS TAB ─── */}
      {tab === 'drinks' && (
        <>
          {/* Dry Day Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!isDryDay && logs.length > 0) {
                  toast({
                    title: 'Drinks logged today',
                    description: `You have ${logs.length} drink${logs.length === 1 ? '' : 's'} logged today. Remove them first to mark as a dry day.`,
                    variant: 'destructive',
                  });
                  return;
                }
                setIsDryDay(!isDryDay);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDryDay ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDryDay ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm font-medium dark:text-gray-200">
              Dry day {isDryDay && dryStreak > 0 && `— ${dryStreak} day streak`}
            </span>
          </div>

          {/* Log a Drink button */}
          {!isDryDay && (
            <Link href="/drinks/log" className="block">
              <Button className="w-full text-lg py-6" size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Log a Drink
              </Button>
            </Link>
          )}

          {isDryDay && dryStreak > 0 && (
            <Card>
              <CardContent className="py-6 text-center">
                <Droplets className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold dark:text-white">{dryStreak} day streak</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Keep it going</p>
              </CardContent>
            </Card>
          )}

          {/* Today's Tally */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className={`text-2xl font-bold ${getUnitColor(todayUnits, dailyLimit)}`}>
                    {displayUnits(todayUnits)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">units</p>
                </div>
                <div>
                  <p className="text-2xl font-bold dark:text-white">{todayCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">drinks</p>
                </div>
                <div>
                  <p className="text-2xl font-bold dark:text-white">{todayCals}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">kcal est.</p>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>{displayUnits(todayUnits)} / {dailyLimit} units</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressColor(todayUnits, dailyLimit)}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick-log favorites */}
          {!isDryDay && favorites.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Quick Log</h2>
              <div className="grid grid-cols-2 gap-2">
                {favorites.slice(0, 4).map((fav) => (
                  <Button
                    key={fav.id}
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-start text-left"
                    onClick={() => quickLog(fav)}
                  >
                    <span className="font-medium text-sm dark:text-white truncate w-full">
                      {fav.drink_name ?? fav.drinkName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {calculateStandardUnits(
                        fav.volume_ml ?? fav.volumeMl ?? 0,
                        fav.abv_percent ?? fav.abvPercent ?? 0
                      )} units
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Today's drink list */}
          {logs.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Today&apos;s Drinks
              </h2>
              <div className="space-y-2">
                {logs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 dark:text-gray-500 w-16">
                          {formatTime(log.logged_at || log.loggedAt || '')}
                        </span>
                        <span className="font-medium text-sm dark:text-white">
                          {log.drink_name ?? log.drinkName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getUnitColor(
                            log.standard_units ?? log.standardUnits ?? 0,
                            dailyLimit
                          )} bg-gray-100 dark:bg-gray-700`}
                        >
                          {displayUnits(log.standard_units ?? log.standardUnits ?? 0)}u
                        </span>
                        <button
                          onClick={() => deleteDrink(log.id)}
                          className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {logs.length === 0 && !isDryDay && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <Droplets className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No drinks logged today</p>
            </div>
          )}
        </>
      )}

      {/* ─── SUBSTANCES TAB ─── */}
      {tab === 'substances' && (
        <>
          {/* Log button */}
          <Link href="/substances/log" className="block">
            <Button className="w-full text-lg py-6 bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Log Substance
            </Button>
          </Link>

          {/* Today's Tally */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{substanceTodayCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">entries</p>
                </div>
                <div>
                  <p className="text-2xl font-bold dark:text-white">
                    {Object.keys(substanceCounts).length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">substances</p>
                </div>
              </div>

              {/* Substance breakdown chips */}
              {Object.keys(substanceCounts).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(substanceCounts).map(([substance, count]) => (
                    <span
                      key={substance}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
                    >
                      {SUBSTANCE_EMOJI[substance] || '\u{1F9EA}'} {substance} × {count}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's log list */}
          {substanceLogs.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Today&apos;s Log
              </h2>
              <div className="space-y-2">
                {substanceLogs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 dark:text-gray-500 w-16">
                          {formatSubstanceTime(log.logged_at || log.loggedAt || '')}
                        </span>
                        <div>
                          <span className="font-medium text-sm dark:text-white">
                            {SUBSTANCE_EMOJI[log.substance] || '\u{1F9EA}'} {log.substance}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {log.method} · {log.dose}
                            {log.intensity && ` · ${log.intensity}/5`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSubstance(log.id)}
                        className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {substanceLogs.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <Leaf className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No substances logged today</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
