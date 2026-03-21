'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Leaf, BarChart3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SubstanceLog } from '@/types';

const SUBSTANCE_EMOJI: Record<string, string> = {
  Cannabis: '🌿',
  MDMA: '💊',
  Psilocybin: '🍄',
  Cocaine: '❄️',
  Ketamine: '💉',
  Other: '🧪',
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function SubstancesPage() {
  const [logs, setLogs] = useState<SubstanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('substance_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', todayStart.toISOString())
      .lte('logged_at', todayEnd.toISOString())
      .order('logged_at', { ascending: false });

    setLogs(data || []);
    setLoading(false);
  }

  async function deleteLog(id: string) {
    const { error } = await supabase.from('substance_logs').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Entry removed' });
      loadData();
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <p className="text-center text-gray-500 animate-pulse">Loading…</p>
      </div>
    );
  }

  const todayCount = logs.length;
  const substanceCounts: Record<string, number> = {};
  logs.forEach((l) => {
    substanceCounts[l.substance] = (substanceCounts[l.substance] || 0) + 1;
  });

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-white">Substances</h1>
        <Link href="/substances/insights">
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-1" />
            Insights
          </Button>
        </Link>
      </div>

      {/* Log button */}
      <Link href="/substances/log" className="block">
        <Button className="w-full text-lg py-6 bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700" size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Log Substance
        </Button>
      </Link>

      {/* Today's Tally */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Today</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{todayCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">entries</p>
            </div>
            <div>
              <p className="text-2xl font-bold dark:text-white">
                {Object.keys(substanceCounts).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">substances</p>
            </div>
          </div>

          {/* Substance breakdown chips */}
          {Object.keys(substanceCounts).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(substanceCounts).map(([substance, count]) => (
                <span
                  key={substance}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
                >
                  {SUBSTANCE_EMOJI[substance] || '🧪'} {substance} × {count}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's log list */}
      {logs.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Today&apos;s Log
          </h2>
          <div className="space-y-2">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 dark:text-gray-500 w-16">
                      {formatTime(log.logged_at || log.loggedAt || '')}
                    </span>
                    <div>
                      <span className="font-medium text-sm dark:text-white">
                        {SUBSTANCE_EMOJI[log.substance] || '🧪'} {log.substance}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {log.method} · {log.dose}
                        {log.intensity && ` · ${log.intensity}/5`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteLog(log.id)}
                    className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {logs.length === 0 && (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <Leaf className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No substances logged today</p>
        </div>
      )}
    </div>
  );
}
