# Recovery + Fitness Planner

A web app for tracking shoulder recovery and generating fitness workouts that adapt to shoulder limitations.

## Features

- **Daily Quick Logs**: Track pain, ROM, stability in under 60 seconds
- **Smart Rehab Plans**: Shoulder rehab exercises based on recovery stage
- **Adaptive Fitness Workouts**: Training plans that respect restrictions (swaps running for biking, etc.)
- **Progress Dashboard**: Pain trends, ROM tracking, milestone suggestions
- **Milestone Tracking**: Celebrate achievements like "First day without sling" or "ROM to 90°"
- **Multi-user Support**: Each user sees only their own data

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui components
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **Charts**: Recharts
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)

### 1. Clone and Install

```bash
cd shoulder-recovery
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** and copy:
   - Project URL
   - `anon` public key
3. Go to **SQL Editor** and run the schema:
   - Copy contents of `supabase/schema.sql`
   - Paste and run in SQL Editor

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Tests

```bash
npm test
```

## Project Structure

```
shoulder-recovery/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (app)/              # Authenticated routes
│   │   │   ├── dashboard/      # Dashboard with trends
│   │   │   ├── log/            # Daily quick log
│   │   │   ├── rehab/          # Rehab workout generator
│   │   │   ├── fitness/        # Fitness workout generator
│   │   │   ├── milestones/     # Milestone tracking
│   │   │   └── settings/       # User settings
│   │   ├── auth/               # Auth pages (login/signup)
│   │   └── onboarding/         # New user onboarding
│   ├── components/
│   │   ├── nav/                # Navigation components
│   │   └── ui/                 # shadcn/ui components
│   ├── hooks/                  # React hooks
│   ├── lib/
│   │   ├── exercises.ts        # Exercise library (40 exercises)
│   │   ├── rules-engine.ts     # Workout generation logic
│   │   ├── supabase/           # Supabase client
│   │   └── utils.ts            # Utility functions
│   └── types/                  # TypeScript types
├── supabase/
│   └── schema.sql              # Database schema
└── ...config files
```

## Rules Engine

The rules engine (`src/lib/rules-engine.ts`) generates personalized workouts:

### Recovery Stage Detection
- **Acute**: 0-2 weeks post-injury/surgery, in sling, or high pain
- **Early Rehab**: 2-6 weeks, ROM < 90°, moderate pain
- **Strengthening**: 6-12 weeks, ROM < 150°
- **Return to Sport**: 12+ weeks with good ROM and low pain

### Activity Restrictions
- Walking/biking always allowed
- Running blocked if: in sling, `noRunning` restriction, or pain ≥ 6
- Rowing only with good ROM (≥90° abduction) and low pain (≤3)
- Overhead movements require full clearance and ROM ≥120°

### Deload Logic
Automatically triggers a deload week when:
- Pain ≥ 7
- Instability ("feels like it could pop") ≥ 7
- Sleep impact ≥ 8

### Progressive Cardio
For race training (half marathon, 10K, 5K):
- Weekly cardio minutes increase ~10% per week
- If running is blocked, substitutes bike time at equivalent effort

## Exercise Library

The app includes ~40 exercises across categories:

**Rehab Exercises** (14):
- Pendulum swings, passive flexion, wand exercises
- Isometric rotator cuff work
- Progressive strengthening (bands, prone Y/T)

**Cardio** (6):
- Walking, stationary bike, elliptical
- Running (when cleared), swimming (kick only), light rowing

**Strength - Legs** (8):
- Leg press, leg curl/extension, goblet squat
- Lunges, single-leg RDL, calf raises

**Strength - Core** (8):
- Dead bug, bird dog, planks
- Glute bridges, Pallof press, hollow holds

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Configure Supabase Auth

In your Supabase dashboard:
1. Go to **Authentication > URL Configuration**
2. Add your Vercel URL to:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

## Safety Disclaimers

This app includes important disclaimers:

- **Not medical advice**: Displayed on every page
- **Stop if pain spikes**: Prominent warnings in workout screens
- **Consult clinician**: Encouraged throughout
- **Conservative defaults**: Rules engine errs on the side of caution
- **Auto-deload**: High pain/instability automatically reduces intensity

## Demo Mode / Testing

For local testing with seed data, you can:
1. Create a test account
2. Complete onboarding with sample restrictions
3. Add a few logs with varying pain levels to see how workouts adapt

## API Reference

### Types

```typescript
// Key types (see src/types/index.ts for full definitions)

type RecoveryStage = 'acute' | 'early-rehab' | 'strengthening' | 'return-to-sport';

interface UserProfile {
  injurySide: 'left' | 'right' | 'both';
  restrictions: Restrictions;
  goal: FitnessGoal;
}

interface DailyLog {
  pain: number;           // 0-10
  instability: number;    // 0-10
  flexionBucket: '<60' | '60-90' | '90-120' | '120-150' | '150+';
  // ...
}
```

### Rules Engine Functions

```typescript
// Get current recovery stage
currentRecoveryStage(profile: UserProfile, logs: DailyLog[]): RecoveryStage

// Get allowed activities based on restrictions
allowedActivities(profile: UserProfile, latestLog: DailyLog | null): AllowedActivities

// Generate rehab workout plan
rehabPlan(stage: RecoveryStage, profile: UserProfile, latestLog: DailyLog | null): RehabWorkout

// Generate fitness workout plan for the week
fitnessPlan(profile: UserProfile, latestLog: DailyLog | null, logs: DailyLog[]): WeeklyPlan
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT

---

**Remember**: This app is not a substitute for professional medical advice. Always consult your physician or physical therapist before starting any exercise program.
