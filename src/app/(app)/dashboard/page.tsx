'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  ArrowRight,
  Calendar,
  Dumbbell,
  Flame,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getStreak, formatDateShort, getPainColor, isToday } from '@/lib/utils';
import { currentRecoveryStage, suggestNextMilestone, allowedActivities } from '@/lib/rules-engine';
import type { UserProfile, DailyLog, Milestone, WorkoutCompletion } from '@/types';

// Simple sparkline component
function Sparkline({ data, color = 'blue' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;

  const max = Math.max(...data, 10);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const height = 40;
  const width = 120;
  const step = width / (data.length - 1);

  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color === 'green' ? '#22c55e' : color === 'red' ? '#ef4444' : '#3b82f6'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [completions, setCompletions] = useState<WorkoutCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData as unknown as UserProfile);
    }

    // Load recent logs (last 14 days)
    const { data: logsData } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(14);

    if (logsData) {
      setLogs(logsData as unknown as DailyLog[]);
    }

    // Load recent milestones
    const { data: milestonesData } = await supabase
      .from('milestones')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(5);

    if (milestonesData) {
      setMilestones(milestonesData as unknown as Milestone[]);
    }

    // Load workout completions this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: completionsData } = await supabase
      .from('workout_completions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekAgo.toISOString().split('T')[0]);

    if (completionsData) {
      setCompletions(completionsData as unknown as WorkoutCompletion[]);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  const latestLog = logs[0] || null;
  const streak = getStreak(logs);
  const stage = profile ? currentRecoveryStage(profile, logs) : 'early-rehab';
  const allowed = profile ? allowedActivities(profile, latestLog) : null;
  const nextMilestone = profile ? suggestNextMilestone(profile, latestLog) : '';

  // Calculate trends
  const painData = logs.slice().reverse().map(l => l.pain);
  const avgPain = painData.length > 0 ? painData.reduce((a, b) => a + b, 0) / painData.length : 0;
  const recentPain = painData.slice(-3);
  const oldPain = painData.slice(0, 3);
  const painTrend = recentPain.length > 0 && oldPain.length > 0
    ? (recentPain.reduce((a, b) => a + b, 0) / recentPain.length) -
      (oldPain.reduce((a, b) => a + b, 0) / oldPain.length)
    : 0;

  // Weekly stats
  const rehabSessions = completions.filter(c => c.kind === 'rehab').length;
  const cardioMinutes = logs.filter(l => l.did_cardio || l.didCardio).length * 30; // Estimate

  const hasLoggedToday = latestLog && isToday(latestLog.date);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-600">
            Stage: <span className="font-medium capitalize">{stage.replace('-', ' ')}</span>
          </p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-3 py-2 rounded-lg">
            <Flame className="w-5 h-5" />
            <span className="font-medium">{streak} day streak</span>
          </div>
        )}
      </div>

      {/* Quick action */}
      {!hasLoggedToday && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium">Log how you&apos;re feeling today</p>
                <p className="text-sm text-gray-600">Takes less than 60 seconds</p>
              </div>
            </div>
            <Link href="/log">
              <Button>
                Quick Log <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Avg Pain (14d)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-bold ${getPainColor(avgPain)}`}>
                {avgPain.toFixed(1)}
              </span>
              {painTrend !== 0 && (
                <span className={painTrend < 0 ? 'text-green-600' : 'text-red-500'}>
                  {painTrend < 0 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                </span>
              )}
            </div>
            <Sparkline data={painData} color={avgPain <= 3 ? 'green' : avgPain <= 6 ? 'blue' : 'red'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Rehab This Week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold">{rehabSessions}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">sessions completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Cardio This Week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold">~{cardioMinutes}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">minutes estimated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Latest ROM</CardDescription>
          </CardHeader>
          <CardContent>
            {latestLog ? (
              <div className="text-sm">
                <p>Flex: {latestLog.flexionBucket}</p>
                <p>Abd: {latestLog.abductionBucket}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No logs yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next milestone */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Next Milestone</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{nextMilestone}</p>
          <Link href="/milestones">
            <Button variant="outline" size="sm" className="mt-3">
              View All Milestones
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Allowed activities */}
      {allowed && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">What You Can Do</CardTitle>
            <CardDescription>Based on your current restrictions and pain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Cardio Options</p>
                <div className="flex flex-wrap gap-2">
                  {allowed.cardio.map(c => (
                    <span key={c} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Strength Areas</p>
                <div className="flex flex-wrap gap-2">
                  {allowed.strength.map(s => (
                    <span key={s} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {allowed.isDeloadWeek && (
              <div className="mt-4 p-3 bg-amber-50 rounded-md text-sm text-amber-800">
                Deload week recommended - pain or instability is elevated. Take it easy.
              </div>
            )}
            {allowed.notes.length > 0 && (
              <ul className="mt-3 text-sm text-gray-600 space-y-1">
                {allowed.notes.map((note, i) => (
                  <li key={i}>• {note}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent activity timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  log.pain <= 3 ? 'bg-green-100 text-green-700' :
                  log.pain <= 6 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {log.pain}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{formatDateShort(log.date)}</p>
                  <p className="text-xs text-gray-500">
                    Pain: {log.pain}/10 | Flex: {log.flexion_bucket || log.flexionBucket}
                    {(log.did_rehab || log.didRehab) && ' | Did rehab'}
                    {(log.did_cardio || log.didCardio) && ' | Did cardio'}
                  </p>
                </div>
              </div>
            ))}
            {milestones.slice(0, 3).map(m => (
              <div key={m.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{formatDateShort(m.date)}</p>
                  <p className="text-xs text-gray-500">
                    Milestone: {m.type.replace(/-/g, ' ')}
                    {m.value && ` - ${m.value}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {logs.length === 0 && milestones.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No activity yet. Start by logging how you feel today!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
