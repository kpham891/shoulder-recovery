'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Activity, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  InjurySide,
  SurgeryStatus,
  ExternalRotationLimit,
  GoalType,
  Restrictions,
  FitnessGoal,
} from '@/types';

const STEPS = ['Injury', 'Restrictions', 'Goals', 'Review'];

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Injury info
  const [injurySide, setInjurySide] = useState<InjurySide>('right');
  const [surgeryStatus, setSurgeryStatus] = useState<SurgeryStatus>('none');
  const [injuryDate, setInjuryDate] = useState('');
  const [surgeryDate, setSurgeryDate] = useState('');

  // Restrictions
  const [inSling, setInSling] = useState(false);
  const [noRunning, setNoRunning] = useState(false);
  const [noOverhead, setNoOverhead] = useState(true);
  const [maxAbduction, setMaxAbduction] = useState([90]);
  const [maxFlexion, setMaxFlexion] = useState([90]);
  const [erLimit, setErLimit] = useState<ExternalRotationLimit>('moderate');
  const [painfulMovements, setPainfulMovements] = useState('');

  // Goals
  const [goalType, setGoalType] = useState<GoalType>('general-conditioning');
  const [targetDate, setTargetDate] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState([4]);
  const [minutesPerDay, setMinutesPerDay] = useState([45]);
  const [canBike, setCanBike] = useState([30]);
  const [canWalk, setCanWalk] = useState([30]);
  const [canRun, setCanRun] = useState([0]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
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

      const restrictions: Restrictions = {
        inSling,
        noRunning,
        noOverhead,
        maxAbductionAngle: maxAbduction[0],
        maxFlexionAngle: maxFlexion[0],
        externalRotationLimit: erLimit,
        painfulMovements: painfulMovements || undefined,
      };

      const goal: FitnessGoal = {
        type: goalType,
        targetDate: targetDate || undefined,
        daysPerWeek: daysPerWeek[0],
        minutesPerDay: minutesPerDay[0],
        cardioBaseline: {
          canBikeMinutes: canBike[0],
          canWalkMinutes: canWalk[0],
          canRunMinutes: canRun[0],
        },
      };

      const { error } = await supabase.from('profiles').insert({
        user_id: user.id,
        injury_side: injurySide,
        injury_date: injuryDate,
        surgery_status: surgeryStatus,
        surgery_date: surgeryDate || null,
        restrictions,
        goal,
      });

      if (error) {
        toast({
          title: 'Error saving profile',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Profile created!',
        description: 'Your recovery plan is ready.',
      });

      router.push('/dashboard');
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Activity className="w-10 h-10 text-blue-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold">Set Up Your Profile</h1>
          <p className="text-gray-600">
            Help us personalize your recovery and fitness plan
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={i <= step ? 'text-blue-600 font-medium' : ''}
              >
                {s}
              </span>
            ))}
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 0 && 'Injury Information'}
              {step === 1 && 'Current Restrictions'}
              {step === 2 && 'Fitness Goals'}
              {step === 3 && 'Review & Confirm'}
            </CardTitle>
            <CardDescription>
              {step === 0 && 'Tell us about your shoulder injury'}
              {step === 1 && 'What movements are you avoiding?'}
              {step === 2 && 'What are you working toward?'}
              {step === 3 && 'Check your information before we create your plan'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Injury */}
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label>Which shoulder?</Label>
                  <Select
                    value={injurySide}
                    onValueChange={(v) => setInjurySide(v as InjurySide)}
                  >
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
                  <Select
                    value={surgeryStatus}
                    onValueChange={(v) => setSurgeryStatus(v as SurgeryStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No surgery</SelectItem>
                      <SelectItem value="planned">Surgery planned</SelectItem>
                      <SelectItem value="post-op">Post-operative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="injuryDate">
                    Date of injury {surgeryStatus === 'none' && '(approximate)'}
                  </Label>
                  <Input
                    id="injuryDate"
                    type="date"
                    value={injuryDate}
                    onChange={(e) => setInjuryDate(e.target.value)}
                    required
                  />
                </div>

                {surgeryStatus === 'post-op' && (
                  <div className="space-y-2">
                    <Label htmlFor="surgeryDate">Surgery date</Label>
                    <Input
                      id="surgeryDate"
                      type="date"
                      value={surgeryDate}
                      onChange={(e) => setSurgeryDate(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            {/* Step 2: Restrictions */}
            {step === 1 && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
                  <Shield className="inline-block w-4 h-4 mr-1" />
                  Only do what your PT/surgeon has cleared. When in doubt, be conservative.
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="inSling"
                      checked={inSling}
                      onCheckedChange={(c) => setInSling(c as boolean)}
                    />
                    <Label htmlFor="inSling" className="cursor-pointer">
                      Currently in sling
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="noRunning"
                      checked={noRunning}
                      onCheckedChange={(c) => setNoRunning(c as boolean)}
                    />
                    <Label htmlFor="noRunning" className="cursor-pointer">
                      No running allowed
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="noOverhead"
                      checked={noOverhead}
                      onCheckedChange={(c) => setNoOverhead(c as boolean)}
                    />
                    <Label htmlFor="noOverhead" className="cursor-pointer">
                      No overhead movements
                    </Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Max abduction angle (arm out to side): {maxAbduction[0]}°</Label>
                  <Slider
                    value={maxAbduction}
                    onValueChange={setMaxAbduction}
                    min={0}
                    max={180}
                    step={15}
                    className="py-4"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Max forward flexion angle: {maxFlexion[0]}°</Label>
                  <Slider
                    value={maxFlexion}
                    onValueChange={setMaxFlexion}
                    min={0}
                    max={180}
                    step={15}
                    className="py-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label>External rotation limitation</Label>
                  <Select
                    value={erLimit}
                    onValueChange={(v) => setErLimit(v as ExternalRotationLimit)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None - full ROM</SelectItem>
                      <SelectItem value="mild">Mild - slight limitation</SelectItem>
                      <SelectItem value="moderate">Moderate - noticeable limit</SelectItem>
                      <SelectItem value="severe">Severe - very restricted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="painful">Painful movements (optional)</Label>
                  <Textarea
                    id="painful"
                    placeholder="e.g., reaching behind back, sleeping on side..."
                    value={painfulMovements}
                    onChange={(e) => setPainfulMovements(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Step 3: Goals */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label>What&apos;s your fitness goal?</Label>
                  <Select
                    value={goalType}
                    onValueChange={(v) => setGoalType(v as GoalType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="half-marathon">Half Marathon</SelectItem>
                      <SelectItem value="10k">10K Race</SelectItem>
                      <SelectItem value="5k">5K Race</SelectItem>
                      <SelectItem value="general-conditioning">General Conditioning</SelectItem>
                      <SelectItem value="strength">Strength Training</SelectItem>
                      <SelectItem value="weight-loss">Weight Loss</SelectItem>
                      <SelectItem value="maintain-fitness">Maintain Current Fitness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(goalType === 'half-marathon' || goalType === '10k' || goalType === '5k') && (
                  <div className="space-y-2">
                    <Label htmlFor="targetDate">Target race date (optional)</Label>
                    <Input
                      id="targetDate"
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <Label>Days per week available: {daysPerWeek[0]}</Label>
                  <Slider
                    value={daysPerWeek}
                    onValueChange={setDaysPerWeek}
                    min={2}
                    max={6}
                    step={1}
                    className="py-4"
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
                    className="py-4"
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium mb-4">Current cardio baseline (what you can do today):</p>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label>Can bike: {canBike[0]} min</Label>
                      <Slider
                        value={canBike}
                        onValueChange={setCanBike}
                        min={0}
                        max={60}
                        step={5}
                        className="py-4"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Can walk: {canWalk[0]} min</Label>
                      <Slider
                        value={canWalk}
                        onValueChange={setCanWalk}
                        min={0}
                        max={60}
                        step={5}
                        className="py-4"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Can run: {canRun[0]} min</Label>
                      <Slider
                        value={canRun}
                        onValueChange={setCanRun}
                        min={0}
                        max={60}
                        step={5}
                        className="py-4"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Review */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-md p-4">
                  <h3 className="font-medium mb-2">Injury</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Side: {injurySide}</li>
                    <li>Surgery: {surgeryStatus}</li>
                    <li>Injury date: {injuryDate}</li>
                    {surgeryDate && <li>Surgery date: {surgeryDate}</li>}
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-md p-4">
                  <h3 className="font-medium mb-2">Restrictions</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {inSling && <li>In sling</li>}
                    {noRunning && <li>No running</li>}
                    {noOverhead && <li>No overhead</li>}
                    <li>Max abduction: {maxAbduction[0]}°</li>
                    <li>Max flexion: {maxFlexion[0]}°</li>
                    <li>External rotation: {erLimit}</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-md p-4">
                  <h3 className="font-medium mb-2">Goals</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Goal: {goalType.replace('-', ' ')}</li>
                    {targetDate && <li>Target: {targetDate}</li>}
                    <li>Availability: {daysPerWeek[0]} days/week, {minutesPerDay[0]} min/session</li>
                    <li>Baseline: bike {canBike[0]}min, walk {canWalk[0]}min, run {canRun[0]}min</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                  You can update these settings anytime from Settings.
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>

              {step < STEPS.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Creating plan...' : 'Create My Plan'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
