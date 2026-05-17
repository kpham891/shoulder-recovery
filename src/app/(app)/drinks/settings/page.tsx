'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DrinkFavorite, DrinkGoal, Sex } from '@/types';

export default function DrinkSettingsPage() {
  const [weeklyLimit, setWeeklyLimit] = useState(14);
  const [dailyLimit, setDailyLimit] = useState(2);
  const [dryDaysTarget, setDryDaysTarget] = useState(2);
  const [yearlyTarget, setYearlyTarget] = useState<number | null>(null);
  const [sex, setSex] = useState<Sex>('unspecified');
  const [favorites, setFavorites] = useState<DrinkFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goalId, setGoalId] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [goalRes, favsRes] = await Promise.all([
      supabase.from('drink_goals').select('*').eq('user_id', user.id).single(),
      supabase.from('drink_favorites').select('*').eq('user_id', user.id),
    ]);

    if (goalRes.data) {
      const g = goalRes.data;
      setGoalId(g.id);
      setWeeklyLimit(g.weekly_unit_limit ?? 14);
      setDailyLimit(g.daily_unit_limit ?? 2);
      setDryDaysTarget(g.dry_days_per_week_target ?? 2);
      setYearlyTarget(g.yearly_drink_target ?? null);
      setSex(g.sex ?? 'unspecified');
    }

    setFavorites(favsRes.data || []);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const payload = {
      user_id: user.id,
      weekly_unit_limit: weeklyLimit,
      daily_unit_limit: dailyLimit,
      dry_days_per_week_target: dryDaysTarget,
      yearly_drink_target: yearlyTarget,
      sex,
    };

    let error;
    if (goalId) {
      ({ error } = await supabase.from('drink_goals').update(payload).eq('id', goalId));
    } else {
      ({ error } = await supabase.from('drink_goals').insert(payload));
    }

    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Settings saved' });
      loadData();
    }
    setSaving(false);
  }

  async function deleteFavorite(id: string) {
    const { error } = await supabase.from('drink_favorites').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Favorite removed' });
      setFavorites(favorites.filter((f) => f.id !== id));
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <p className="text-center text-gray-500 animate-pulse">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/drinks" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold dark:text-white">Drink Settings</h1>
      </div>

      {/* Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Goals</CardTitle>
          <CardDescription>Set your own limits — these are private to you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weekly-limit">Weekly unit limit</Label>
            <NumberInput
              id="weekly-limit"
              allowDecimal
              value={weeklyLimit || null}
              onChange={(v) => setWeeklyLimit(v ?? 0)}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily-limit">Daily unit limit</Label>
            <NumberInput
              id="daily-limit"
              allowDecimal
              value={dailyLimit || null}
              onChange={(v) => setDailyLimit(v ?? 0)}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dry-days">Dry days per week target</Label>
            <NumberInput
              id="dry-days"
              value={dryDaysTarget || null}
              onChange={(v) => setDryDaysTarget(v ?? 0)}
              min={0}
              max={7}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearly-target">Year goal (optional)</Label>
            <NumberInput
              id="yearly-target"
              placeholder="e.g. 500"
              value={yearlyTarget}
              onChange={setYearlyTarget}
              min={0}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total standard drinks target for the year. Leave blank to skip.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sex">Sex (for guideline reference)</Label>
            <select
              id="sex"
              value={sex}
              onChange={(e) => setSex(e.target.value as Sex)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="unspecified">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Saving…' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Favorites */}
      <Card>
        <CardHeader>
          <CardTitle>Favorites</CardTitle>
          <CardDescription>Your saved drinks for quick logging</CardDescription>
        </CardHeader>
        <CardContent>
          {favorites.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              No favorites yet. Save drinks when logging to add them here.
            </p>
          ) : (
            <div className="space-y-2">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="flex items-center justify-between py-2 px-3 rounded-md bg-gray-50 dark:bg-gray-800/50"
                >
                  <div>
                    <p className="font-medium text-sm dark:text-white">
                      {fav.drink_name ?? fav.drinkName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {fav.volume_ml ?? fav.volumeMl}ml · {fav.abv_percent ?? fav.abvPercent}%
                    </p>
                  </div>
                  <button
                    onClick={() => deleteFavorite(fav.id)}
                    className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
