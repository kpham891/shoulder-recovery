'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Bike,
  Check,
  Clock,
  Dumbbell,
  Footprints,
  Shield,
  Target,
  Zap,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { fitnessPlan, allowedActivities } from '@/lib/rules-engine';
import type { UserProfile, DailyLog, FitnessWorkout, WeeklyPlan, WorkoutExercise } from '@/types';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCardioIcon(type: string) {
  switch (type) {
    case 'run':
    case 'walk':
      return Footprints;
    case 'bike':
      return Bike;
    default:
      return Zap;
  }
}

export default function FitnessPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<FitnessWorkout | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData as unknown as UserProfile);
    }

    const { data: logsData } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(14);

    if (logsData) {
      setLogs(logsData as unknown as DailyLog[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (profile && !loading) {
      const latestLog = logs[0] || null;
      const plan = fitnessPlan(profile, latestLog, logs);
      setWeeklyPlan(plan);

      // Find today's workout
      const today = new Date().getDay();
      const todaysEntry = plan.workouts.find(w => w.day === today);
      if (todaysEntry?.fitness) {
        setTodayWorkout(todaysEntry.fitness);
      }
    }
  }, [profile, logs, loading]);

  const toggleExercise = (exerciseId: string) => {
    const newSet = new Set(completedExercises);
    if (newSet.has(exerciseId)) {
      newSet.delete(exerciseId);
    } else {
      newSet.add(exerciseId);
    }
    setCompletedExercises(newSet);
  };

  const handleComplete = async () => {
    if (!todayWorkout) return;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('workout_completions').insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        kind: 'fitness',
        workout_payload: todayWorkout,
      });

      if (error) {
        toast({
          title: 'Error saving',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Workout complete!',
        description: 'Keep up the great work.',
      });

      setCompletedExercises(new Set());
    } catch {
      toast({
        title: 'Error',
        description: 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  const latestLog = logs[0] || null;
  const allowed = profile ? allowedActivities(profile, latestLog) : null;

  const progress = todayWorkout
    ? (completedExercises.size / todayWorkout.exercises.length) * 100
    : 0;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Dumbbell className="w-6 h-6 text-blue-600" />
          Fitness Workouts
        </h1>
        <p className="text-gray-600">
          Goal: <span className="font-medium capitalize">
            {profile?.goal.type.replace('-', ' ') || 'General conditioning'}
          </span>
        </p>
      </div>

      {/* Safety disclaimer */}
      <Card className="mb-6 border-amber-200 bg-amber-50">
        <CardContent className="py-3 flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            These workouts respect your shoulder restrictions. Stop if you experience any shoulder pain.
          </p>
        </CardContent>
      </Card>

      {/* Deload warning */}
      {allowed?.isDeloadWeek && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="py-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Deload Week Recommended</p>
              <p className="text-sm text-red-700">
                Your recent logs show elevated pain or instability. Take it easy this week.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">Weekly Plan</TabsTrigger>
        </TabsList>

        {/* Today's workout */}
        <TabsContent value="today">
          {todayWorkout ? (
            <>
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{todayWorkout.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {todayWorkout.totalDuration}
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      todayWorkout.intensity === 'easy' ? 'bg-green-100 text-green-700' :
                      todayWorkout.intensity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {todayWorkout.intensity}
                    </span>
                    <span className="capitalize">{todayWorkout.type}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Progress value={progress} className="flex-1" />
                    <span className="text-sm font-medium">
                      {completedExercises.size}/{todayWorkout.exercises.length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Exercises */}
              <div className="space-y-4">
                {todayWorkout.exercises.map((we: WorkoutExercise, index: number) => {
                  const isCompleted = completedExercises.has(we.exercise.id);
                  const Icon = we.exercise.category === 'cardio'
                    ? getCardioIcon(todayWorkout.cardioType || 'bike')
                    : Dumbbell;

                  return (
                    <Card
                      key={we.exercise.id}
                      className={isCompleted ? 'border-green-200 bg-green-50' : ''}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 pt-1">
                            <Checkbox
                              id={we.exercise.id}
                              checked={isCompleted}
                              onCheckedChange={() => toggleExercise(we.exercise.id)}
                              className="w-6 h-6"
                            />
                          </div>
                          <div className="flex-1">
                            <Label
                              htmlFor={we.exercise.id}
                              className={`text-base font-medium cursor-pointer flex items-center gap-2 ${
                                isCompleted ? 'line-through text-gray-500' : ''
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              {index + 1}. {we.exercise.name}
                            </Label>
                            <p className="text-sm text-blue-600 mt-1">
                              {we.sets > 1 ? `${we.sets} sets × ` : ''}
                              {we.reps && `${we.reps} reps`}
                              {we.duration && we.duration}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                              {we.exercise.instructions}
                            </p>
                          </div>
                          {isCompleted && (
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-6">
                <Button
                  onClick={handleComplete}
                  disabled={completedExercises.size === 0 || saving}
                  className="w-full"
                  size="lg"
                >
                  {saving ? 'Saving...' : `Mark Workout Complete (${completedExercises.size}/${todayWorkout.exercises.length})`}
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No fitness workout scheduled for today.</p>
                <p className="text-sm text-gray-500 mt-1">Check the weekly plan for upcoming workouts.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Weekly plan */}
        <TabsContent value="week">
          {weeklyPlan && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Week {weeklyPlan.weekNumber}</CardTitle>
                  <CardDescription>
                    Target: {weeklyPlan.totalCardioMinutes} min cardio,{' '}
                    {weeklyPlan.totalStrengthSessions} strength sessions
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid grid-cols-7 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map(day => {
                  const workout = weeklyPlan.workouts.find(w => w.day === day);
                  const isToday = new Date().getDay() === day;

                  return (
                    <div
                      key={day}
                      className={`p-2 rounded-lg text-center ${
                        isToday ? 'ring-2 ring-blue-500' : ''
                      } ${workout ? 'bg-blue-50' : 'bg-gray-50'}`}
                    >
                      <p className="text-xs font-medium text-gray-500">{dayNames[day]}</p>
                      {workout?.fitness ? (
                        <div className="mt-1">
                          {workout.fitness.type === 'cardio' ? (
                            <Bike className="w-5 h-5 mx-auto text-blue-600" />
                          ) : (
                            <Dumbbell className="w-5 h-5 mx-auto text-blue-600" />
                          )}
                          <p className="text-xs mt-1 truncate">{workout.fitness.name}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 mt-2">Rest</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                {weeklyPlan.workouts.map(({ day, fitness }) => {
                  if (!fitness) return null;
                  const isToday = new Date().getDay() === day;

                  return (
                    <Card key={day} className={isToday ? 'border-blue-200' : ''}>
                      <CardContent className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {dayNames[day]}: {fitness.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {fitness.totalDuration} | {fitness.intensity}
                          </p>
                        </div>
                        {isToday && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            Today
                          </span>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Allowed activities */}
      {allowed && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Available Activities</CardTitle>
            <CardDescription>Based on your restrictions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Cardio</p>
                <div className="flex flex-wrap gap-2">
                  {allowed.cardio.map(c => (
                    <span key={c} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm capitalize">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Strength</p>
                <div className="flex flex-wrap gap-2">
                  {allowed.strength.map(s => (
                    <span key={s} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm capitalize">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
