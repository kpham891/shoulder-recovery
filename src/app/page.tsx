'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Calendar, Dumbbell, LineChart, Shield, Target } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Disclaimer Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-center text-sm text-amber-800 dark:text-amber-200">
        <Shield className="inline-block w-4 h-4 mr-1" />
        Not medical advice. Stop if pain spikes; consult your clinician.
      </div>

      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold dark:text-white">Recovery + Fitness</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Track Your Shoulder Recovery.
            <br />
            <span className="text-blue-600 dark:text-blue-400">Keep Training Smart.</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Log your daily symptoms, get personalized rehab exercises, and generate
            fitness workouts that respect your shoulder limitations while keeping
            you on track toward your goals.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Your Recovery Journey
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <Calendar className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-2" />
              <CardTitle className="dark:text-white">Quick Daily Logs</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Track pain, ROM, stability in under 60 seconds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Simple tap-and-slide logging captures what matters: pain levels,
                range of motion, and functional milestones.
              </p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <Dumbbell className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-2" />
              <CardTitle className="dark:text-white">Smart Rehab Plans</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Exercises that match your recovery stage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Get shoulder rehab routines that progress with you - from acute
                phase gentle movements to return-to-sport strengthening.
              </p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <Target className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-2" />
              <CardTitle className="dark:text-white">Adaptive Fitness</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Stay fit while protecting your shoulder
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Training for a half marathon? The app swaps running for biking when
                needed, keeps your legs and core strong while your shoulder heals.
              </p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <LineChart className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-2" />
              <CardTitle className="dark:text-white">Progress Tracking</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Visualize your recovery journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                See pain trends, ROM improvements, and milestone achievements.
                Know when you&apos;re ready to progress.
              </p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <Shield className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-2" />
              <CardTitle className="dark:text-white">Safety First</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Conservative defaults, auto-deload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                High pain or instability? The app automatically suggests easier
                workouts. Always cleared with your PT first.
              </p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <Activity className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-2" />
              <CardTitle className="dark:text-white">Milestone Tracking</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Celebrate your wins along the way
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                First day without sling, ROM to 90°, first pain-free run -
                track and celebrate every achievement.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-12 border-t dark:border-gray-800">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          This app provides general fitness and exercise information only.
          It is not intended to be a substitute for professional medical advice,
          diagnosis, or treatment. Always consult your physician or physical
          therapist before starting any exercise program.
        </p>
      </footer>
    </div>
  );
}
