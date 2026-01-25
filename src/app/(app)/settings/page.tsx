'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Save, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  UserProfile,
  InjurySide,
  SurgeryStatus,
  ExternalRotationLimit,
  GoalType,
} from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Form state
  const [injurySide, setInjurySide] = useState<InjurySide>('right');
  const [surgeryStatus, setSurgeryStatus] = useState<SurgeryStatus>('none');
  const [injuryDate, setInjuryDate] = useState('');
  const [surgeryDate, setSurgeryDate] = useState('');

  const [inSling, setInSling] = useState(false);
  const [noRunning, setNoRunning] = useState(false);
  const [noOverhead, setNoOverhead] = useState(true);
  const [maxAbduction, setMaxAbduction] = useState([90]);
  const [maxFlexion, setMaxFlexion] = useState([90]);
  const [erLimit, setErLimit] = useState<ExternalRotationLimit>('moderate');
  const [painfulMovements, setPainfulMovements] = useState('');

  const [goalType, setGoalType] = useState<GoalType>('general-conditioning');
  const [targetDate, setTargetDate] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState([4]);
  const [minutesPerDay, setMinutesPerDay] = useState([45]);
  const [canBike, setCanBike] = useState([30]);
  const [canWalk, setCanWalk] = useState([30]);
  const [canRun, setCanRun] = useState([0]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      const p = data as unknown as UserProfile;
      setProfile(p);

      // Populate form
      setInjurySide(p.injurySide || p.injury_side || 'right');
      setSurgeryStatus(p.surgeryStatus || p.surgery_status || 'none');
      setInjuryDate(p.injuryDate || p.injury_date || '');
      setSurgeryDate(p.surgeryDate || p.surgery_date || '');

      const r = p.restrictions;
      setInSling(r.inSling);
      setNoRunning(r.noRunning);
      setNoOverhead(r.noOverhead);
      setMaxAbduction([r.maxAbductionAngle]);
      setMaxFlexion([r.maxFlexionAngle]);
      setErLimit(r.externalRotationLimit);
      setPainfulMovements(r.painfulMovements || '');

      const g = p.goal;
      setGoalType(g.type);
      setTargetDate(g.targetDate || '');
      setDaysPerWeek([g.daysPerWeek]);
      setMinutesPerDay([g.minutesPerDay]);
      setCanBike([g.cardioBaseline.canBikeMinutes]);
      setCanWalk([g.cardioBaseline.canWalkMinutes]);
      setCanRun([g.cardioBaseline.canRunMinutes]);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          injury_side: injurySide,
          surgery_status: surgeryStatus,
          injury_date: injuryDate,
          surgery_date: surgeryDate || null,
          restrictions: {
            inSling,
            noRunning,
            noOverhead,
            maxAbductionAngle: maxAbduction[0],
            maxFlexionAngle: maxFlexion[0],
            externalRotationLimit: erLimit,
            painfulMovements: painfulMovements || undefined,
          },
          goal: {
            type: goalType,
            targetDate: targetDate || undefined,
            daysPerWeek: daysPerWeek[0],
            minutesPerDay: minutesPerDay[0],
            cardioBaseline: {
              canBikeMinutes: canBike[0],
              canWalkMinutes: canWalk[0],
              canRunMinutes: canRun[0],
            },
          },
        })
        .eq('id', profile.id);

      if (error) {
        toast({
          title: 'Error saving',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Settings saved',
        description: 'Your profile has been updated.',
      });
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-gray-600" />
          Settings
        </h1>
        <p className="text-gray-600">Update your profile and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Injury info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Injury Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Shoulder</Label>
                <Select value={injurySide} onValueChange={(v) => setInjurySide(v as InjurySide)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Surgery status</Label>
                <Select value={surgeryStatus} onValueChange={(v) => setSurgeryStatus(v as SurgeryStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No surgery</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="post-op">Post-op</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Injury date</Label>
                <Input
                  type="date"
                  value={injuryDate}
                  onChange={(e) => setInjuryDate(e.target.value)}
                />
              </div>
              {surgeryStatus === 'post-op' && (
                <div className="space-y-2">
                  <Label>Surgery date</Label>
                  <Input
                    type="date"
                    value={surgeryDate}
                    onChange={(e) => setSurgeryDate(e.target.value)}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Restrictions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Restrictions</CardTitle>
            <CardDescription>Update as your recovery progresses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="inSling"
                  checked={inSling}
                  onCheckedChange={(c) => setInSling(c as boolean)}
                />
                <Label htmlFor="inSling">In sling</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="noRunning"
                  checked={noRunning}
                  onCheckedChange={(c) => setNoRunning(c as boolean)}
                />
                <Label htmlFor="noRunning">No running</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="noOverhead"
                  checked={noOverhead}
                  onCheckedChange={(c) => setNoOverhead(c as boolean)}
                />
                <Label htmlFor="noOverhead">No overhead</Label>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Max abduction: {maxAbduction[0]}°</Label>
              <Slider
                value={maxAbduction}
                onValueChange={setMaxAbduction}
                min={0}
                max={180}
                step={15}
              />
            </div>

            <div className="space-y-3">
              <Label>Max flexion: {maxFlexion[0]}°</Label>
              <Slider
                value={maxFlexion}
                onValueChange={setMaxFlexion}
                min={0}
                max={180}
                step={15}
              />
            </div>

            <div className="space-y-2">
              <Label>External rotation limit</Label>
              <Select value={erLimit} onValueChange={(v) => setErLimit(v as ExternalRotationLimit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Painful movements</Label>
              <Textarea
                value={painfulMovements}
                onChange={(e) => setPainfulMovements(e.target.value)}
                placeholder="Optional notes"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fitness Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Goal type</Label>
              <Select value={goalType} onValueChange={(v) => setGoalType(v as GoalType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="half-marathon">Half Marathon</SelectItem>
                  <SelectItem value="10k">10K</SelectItem>
                  <SelectItem value="5k">5K</SelectItem>
                  <SelectItem value="general-conditioning">General Conditioning</SelectItem>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="weight-loss">Weight Loss</SelectItem>
                  <SelectItem value="maintain-fitness">Maintain Fitness</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(goalType === 'half-marathon' || goalType === '10k' || goalType === '5k') && (
              <div className="space-y-2">
                <Label>Target date</Label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-3">
              <Label>Days per week: {daysPerWeek[0]}</Label>
              <Slider
                value={daysPerWeek}
                onValueChange={setDaysPerWeek}
                min={2}
                max={6}
                step={1}
              />
            </div>

            <div className="space-y-3">
              <Label>Minutes per session: {minutesPerDay[0]}</Label>
              <Slider
                value={minutesPerDay}
                onValueChange={setMinutesPerDay}
                min={15}
                max={90}
                step={15}
              />
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Cardio baseline</p>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Can bike: {canBike[0]} min</Label>
                  <Slider value={canBike} onValueChange={setCanBike} min={0} max={60} step={5} />
                </div>
                <div>
                  <Label className="text-sm">Can walk: {canWalk[0]} min</Label>
                  <Slider value={canWalk} onValueChange={setCanWalk} min={0} max={60} step={5} />
                </div>
                <div>
                  <Label className="text-sm">Can run: {canRun[0]} min</Label>
                  <Slider value={canRun} onValueChange={setCanRun} min={0} max={60} step={5} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
