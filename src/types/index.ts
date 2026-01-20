// Core type definitions for Recovery + Fitness Planner

export type InjurySide = 'left' | 'right' | 'both';

export type SurgeryStatus = 'none' | 'planned' | 'post-op';

export type RecoveryStage = 'acute' | 'early-rehab' | 'strengthening' | 'return-to-sport';

export type ExternalRotationLimit = 'none' | 'mild' | 'moderate' | 'severe';

export type FlexionBucket = '<60' | '60-90' | '90-120' | '120-150' | '150+';

export type AbductionBucket = '<60' | '60-90' | '90-120' | '120-150' | '150+';

export type BehindBackReach = 'cant' | 'waistband' | 'mid-back' | 'shoulder-blade';

export type GoalType =
  | 'half-marathon'
  | '10k'
  | '5k'
  | 'general-conditioning'
  | 'strength'
  | 'weight-loss'
  | 'maintain-fitness';

export type WorkoutKind = 'rehab' | 'fitness';

export type CardioType = 'run' | 'bike' | 'elliptical' | 'walk' | 'swim' | 'row';

export type StrengthCategory = 'legs' | 'core' | 'upper-pull' | 'upper-push' | 'full-body';

export interface Restrictions {
  inSling: boolean;
  noRunning: boolean;
  noOverhead: boolean;
  maxAbductionAngle: number; // 0-180
  maxFlexionAngle: number; // 0-180
  externalRotationLimit: ExternalRotationLimit;
  painfulMovements?: string;
}

export interface FitnessGoal {
  type: GoalType;
  targetDate?: string; // ISO date
  daysPerWeek: number;
  minutesPerDay: number;
  cardioBaseline: {
    canBikeMinutes: number;
    canWalkMinutes: number;
    canRunMinutes: number;
  };
}

export interface UserProfile {
  id: string;
  userId: string;
  injurySide: InjurySide;
  injuryDate: string; // ISO date
  surgeryStatus: SurgeryStatus;
  surgeryDate?: string; // ISO date
  restrictions: Restrictions;
  goal: FitnessGoal;
  createdAt: string;
  updatedAt: string;
}

export interface DailyLog {
  id: string;
  userId: string;
  date: string; // ISO date
  pain: number; // 0-10
  instability: number; // 0-10 "feels like it could pop"
  sleepImpact: number; // 0-10
  flexionBucket: FlexionBucket;
  abductionBucket: AbductionBucket;
  behindBackReach: BehindBackReach;
  slingWorn: boolean;
  didRehab: boolean;
  didCardio: boolean;
  didStrength: boolean;
  notes?: string;
  createdAt: string;
}

export type MilestoneType =
  | 'flexion-90'
  | 'flexion-120'
  | 'flexion-150'
  | 'abduction-90'
  | 'abduction-120'
  | 'abduction-150'
  | 'external-rotation'
  | 'first-day-no-sling'
  | 'pain-free-sleep'
  | 'first-run'
  | 'first-full-workout'
  | 'custom';

export interface Milestone {
  id: string;
  userId: string;
  date: string; // ISO date
  type: MilestoneType;
  value?: string; // e.g., "2 miles" for first run
  notes?: string;
  createdAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: 'rehab' | 'mobility' | 'cardio' | 'strength';
  targetArea: 'shoulder' | 'core' | 'legs' | 'full-body';
  difficulty: 1 | 2 | 3 | 4 | 5;
  requiresOverhead: boolean;
  requiresShoulderLoading: boolean;
  requiresExternalRotation: boolean;
  minAbductionAngle: number;
  minFlexionAngle: number;
  instructions: string;
  sets?: string;
  reps?: string;
  duration?: string;
  videoUrl?: string;
}

export interface WorkoutExercise {
  exercise: Exercise;
  sets: number;
  reps?: number;
  duration?: string;
  notes?: string;
}

export interface RehabWorkout {
  id: string;
  name: string;
  stage: RecoveryStage;
  exercises: WorkoutExercise[];
  totalDuration: string;
  notes?: string;
}

export interface FitnessWorkout {
  id: string;
  name: string;
  type: 'cardio' | 'legs' | 'core' | 'mobility' | 'mixed';
  exercises: WorkoutExercise[];
  totalDuration: string;
  cardioType?: CardioType;
  intensity: 'easy' | 'moderate' | 'hard';
  notes?: string;
}

export interface WeeklyPlan {
  weekNumber: number;
  startDate: string;
  workouts: {
    day: number; // 0-6
    rehab?: RehabWorkout;
    fitness?: FitnessWorkout;
  }[];
  totalCardioMinutes: number;
  totalStrengthSessions: number;
}

export interface WorkoutCompletion {
  id: string;
  userId: string;
  date: string;
  kind: WorkoutKind;
  workoutPayload: RehabWorkout | FitnessWorkout;
  createdAt: string;
}

// Helper type for activity allowance
export interface AllowedActivities {
  cardio: CardioType[];
  strength: StrengthCategory[];
  canDoOverhead: boolean;
  canDoHeavyCarries: boolean;
  canDoPullUps: boolean;
  isDeloadWeek: boolean;
  notes: string[];
}
