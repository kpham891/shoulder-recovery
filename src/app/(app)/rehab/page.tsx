'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Activity, Check, Clock, Info, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { currentRecoveryStage, rehabPlan } from '@/lib/rules-engine';
import type { UserProfile, DailyLog, RehabWorkout, WorkoutExercise } from '@/types';

export default function RehabPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [workout, setWorkout] = useState<RehabWorkout | null>(null);
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
      const stage = currentRecoveryStage(profile, logs);
      const latestLog = logs[0] || null;
      const plan = rehabPlan(stage, profile, latestLog);
      setWorkout(plan);
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
    if (!workout) return;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('workout_completions').insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        kind: 'rehab',
        workout_payload: workout,
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
        title: 'Rehab session complete!',
        description: 'Great work on your recovery.',
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
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const progress = workout
    ? (completedExercises.size / workout.exercises.length) * 100
    : 0;

  const stage = profile ? currentRecoveryStage(profile, logs) : 'early-rehab';

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 dark:text-white">
          <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Rehab Workout
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Stage: <span className="font-medium capitalize">{stage.replace('-', ' ')}</span>
        </p>
      </div>

      {/* Safety disclaimer */}
      <Card className="mb-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30">
        <CardContent className="py-3 flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Only do what your PT/surgeon has cleared. Stop any exercise that causes sharp pain.
          </p>
        </CardContent>
      </Card>

      {workout && (
        <>
          {/* Progress */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{workout.name}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  {workout.totalDuration}
                </div>
              </div>
              {workout.notes && (
                <CardDescription className="text-amber-600 dark:text-amber-400">{workout.notes}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Progress value={progress} className="flex-1" />
                <span className="text-sm font-medium">
                  {completedExercises.size}/{workout.exercises.length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Exercises */}
          <div className="space-y-4">
            {workout.exercises.map((we: WorkoutExercise, index: number) => {
              const isCompleted = completedExercises.has(we.exercise.id);
              return (
                <Card
                  key={we.exercise.id}
                  className={isCompleted ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30' : ''}
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
                          className={`text-base font-medium cursor-pointer ${
                            isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : 'dark:text-white'
                          }`}
                        >
                          {index + 1}. {we.exercise.name}
                        </Label>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                          {we.sets} sets
                          {we.reps && ` × ${we.reps} reps`}
                          {we.duration && ` × ${we.duration}`}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {we.exercise.instructions}
                        </p>
                      </div>
                      {isCompleted && (
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Complete button */}
          <div className="mt-6">
            <Button
              onClick={handleComplete}
              disabled={completedExercises.size === 0 || saving}
              className="w-full"
              size="lg"
            >
              {saving ? 'Saving...' : `Mark Session Complete (${completedExercises.size}/${workout.exercises.length})`}
            </Button>
          </div>
        </>
      )}

      {/* Tips */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Tips</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <li>• Warm up with gentle arm movements before starting</li>
            <li>• Move slowly and controlled - no jerky movements</li>
            <li>• Breathe normally throughout each exercise</li>
            <li>• If pain increases by more than 2 points, stop and rest</li>
            <li>• Ice for 10-15 min after if you notice swelling</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
