'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import type { Milestone, MilestoneType } from '@/types';

const PREDEFINED_MILESTONES: { value: MilestoneType; label: string }[] = [
  { value: 'flexion-90', label: 'Forward flexion to 90°' },
  { value: 'flexion-120', label: 'Forward flexion to 120°' },
  { value: 'flexion-150', label: 'Forward flexion to 150°' },
  { value: 'abduction-90', label: 'Abduction to 90°' },
  { value: 'abduction-120', label: 'Abduction to 120°' },
  { value: 'abduction-150', label: 'Abduction to 150°' },
  { value: 'external-rotation', label: 'External rotation improved' },
  { value: 'first-day-no-sling', label: 'First day without sling' },
  { value: 'pain-free-sleep', label: 'First pain-free night of sleep' },
  { value: 'first-run', label: 'First run' },
  { value: 'first-full-workout', label: 'First full workout' },
  { value: 'custom', label: 'Custom milestone' },
];

export default function MilestonesPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [milestoneType, setMilestoneType] = useState<MilestoneType>('flexion-90');
  const [customLabel, setCustomLabel] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadMilestones();
  }, []);

  const loadMilestones = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('milestones')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (data) {
      setMilestones(data as unknown as Milestone[]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('milestones').insert({
        user_id: user.id,
        date,
        type: milestoneType,
        value: milestoneType === 'custom' ? customLabel : (value || null),
        notes: notes || null,
      });

      if (error) {
        toast({
          title: 'Error saving milestone',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Milestone recorded!',
        description: 'Congratulations on your progress!',
      });

      setDialogOpen(false);
      resetForm();
      loadMilestones();
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

  const resetForm = () => {
    setMilestoneType('flexion-90');
    setCustomLabel('');
    setValue('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  const getMilestoneLabel = (type: MilestoneType): string => {
    const found = PREDEFINED_MILESTONES.find(m => m.value === type);
    return found?.label || type;
  };

  const getMilestoneColor = (type: MilestoneType): string => {
    if (type.startsWith('flexion') || type.startsWith('abduction')) {
      return 'bg-blue-100 text-blue-700';
    }
    if (type.includes('sling') || type.includes('sleep')) {
      return 'bg-green-100 text-green-700';
    }
    if (type.includes('run') || type.includes('workout')) {
      return 'bg-purple-100 text-purple-700';
    }
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 dark:text-white">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Milestones
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Celebrate your recovery achievements</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Milestone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record a Milestone</DialogTitle>
              <DialogDescription>
                Capture an achievement in your recovery journey
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Milestone type</Label>
                <Select
                  value={milestoneType}
                  onValueChange={(v) => setMilestoneType(v as MilestoneType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_MILESTONES.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {milestoneType === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customLabel">Milestone name</Label>
                  <Input
                    id="customLabel"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="e.g., First push-up"
                    required
                  />
                </div>
              )}

              {milestoneType !== 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="value">Value (optional)</Label>
                  <Input
                    id="value"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g., 2 miles, 30 minutes"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="date">Date achieved</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How it felt, what helped..."
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Milestone'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Milestones list */}
      {milestones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">No milestones recorded yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Add your first milestone to start tracking your progress
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Summary stats */}
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{milestones.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">milestones achieved</p>
                </div>
                <Trophy className="w-10 h-10 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-4">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="relative flex items-start gap-4 pl-12">
                  <div className="absolute left-4 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
                    <Trophy className="w-3 h-3 text-white" />
                  </div>
                  <Card className="flex-1">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base dark:text-white">
                            {milestone.type === 'custom'
                              ? milestone.value
                              : getMilestoneLabel(milestone.type)}
                          </CardTitle>
                          {milestone.type !== 'custom' && milestone.value && (
                            <CardDescription>{milestone.value}</CardDescription>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${getMilestoneColor(milestone.type)}`}>
                          {formatDate(milestone.date)}
                        </span>
                      </div>
                    </CardHeader>
                    {milestone.notes && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{milestone.notes}</p>
                      </CardContent>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Suggested milestones */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Suggested Milestones</CardTitle>
          <CardDescription>Common achievements to work toward</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_MILESTONES.filter(m => m.value !== 'custom').map(m => {
              const achieved = milestones.some(milestone => milestone.type === m.value);
              return (
                <span
                  key={m.value}
                  className={`px-3 py-1 rounded-full text-sm ${
                    achieved
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 line-through'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {achieved && '✓ '}
                  {m.label}
                </span>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
