'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  ArrowLeft,
  Beer,
  Wine,
  GlassWater,
  Apple,
  Coffee,
  Check,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DrinkCategory, LibraryDrink } from '@/types';
import { getDrinksByCategory } from '@/lib/drinks-library';
import { calculateStandardUnits } from '@/lib/drinks';

const categories: { key: DrinkCategory; label: string; icon: typeof Beer }[] = [
  { key: 'beer', label: 'Beer', icon: Beer },
  { key: 'wine', label: 'Wine', icon: Wine },
  { key: 'spirits', label: 'Spirits', icon: GlassWater },
  { key: 'cider', label: 'Cider', icon: Apple },
  { key: 'other', label: 'Other', icon: Coffee },
];

export default function LogDrinkPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<DrinkCategory>('beer');
  const [drinkName, setDrinkName] = useState('');
  const [volumeMl, setVolumeMl] = useState(330);
  const [abvPercent, setAbvPercent] = useState(5);
  const [loggedAt, setLoggedAt] = useState(() => {
    const now = new Date();
    // Format for datetime-local input
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState('');
  const [saveToFavorites, setSaveToFavorites] = useState(false);
  const [saving, setSaving] = useState(false);

  const liveUnits = calculateStandardUnits(volumeMl, abvPercent);

  function selectCategory(cat: DrinkCategory) {
    setSelectedCategory(cat);
    setStep(2);
  }

  function selectDrink(drink: LibraryDrink | null) {
    if (drink) {
      setDrinkName(drink.name);
      setVolumeMl(drink.volume_ml);
      setAbvPercent(drink.abv_percent);
    } else {
      // Custom
      setDrinkName('Custom drink');
      setVolumeMl(330);
      setAbvPercent(5);
    }
    setStep(3);
  }

  function goBack() {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else router.push('/drinks');
  }

  async function handleSubmit() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const units = calculateStandardUnits(volumeMl, abvPercent);

    const { error } = await supabase.from('drink_logs').insert({
      user_id: user.id,
      logged_at: new Date(loggedAt).toISOString(),
      drink_name: drinkName,
      category: selectedCategory,
      volume_ml: volumeMl,
      abv_percent: abvPercent,
      notes: notes || null,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    if (saveToFavorites) {
      await supabase.from('drink_favorites').insert({
        user_id: user.id,
        drink_name: drinkName,
        category: selectedCategory,
        volume_ml: volumeMl,
        abv_percent: abvPercent,
      });
    }

    toast({ title: 'Drink logged', description: `${drinkName} — ${units} units` });
    router.push('/drinks');
  }

  const filteredDrinks = getDrinksByCategory(selectedCategory);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={goBack} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold dark:text-white">
          {step === 1 && 'Choose Category'}
          {step === 2 && 'Choose Drink'}
          {step === 3 && 'Confirm Details'}
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              s <= step ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Category selection */}
      {step === 1 && (
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => selectCategory(cat.key)}
                className="flex flex-col items-center gap-2 p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Icon className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                <span className="font-medium dark:text-white">{cat.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Step 2: Drink selection */}
      {step === 2 && (
        <div className="space-y-2">
          {filteredDrinks.map((drink) => (
            <button
              key={drink.id}
              onClick={() => selectDrink(drink)}
              className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium dark:text-white">{drink.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {drink.volume_ml}ml · {drink.abv_percent}% ABV
                  </p>
                </div>
                <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  {drink.units}u
                </span>
              </div>
            </button>
          ))}

          {/* Custom option */}
          <button
            onClick={() => selectDrink(null)}
            className="w-full text-left p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            <p className="font-medium text-gray-600 dark:text-gray-300">+ Custom drink</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Enter your own details</p>
          </button>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="space-y-5">
          {/* Live unit badge */}
          <div className="text-center">
            <span className="inline-block text-3xl font-bold px-4 py-2 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
              {liveUnits} units
            </span>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Drink name */}
              <div className="space-y-2">
                <Label htmlFor="drink-name">Drink Name</Label>
                <Input
                  id="drink-name"
                  value={drinkName}
                  onChange={(e) => setDrinkName(e.target.value)}
                />
              </div>

              {/* Volume */}
              <div className="space-y-2">
                <Label>Volume (ml)</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[volumeMl]}
                    onValueChange={([v]) => setVolumeMl(v)}
                    min={50}
                    max={1000}
                    step={10}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={volumeMl}
                    onChange={(e) => setVolumeMl(Number(e.target.value) || 0)}
                    className="w-20"
                  />
                </div>
              </div>

              {/* ABV */}
              <div className="space-y-2">
                <Label htmlFor="abv">ABV (%)</Label>
                <Input
                  id="abv"
                  type="number"
                  step="0.1"
                  value={abvPercent}
                  onChange={(e) => setAbvPercent(Number(e.target.value) || 0)}
                />
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="datetime-local"
                  value={loggedAt}
                  onChange={(e) => setLoggedAt(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. at dinner with friends"
                  rows={2}
                />
              </div>

              {/* Save to favorites */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="save-fav"
                  checked={saveToFavorites}
                  onCheckedChange={(checked) => setSaveToFavorites(checked === true)}
                />
                <Label htmlFor="save-fav" className="text-sm font-normal cursor-pointer">
                  Save to favorites
                </Label>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSubmit}
            disabled={saving || !drinkName}
            className="w-full py-6 text-lg"
            size="lg"
          >
            {saving ? (
              'Saving…'
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Log Drink
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
