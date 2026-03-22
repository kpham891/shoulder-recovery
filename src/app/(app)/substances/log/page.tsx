'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SubstanceName } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────

const SUBSTANCES: { key: SubstanceName; emoji: string }[] = [
  { key: 'Cannabis', emoji: '🌿' },
  { key: 'MDMA', emoji: '💊' },
  { key: 'Psilocybin', emoji: '🍄' },
  { key: 'Cocaine', emoji: '❄️' },
  { key: 'Ketamine', emoji: '💉' },
  { key: 'Other', emoji: '🧪' },
];

const METHODS: Record<SubstanceName, string[]> = {
  Cannabis: ['Smoke', 'Vape', 'Edible', 'Tincture', 'Dab'],
  MDMA: ['Oral', 'Insufflation', 'Smoked', 'IV', 'Other'],
  Psilocybin: ['Oral', 'Insufflation', 'Smoked', 'IV', 'Other'],
  Cocaine: ['Oral', 'Insufflation', 'Smoked', 'IV', 'Other'],
  Ketamine: ['Oral', 'Insufflation', 'Smoked', 'IV', 'Other'],
  Other: ['Oral', 'Insufflation', 'Smoked', 'IV', 'Other'],
};

const DOSE_PRESETS: Record<SubstanceName, string[]> = {
  Cannabis: ['0.1g', '0.25g', '0.5g', '1g'],
  MDMA: ['50mg', '75mg', '100mg', '125mg'],
  Psilocybin: ['0.5g', '1g', '2g', '3.5g'],
  Cocaine: ['25mg', '50mg', '100mg', '200mg'],
  Ketamine: ['25mg', '50mg', '100mg', '200mg'],
  Other: ['25mg', '50mg', '100mg', '200mg'],
};

const POTENCY_OPTIONS = ['Low', 'Mid', 'High', 'Very High'];

// ─── Component ────────────────────────────────────────────────────────

export default function LogSubstancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [substance, setSubstance] = useState<SubstanceName>('Cannabis');
  const [method, setMethod] = useState('');
  const [dose, setDose] = useState('');
  const [customDose, setCustomDose] = useState('');
  const [potency, setPotency] = useState('');
  const [intensity, setIntensity] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const activeDose = dose === 'custom' ? customDose : dose;
  const methods = METHODS[substance];
  const presets = DOSE_PRESETS[substance];
  const showPotency = substance === 'Cannabis';

  function selectSubstance(s: SubstanceName) {
    setSubstance(s);
    setMethod('');
    setDose('');
    setCustomDose('');
    setPotency('');
    setIntensity(0);
    setNotes('');
    setStep(2);
  }

  function goBack() {
    if (step === 2) setStep(1);
    else router.push('/drinks');
  }

  async function handleSubmit() {
    if (!method || !activeDose) {
      toast({ title: 'Missing fields', description: 'Please select a method and dose.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('substance_logs').insert({
      user_id: user.id,
      substance,
      method,
      dose: activeDose,
      potency: showPotency && potency ? potency : null,
      intensity: intensity > 0 ? intensity : null,
      notes: notes || null,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    toast({ title: 'Logged', description: `${substance} — ${activeDose} (${method})` });
    router.push('/drinks');
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={goBack} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold dark:text-white">
          {step === 1 ? 'Choose Substance' : `Log ${substance}`}
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              s <= step ? 'bg-violet-500 dark:bg-violet-400' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Substance picker grid */}
      {step === 1 && (
        <div className="grid grid-cols-2 gap-3">
          {SUBSTANCES.map((s) => (
            <button
              key={s.key}
              onClick={() => selectSubstance(s.key)}
              className="flex flex-col items-center gap-2 p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
            >
              <span className="text-3xl">{s.emoji}</span>
              <span className="font-medium dark:text-white">{s.key}</span>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Details form */}
      {step === 2 && (
        <div className="space-y-5">
          <Card className="border-l-4 border-l-violet-500">
            <CardContent className="pt-6 space-y-5">
              {/* Method chips */}
              <div className="space-y-2">
                <Label>Method</Label>
                <div className="flex flex-wrap gap-2">
                  {methods.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        method === m
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dose presets */}
              <div className="space-y-2">
                <Label>Dose</Label>
                <div className="flex flex-wrap gap-2">
                  {presets.map((d) => (
                    <button
                      key={d}
                      onClick={() => { setDose(d); setCustomDose(''); }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        dose === d
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                  <button
                    onClick={() => setDose('custom')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      dose === 'custom'
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {dose === 'custom' && (
                  <Input
                    placeholder="e.g. 150mg"
                    value={customDose}
                    onChange={(e) => setCustomDose(e.target.value)}
                    className="mt-2 w-40"
                  />
                )}
              </div>

              {/* Potency (cannabis only) */}
              {showPotency && (
                <div className="space-y-2">
                  <Label>Potency</Label>
                  <div className="flex flex-wrap gap-2">
                    {POTENCY_OPTIONS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPotency(potency === p ? '' : p)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          potency === p
                            ? 'bg-violet-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Intensity 1–5 */}
              <div className="space-y-2">
                <Label>Intensity</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setIntensity(intensity === level ? 0 : level)}
                      className={`w-10 h-10 rounded-full text-sm font-bold transition-colors ${
                        intensity >= level
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. setting, mood, context…"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={saving || !method || !activeDose}
            className="w-full py-6 text-lg active:scale-95 transition-transform bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700"
            size="lg"
          >
            {saving ? (
              'Saving…'
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Log {substance}
              </>
            )}
          </Button>

          {/* Harm reduction disclaimer */}
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 px-4">
            This app is for personal harm reduction tracking only. Speak with a healthcare professional if you have concerns about your use.
          </p>
        </div>
      )}
    </div>
  );
}
