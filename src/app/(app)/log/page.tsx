'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Check, Flame } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getStreak, formatDateShort, getPainColor, getPainBgColor } from '@/lib/utils';
import type { DailyLog, FlexionBucket, AbductionBucket, BehindBackReach } from '@/types';

export default function LogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [streak, setStreak] = useState(0);

  // Form state
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [pain, setPain] = useState([5]);
  const [instability, setInstability] = useState([3]);
  const [sleepImpact, setSleepImpact] = useState([3]);
  const [flexionBucket, setFlexionBucket] = useState<FlexionBucket>('90-120');
  const [abductionBucket, setAbductionBucket] = useState<AbductionBucket>('60-90');
  const [behindBack, setBehindBack] = useState<BehindBackReach>('waistband');
  const [slingWorn, setSlingWorn] = useState(false);
  const [didRehab, setDidRehab] = useState(false);
  const [didCardio, setDidCardio] = useState(false);
  const [didStrength, setDidStrength] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadRecentLogs();
  }, []);

  const loadRecentLogs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(7);

    if (data) {
      setRecentLogs(data as unknown as DailyLog[]);
      setStreak(getStreak(data as unknown as { date: string }[]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Not logged in',
          description: 'Please log in to continue.',
          variant: 'destructive',
        });
        router.push('/auth/login');
        return;
      }

      const { error } = await supabase.from('logs').upsert({
        user_id: user.id,
        date,
        pain: pain[0],
        instability: instability[0],
        sleep_impact: sleepImpact[0],
        flexion_bucket: flexionBucket,
        abduction_bucket: abductionBucket,
        behind_back_reach: behindBack,
        sling_worn: slingWorn,
        did_rehab: didRehab,
        did_cardio: didCardio,
        did_strength: didStrength,
        notes: notes || null,
      }, {
        onConflict: 'user_id,date',
      });

      if (error) {
        toast({
          title: 'Error saving log',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Log saved!',
        description: 'Your daily log has been recorded.',
      });

      loadRecentLogs();
    } catch {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Daily Log</h1>
          <p className="text-gray-600">Track how you&apos;re feeling today</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-3 py-2 rounded-lg">
            <Flame className="w-5 h-5" />
            <span className="font-medium">{streak} day streak!</span>
          </div>
        )}
      </div>

      {/* Recent logs quick view */}
      {recentLogs.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Last 7 days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex-shrink-0 w-16 p-2 rounded-lg text-center ${getPainBgColor(log.pain)}`}
                >
                  <div className="text-xs text-gray-500">{formatDateShort(log.date)}</div>
                  <div className={`text-lg font-bold ${getPainColor(log.pain)}`}>
                    {log.pain}
                  </div>
                  <div className="flex justify-center gap-1 mt-1">
                    {(log.did_rehab || log.didRehab) && <Check className="w-3 h-3 text-green-600" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log form */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Log</CardTitle>
          <CardDescription>Takes less than 60 seconds</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={today}
              />
            </div>

            {/* Pain */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Pain Level</Label>
                <span className={`text-lg font-bold ${getPainColor(pain[0])}`}>
                  {pain[0]}/10
                </span>
              </div>
              <Slider
                value={pain}
                onValueChange={setPain}
                min={0}
                max={10}
                step={1}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>No pain</span>
                <span>Worst</span>
              </div>
            </div>

            {/* Instability */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>&quot;Feels like it could pop&quot;</Label>
                <span className="text-lg font-bold text-gray-700">{instability[0]}/10</span>
              </div>
              <Slider
                value={instability}
                onValueChange={setInstability}
                min={0}
                max={10}
                step={1}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Stable</span>
                <span>Very unstable</span>
              </div>
            </div>

            {/* Sleep impact */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Sleep Impact</Label>
                <span className="text-lg font-bold text-gray-700">{sleepImpact[0]}/10</span>
              </div>
              <Slider
                value={sleepImpact}
                onValueChange={setSleepImpact}
                min={0}
                max={10}
                step={1}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Slept well</span>
                <span>Couldn&apos;t sleep</span>
              </div>
            </div>

            {/* ROM - Flexion */}
            <div className="space-y-2">
              <Label>Can raise arm forward to:</Label>
              <Select value={flexionBucket} onValueChange={(v) => setFlexionBucket(v as FlexionBucket)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<60">Less than 60°</SelectItem>
                  <SelectItem value="60-90">60° - 90°</SelectItem>
                  <SelectItem value="90-120">90° - 120°</SelectItem>
                  <SelectItem value="120-150">120° - 150°</SelectItem>
                  <SelectItem value="150+">More than 150°</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ROM - Abduction */}
            <div className="space-y-2">
              <Label>Can raise arm to side to:</Label>
              <Select value={abductionBucket} onValueChange={(v) => setAbductionBucket(v as AbductionBucket)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<60">Less than 60°</SelectItem>
                  <SelectItem value="60-90">60° - 90°</SelectItem>
                  <SelectItem value="90-120">90° - 120°</SelectItem>
                  <SelectItem value="120-150">120° - 150°</SelectItem>
                  <SelectItem value="150+">More than 150°</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ROM - Behind back */}
            <div className="space-y-2">
              <Label>Can reach behind back to:</Label>
              <Select value={behindBack} onValueChange={(v) => setBehindBack(v as BehindBackReach)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cant">Can&apos;t reach</SelectItem>
                  <SelectItem value="waistband">Waistband</SelectItem>
                  <SelectItem value="mid-back">Mid-back</SelectItem>
                  <SelectItem value="shoulder-blade">Shoulder blade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Activities */}
            <div className="space-y-3">
              <Label>Activities today</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="sling"
                    checked={slingWorn}
                    onCheckedChange={(c) => setSlingWorn(c as boolean)}
                  />
                  <Label htmlFor="sling" className="cursor-pointer text-sm">
                    Wore sling
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="rehab"
                    checked={didRehab}
                    onCheckedChange={(c) => setDidRehab(c as boolean)}
                  />
                  <Label htmlFor="rehab" className="cursor-pointer text-sm">
                    Did rehab
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="cardio"
                    checked={didCardio}
                    onCheckedChange={(c) => setDidCardio(c as boolean)}
                  />
                  <Label htmlFor="cardio" className="cursor-pointer text-sm">
                    Did cardio
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="strength"
                    checked={didStrength}
                    onCheckedChange={(c) => setDidStrength(c as boolean)}
                  />
                  <Label htmlFor="strength" className="cursor-pointer text-sm">
                    Did strength
                  </Label>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any observations, what helped, what hurt..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Saving...' : 'Save Log'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
