// Rules engine for generating recovery stage, allowed activities, and workout plans

import {
  RecoveryStage,
  UserProfile,
  DailyLog,
  AllowedActivities,
  CardioType,
  StrengthCategory,
  RehabWorkout,
  FitnessWorkout,
  WeeklyPlan,
  WorkoutExercise,
  FlexionBucket,
  AbductionBucket,
} from '@/types';
import { exercises, getRehabExercises, getCardioExercises, getStrengthExercises } from './exercises';

// Helper: convert bucket to approximate angle
function bucketToAngle(bucket: FlexionBucket | AbductionBucket): number {
  switch (bucket) {
    case '<60': return 30;
    case '60-90': return 75;
    case '90-120': return 105;
    case '120-150': return 135;
    case '150+': return 165;
    default: return 0;
  }
}

// Helper: weeks since a date
function weeksSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}

// Helper: days until a date
function daysUntil(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Determine current recovery stage based on profile and logs
 */
export function currentRecoveryStage(profile: UserProfile, logs: DailyLog[]): RecoveryStage {
  const weeksSinceInjury = weeksSince(profile.injuryDate);
  const weeksSinceSurgery = profile.surgeryDate ? weeksSince(profile.surgeryDate) : null;

  // Use surgery date if post-op, otherwise injury date
  const weeksRecovering = weeksSinceSurgery ?? weeksSinceInjury;

  // Check recent logs for ROM and pain
  const recentLogs = logs.slice(-7);
  const avgPain = recentLogs.length > 0
    ? recentLogs.reduce((sum, l) => sum + l.pain, 0) / recentLogs.length
    : 5;

  const latestLog = recentLogs[recentLogs.length - 1];
  const latestFlexion = latestLog ? bucketToAngle(latestLog.flexionBucket) : 30;
  const latestAbduction = latestLog ? bucketToAngle(latestLog.abductionBucket) : 30;

  // Stage determination logic
  // Acute: 0-2 weeks post-injury/surgery OR still in sling OR high pain
  if (weeksRecovering <= 2 || profile.restrictions.inSling || avgPain >= 7) {
    return 'acute';
  }

  // Early rehab: 2-6 weeks OR ROM < 90 OR moderate pain
  if (weeksRecovering <= 6 || latestFlexion < 90 || latestAbduction < 90 || avgPain >= 5) {
    return 'early-rehab';
  }

  // Strengthening: 6-12 weeks OR ROM < 150
  if (weeksRecovering <= 12 || latestFlexion < 150 || latestAbduction < 150) {
    return 'strengthening';
  }

  // Return to sport: 12+ weeks with good ROM and low pain
  return 'return-to-sport';
}

/**
 * Determine allowed activities based on profile and latest log
 */
export function allowedActivities(profile: UserProfile, latestLog: DailyLog | null): AllowedActivities {
  const restrictions = profile.restrictions;
  const cardio: CardioType[] = [];
  const strength: StrengthCategory[] = [];
  const notes: string[] = [];

  // Check for deload conditions
  const isDeloadWeek = latestLog !== null && (
    latestLog.pain >= 7 ||
    latestLog.instability >= 7 ||
    latestLog.sleepImpact >= 8
  );

  if (isDeloadWeek) {
    notes.push('Deload week: reduce intensity, focus on recovery');
  }

  // Cardio allowances
  // Walking is always allowed
  cardio.push('walk');

  // Bike is always allowed (can be done in sling)
  cardio.push('bike');

  // Elliptical allowed if not in sling
  if (!restrictions.inSling) {
    cardio.push('elliptical');
  }

  // Running allowed if not restricted and not in sling and pain is manageable
  if (!restrictions.noRunning && !restrictions.inSling) {
    if (!latestLog || (latestLog.pain <= 5 && latestLog.instability <= 5)) {
      cardio.push('run');
    } else {
      notes.push('Running paused due to pain/instability levels');
    }
  }

  // Swimming (kick only) allowed if some ROM
  if (restrictions.maxFlexionAngle >= 60) {
    cardio.push('swim');
  }

  // Rowing only if good ROM and low pain and no sling
  if (!restrictions.inSling &&
      restrictions.maxAbductionAngle >= 60 &&
      restrictions.maxFlexionAngle >= 90 &&
      (!latestLog || latestLog.pain <= 3)) {
    cardio.push('row');
    notes.push('Light rowing only - stop if shoulder discomfort');
  }

  // Strength allowances
  // Legs almost always allowed
  strength.push('legs');

  // Core allowed if can get into plank position
  if (restrictions.maxFlexionAngle >= 60 || !restrictions.inSling) {
    strength.push('core');
  }

  // Upper body only in later stages
  const canDoOverhead = !restrictions.noOverhead &&
    restrictions.maxAbductionAngle >= 120 &&
    restrictions.maxFlexionAngle >= 120 &&
    (!latestLog || latestLog.pain <= 3);

  const canDoHeavyCarries = !restrictions.inSling &&
    restrictions.maxFlexionAngle >= 90 &&
    (!latestLog || latestLog.pain <= 4);

  const canDoPullUps = !restrictions.inSling &&
    restrictions.maxAbductionAngle >= 150 &&
    restrictions.maxFlexionAngle >= 150 &&
    restrictions.externalRotationLimit === 'none' &&
    (!latestLog || (latestLog.pain <= 2 && latestLog.instability <= 2));

  // Upper pulling only if good ROM and pain
  if (!restrictions.inSling &&
      restrictions.maxAbductionAngle >= 90 &&
      (!latestLog || latestLog.pain <= 3)) {
    strength.push('upper-pull');
    notes.push('Upper body pulling: keep light, avoid overhead');
  }

  // Upper pushing is more restricted
  if (canDoOverhead) {
    strength.push('upper-push');
    notes.push('Overhead pressing cleared - start light');
  }

  return {
    cardio,
    strength,
    canDoOverhead,
    canDoHeavyCarries,
    canDoPullUps,
    isDeloadWeek,
    notes,
  };
}

/**
 * Generate a rehab workout plan based on stage and current status
 */
export function rehabPlan(
  stage: RecoveryStage,
  profile: UserProfile,
  latestLog: DailyLog | null
): RehabWorkout {
  const rehabExercises = getRehabExercises();
  const selectedExercises: WorkoutExercise[] = [];

  const currentFlexion = latestLog ? bucketToAngle(latestLog.flexionBucket) : 30;
  const currentAbduction = latestLog ? bucketToAngle(latestLog.abductionBucket) : 30;
  const currentPain = latestLog?.pain ?? 5;

  // Filter exercises that are appropriate for current ROM and limitations
  const filteredExercises = rehabExercises.filter(ex => {
    // Check ROM requirements
    if (ex.minFlexionAngle > currentFlexion) return false;
    if (ex.minAbductionAngle > currentAbduction) return false;

    // Check if overhead is allowed
    if (ex.requiresOverhead && profile.restrictions.noOverhead) return false;
    if (ex.requiresOverhead && currentFlexion < 120) return false;

    // Check if loading is appropriate
    if (ex.requiresShoulderLoading && profile.restrictions.inSling) return false;

    // Check external rotation
    if (ex.requiresExternalRotation &&
        profile.restrictions.externalRotationLimit === 'severe') return false;

    // Difficulty filter based on stage and pain
    if (stage === 'acute' && ex.difficulty > 2) return false;
    if (stage === 'early-rehab' && ex.difficulty > 3) return false;
    if (currentPain >= 6 && ex.difficulty > 2) return false;

    return true;
  });

  // Select exercises based on stage
  let exerciseCount: number;
  switch (stage) {
    case 'acute':
      exerciseCount = 3;
      break;
    case 'early-rehab':
      exerciseCount = 4;
      break;
    case 'strengthening':
      exerciseCount = 5;
      break;
    case 'return-to-sport':
      exerciseCount = 6;
      break;
  }

  // Prioritize by difficulty appropriate to stage
  const sorted = [...filteredExercises].sort((a, b) => {
    // Prefer exercises at appropriate difficulty
    const targetDiff = stage === 'acute' ? 1 : stage === 'early-rehab' ? 2 : 3;
    return Math.abs(a.difficulty - targetDiff) - Math.abs(b.difficulty - targetDiff);
  });

  // Select exercises ensuring variety
  const selected = sorted.slice(0, exerciseCount);

  for (const ex of selected) {
    selectedExercises.push({
      exercise: ex,
      sets: parseInt(ex.sets?.split('-')[0] || '3'),
      reps: ex.reps ? parseInt(ex.reps.split('-')[0] || '10') : undefined,
      duration: ex.duration,
    });
  }

  // Calculate total duration
  const totalMinutes = selectedExercises.reduce((sum, we) => {
    if (we.duration) {
      const match = we.duration.match(/(\d+)/);
      return sum + (match ? parseInt(match[1]) / 60 * we.sets : 2);
    }
    return sum + (we.sets * (we.reps || 10) * 3) / 60; // ~3 sec per rep
  }, 0);

  return {
    id: `rehab-${Date.now()}`,
    name: `${stage.charAt(0).toUpperCase() + stage.slice(1)} Rehab Session`,
    stage,
    exercises: selectedExercises,
    totalDuration: `${Math.round(totalMinutes + 5)} min`, // +5 for transitions
    notes: currentPain >= 5 ? 'Go gentle today - pain is elevated' : undefined,
  };
}

/**
 * Generate a fitness workout plan for the week
 */
export function fitnessPlan(
  profile: UserProfile,
  latestLog: DailyLog | null,
  logs: DailyLog[]
): WeeklyPlan {
  const allowed = allowedActivities(profile, latestLog);
  const goal = profile.goal;

  // Calculate current week number in training
  const weeksSinceStart = weeksSince(profile.createdAt);
  const weekNumber = weeksSinceStart + 1;

  // Days until goal (if set)
  const daysToGoal = goal.targetDate ? daysUntil(goal.targetDate) : 365;
  const weeksToGoal = Math.max(1, Math.floor(daysToGoal / 7));

  // Base weekly cardio minutes based on goal and baseline
  let targetCardioMinutes = 0;
  const baseline = goal.cardioBaseline;

  switch (goal.type) {
    case 'half-marathon':
      // Progressive build to 150-180 min/week running (or equivalent)
      targetCardioMinutes = Math.min(180, 60 + (weekNumber * 10));
      break;
    case '10k':
      targetCardioMinutes = Math.min(120, 45 + (weekNumber * 8));
      break;
    case '5k':
      targetCardioMinutes = Math.min(90, 30 + (weekNumber * 6));
      break;
    case 'general-conditioning':
    case 'maintain-fitness':
      targetCardioMinutes = 90;
      break;
    case 'strength':
      targetCardioMinutes = 60;
      break;
    case 'weight-loss':
      targetCardioMinutes = 150;
      break;
  }

  // Reduce if deload week
  if (allowed.isDeloadWeek) {
    targetCardioMinutes = Math.floor(targetCardioMinutes * 0.6);
  }

  // Generate daily workouts
  const workoutsPerWeek = Math.min(goal.daysPerWeek, 6);
  const workouts: WeeklyPlan['workouts'] = [];

  // Determine primary cardio type
  let primaryCardio: CardioType = 'walk';
  if (allowed.cardio.includes('run')) {
    primaryCardio = 'run';
  } else if (allowed.cardio.includes('bike')) {
    primaryCardio = 'bike';
  } else if (allowed.cardio.includes('elliptical')) {
    primaryCardio = 'elliptical';
  }

  // Create workout schedule
  // Pattern: Cardio, Strength, Cardio, Rest, Cardio, Strength, Rest
  const cardioExercises = getCardioExercises().filter(ex => {
    if (!allowed.cardio.includes(ex.id.replace('-no-arms', '').replace('-light', '') as CardioType)) {
      return false;
    }
    if (ex.minFlexionAngle > (latestLog ? bucketToAngle(latestLog.flexionBucket) : 30)) {
      return false;
    }
    return true;
  });

  const strengthExercises = getStrengthExercises().filter(ex => {
    // Core and legs only initially
    if (ex.targetArea === 'shoulder') return false;
    if (ex.requiresOverhead && !allowed.canDoOverhead) return false;
    if (ex.requiresShoulderLoading && profile.restrictions.inSling) return false;
    if (ex.minFlexionAngle > (latestLog ? bucketToAngle(latestLog.flexionBucket) : 30)) {
      return false;
    }
    return true;
  });

  // Distribute workouts across the week
  let cardioSessionsPlanned = 0;
  let strengthSessionsPlanned = 0;
  const targetCardioSessions = Math.ceil(workoutsPerWeek * 0.6);
  const targetStrengthSessions = workoutsPerWeek - targetCardioSessions;

  for (let day = 0; day < 7 && cardioSessionsPlanned + strengthSessionsPlanned < workoutsPerWeek; day++) {
    // Skip some days for rest
    if (day === 3 || day === 6) continue;

    const isCardioDay = day % 2 === 0 || strengthSessionsPlanned >= targetStrengthSessions;

    if (isCardioDay && cardioSessionsPlanned < targetCardioSessions) {
      // Create cardio workout
      const cardioMinutes = Math.floor(targetCardioMinutes / targetCardioSessions);
      const cardioEx = cardioExercises.find(e => e.id.includes(primaryCardio)) || cardioExercises[0];

      if (cardioEx) {
        const fitness: FitnessWorkout = {
          id: `fitness-cardio-${day}`,
          name: `${primaryCardio.charAt(0).toUpperCase() + primaryCardio.slice(1)} Session`,
          type: 'cardio',
          exercises: [{
            exercise: cardioEx,
            sets: 1,
            duration: `${cardioMinutes} min`,
          }],
          totalDuration: `${cardioMinutes} min`,
          cardioType: primaryCardio,
          intensity: allowed.isDeloadWeek ? 'easy' : 'moderate',
        };

        workouts.push({ day, fitness });
        cardioSessionsPlanned++;
      }
    } else if (strengthSessionsPlanned < targetStrengthSessions) {
      // Create strength workout (legs + core)
      const legExercises = strengthExercises.filter(e => e.targetArea === 'legs').slice(0, 3);
      const coreExercises = strengthExercises.filter(e => e.targetArea === 'core').slice(0, 2);
      const selectedStrength = [...legExercises, ...coreExercises];

      if (selectedStrength.length > 0) {
        const fitness: FitnessWorkout = {
          id: `fitness-strength-${day}`,
          name: 'Legs & Core',
          type: day === 1 ? 'legs' : 'core',
          exercises: selectedStrength.map(ex => ({
            exercise: ex,
            sets: parseInt(ex.sets?.split('-')[0] || '3'),
            reps: ex.reps ? parseInt(ex.reps.split('-')[0] || '12') : undefined,
            duration: ex.duration,
          })),
          totalDuration: `${Math.min(goal.minutesPerDay, 45)} min`,
          intensity: allowed.isDeloadWeek ? 'easy' : 'moderate',
        };

        workouts.push({ day, fitness });
        strengthSessionsPlanned++;
      }
    }
  }

  return {
    weekNumber,
    startDate: new Date().toISOString().split('T')[0],
    workouts,
    totalCardioMinutes: targetCardioMinutes,
    totalStrengthSessions: strengthSessionsPlanned,
  };
}

/**
 * Get today's suggested workout
 */
export function getTodayWorkout(
  profile: UserProfile,
  latestLog: DailyLog | null,
  logs: DailyLog[]
): { rehab: RehabWorkout; fitness: FitnessWorkout | null } {
  const stage = currentRecoveryStage(profile, logs);
  const rehab = rehabPlan(stage, profile, latestLog);

  const weekly = fitnessPlan(profile, latestLog, logs);
  const today = new Date().getDay();
  const todayWorkout = weekly.workouts.find(w => w.day === today);

  return {
    rehab,
    fitness: todayWorkout?.fitness || null,
  };
}

/**
 * Suggest next milestone based on current progress
 */
export function suggestNextMilestone(
  profile: UserProfile,
  latestLog: DailyLog | null
): string {
  if (!latestLog) {
    return 'Complete your first daily log to track progress';
  }

  const flexion = bucketToAngle(latestLog.flexionBucket);
  const abduction = bucketToAngle(latestLog.abductionBucket);

  if (flexion < 90) {
    return 'Work toward forward flexion to 90 degrees';
  }
  if (abduction < 90) {
    return 'Work toward abduction to 90 degrees';
  }
  if (flexion < 120) {
    return 'Work toward forward flexion to 120 degrees';
  }
  if (abduction < 120) {
    return 'Work toward abduction to 120 degrees';
  }
  if (latestLog.slingWorn) {
    return 'First day without sling (when cleared by provider)';
  }
  if (latestLog.sleepImpact > 3) {
    return 'Work toward pain-free sleep';
  }
  if (!profile.restrictions.noRunning && latestLog.pain <= 3) {
    return 'First pain-free run';
  }

  return 'Continue strengthening toward full recovery';
}

/**
 * Check if user should progress to next exercise variation
 */
export function shouldProgress(logs: DailyLog[]): boolean {
  if (logs.length < 3) return false;

  const recent = logs.slice(-3);
  const avgPain = recent.reduce((sum, l) => sum + l.pain, 0) / recent.length;

  // Progress if pain consistently low
  if (avgPain > 3) return false;

  // Check for ROM improvement
  const oldFlexion = bucketToAngle(recent[0].flexionBucket);
  const newFlexion = bucketToAngle(recent[recent.length - 1].flexionBucket);

  return newFlexion >= oldFlexion;
}
