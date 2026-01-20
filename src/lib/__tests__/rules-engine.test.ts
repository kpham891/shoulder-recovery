import {
  currentRecoveryStage,
  allowedActivities,
  rehabPlan,
  fitnessPlan,
  shouldProgress,
  suggestNextMilestone,
} from '../rules-engine';
import type { UserProfile, DailyLog, RecoveryStage } from '@/types';

// Helper to create a mock profile
function createMockProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'test-profile-1',
    userId: 'test-user-1',
    injurySide: 'right',
    injuryDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    surgeryStatus: 'none',
    restrictions: {
      inSling: false,
      noRunning: false,
      noOverhead: true,
      maxAbductionAngle: 90,
      maxFlexionAngle: 90,
      externalRotationLimit: 'moderate',
    },
    goal: {
      type: 'general-conditioning',
      daysPerWeek: 4,
      minutesPerDay: 45,
      cardioBaseline: {
        canBikeMinutes: 30,
        canWalkMinutes: 30,
        canRunMinutes: 0,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// Helper to create a mock log
function createMockLog(overrides: Partial<DailyLog> = {}): DailyLog {
  return {
    id: 'test-log-1',
    userId: 'test-user-1',
    date: new Date().toISOString().split('T')[0],
    pain: 4,
    instability: 3,
    sleepImpact: 3,
    flexionBucket: '90-120',
    abductionBucket: '60-90',
    behindBackReach: 'waistband',
    slingWorn: false,
    didRehab: true,
    didCardio: true,
    didStrength: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('currentRecoveryStage', () => {
  test('returns acute for very recent injury', () => {
    const profile = createMockProfile({
      injuryDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    });
    const logs: DailyLog[] = [];

    const stage = currentRecoveryStage(profile, logs);
    expect(stage).toBe('acute');
  });

  test('returns acute when in sling', () => {
    const profile = createMockProfile({
      restrictions: {
        ...createMockProfile().restrictions,
        inSling: true,
      },
    });
    const logs: DailyLog[] = [];

    const stage = currentRecoveryStage(profile, logs);
    expect(stage).toBe('acute');
  });

  test('returns acute when pain is very high', () => {
    const profile = createMockProfile();
    const logs = [
      createMockLog({ pain: 8 }),
      createMockLog({ pain: 8 }),
      createMockLog({ pain: 8 }),
    ];

    const stage = currentRecoveryStage(profile, logs);
    expect(stage).toBe('acute');
  });

  test('returns early-rehab for moderate recovery', () => {
    const profile = createMockProfile({
      injuryDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks ago
    });
    const logs = [
      createMockLog({ pain: 5, flexionBucket: '60-90', abductionBucket: '60-90' }),
    ];

    const stage = currentRecoveryStage(profile, logs);
    expect(stage).toBe('early-rehab');
  });

  test('returns strengthening for good progress', () => {
    const profile = createMockProfile({
      injuryDate: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString(), // 8 weeks ago
    });
    const logs = [
      createMockLog({ pain: 3, flexionBucket: '120-150', abductionBucket: '120-150' }),
    ];

    const stage = currentRecoveryStage(profile, logs);
    expect(stage).toBe('strengthening');
  });

  test('returns return-to-sport for long recovery with full ROM', () => {
    const profile = createMockProfile({
      injuryDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // ~14 weeks ago
    });
    const logs = [
      createMockLog({ pain: 1, flexionBucket: '150+', abductionBucket: '150+' }),
    ];

    const stage = currentRecoveryStage(profile, logs);
    expect(stage).toBe('return-to-sport');
  });
});

describe('allowedActivities', () => {
  test('always allows walking and biking', () => {
    const profile = createMockProfile();
    const log = createMockLog();

    const allowed = allowedActivities(profile, log);
    expect(allowed.cardio).toContain('walk');
    expect(allowed.cardio).toContain('bike');
  });

  test('does not allow running when restricted', () => {
    const profile = createMockProfile({
      restrictions: {
        ...createMockProfile().restrictions,
        noRunning: true,
      },
    });
    const log = createMockLog();

    const allowed = allowedActivities(profile, log);
    expect(allowed.cardio).not.toContain('run');
  });

  test('does not allow running when in sling', () => {
    const profile = createMockProfile({
      restrictions: {
        ...createMockProfile().restrictions,
        inSling: true,
      },
    });
    const log = createMockLog();

    const allowed = allowedActivities(profile, log);
    expect(allowed.cardio).not.toContain('run');
  });

  test('allows running when not restricted and pain is low', () => {
    const profile = createMockProfile();
    const log = createMockLog({ pain: 3, instability: 2 });

    const allowed = allowedActivities(profile, log);
    expect(allowed.cardio).toContain('run');
  });

  test('pauses running when pain is high', () => {
    const profile = createMockProfile();
    const log = createMockLog({ pain: 7 });

    const allowed = allowedActivities(profile, log);
    expect(allowed.cardio).not.toContain('run');
    expect(allowed.notes).toContain('Running paused due to pain/instability levels');
  });

  test('flags deload week for high pain', () => {
    const profile = createMockProfile();
    const log = createMockLog({ pain: 8 });

    const allowed = allowedActivities(profile, log);
    expect(allowed.isDeloadWeek).toBe(true);
  });

  test('flags deload week for high instability', () => {
    const profile = createMockProfile();
    const log = createMockLog({ instability: 8 });

    const allowed = allowedActivities(profile, log);
    expect(allowed.isDeloadWeek).toBe(true);
  });

  test('does not allow overhead when restricted', () => {
    const profile = createMockProfile({
      restrictions: {
        ...createMockProfile().restrictions,
        noOverhead: true,
      },
    });
    const log = createMockLog();

    const allowed = allowedActivities(profile, log);
    expect(allowed.canDoOverhead).toBe(false);
  });

  test('allows overhead when ROM is good and pain is low', () => {
    const profile = createMockProfile({
      restrictions: {
        ...createMockProfile().restrictions,
        noOverhead: false,
        maxAbductionAngle: 150,
        maxFlexionAngle: 150,
      },
    });
    const log = createMockLog({ pain: 2 });

    const allowed = allowedActivities(profile, log);
    expect(allowed.canDoOverhead).toBe(true);
  });

  test('always allows legs strength', () => {
    const profile = createMockProfile();
    const log = createMockLog();

    const allowed = allowedActivities(profile, log);
    expect(allowed.strength).toContain('legs');
  });

  test('allows rowing only with good ROM and low pain', () => {
    const profile = createMockProfile({
      restrictions: {
        ...createMockProfile().restrictions,
        maxAbductionAngle: 90,
        maxFlexionAngle: 120,
      },
    });
    const log = createMockLog({ pain: 2 });

    const allowed = allowedActivities(profile, log);
    expect(allowed.cardio).toContain('row');
  });

  test('does not allow rowing with high pain', () => {
    const profile = createMockProfile();
    const log = createMockLog({ pain: 5 });

    const allowed = allowedActivities(profile, log);
    expect(allowed.cardio).not.toContain('row');
  });
});

describe('rehabPlan', () => {
  test('generates fewer exercises in acute stage', () => {
    const profile = createMockProfile();
    const log = createMockLog();

    const acutePlan = rehabPlan('acute', profile, log);
    const strengtheningPlan = rehabPlan('strengthening', profile, log);

    expect(acutePlan.exercises.length).toBeLessThanOrEqual(3);
    expect(strengtheningPlan.exercises.length).toBeGreaterThan(acutePlan.exercises.length);
  });

  test('excludes overhead exercises when ROM is low', () => {
    const profile = createMockProfile({
      restrictions: {
        ...createMockProfile().restrictions,
        noOverhead: true,
      },
    });
    const log = createMockLog({ flexionBucket: '<60' });

    const plan = rehabPlan('early-rehab', profile, log);
    const hasOverhead = plan.exercises.some(e => e.exercise.requiresOverhead);
    expect(hasOverhead).toBe(false);
  });

  test('excludes loading exercises when in sling', () => {
    const profile = createMockProfile({
      restrictions: {
        ...createMockProfile().restrictions,
        inSling: true,
      },
    });
    const log = createMockLog();

    const plan = rehabPlan('acute', profile, log);
    const hasLoading = plan.exercises.some(e => e.exercise.requiresShoulderLoading);
    expect(hasLoading).toBe(false);
  });

  test('includes easier exercises when pain is high', () => {
    const profile = createMockProfile();
    const log = createMockLog({ pain: 7 });

    const plan = rehabPlan('early-rehab', profile, log);
    const maxDifficulty = Math.max(...plan.exercises.map(e => e.exercise.difficulty));
    expect(maxDifficulty).toBeLessThanOrEqual(2);
  });

  test('adds note when pain is elevated', () => {
    const profile = createMockProfile();
    const log = createMockLog({ pain: 6 });

    const plan = rehabPlan('early-rehab', profile, log);
    expect(plan.notes).toContain('gentle');
  });
});

describe('fitnessPlan', () => {
  test('generates a weekly plan', () => {
    const profile = createMockProfile();
    const log = createMockLog();

    const plan = fitnessPlan(profile, log, [log]);
    expect(plan.weekNumber).toBeGreaterThanOrEqual(1);
    expect(plan.workouts.length).toBeGreaterThan(0);
  });

  test('respects days per week preference', () => {
    const profile = createMockProfile({
      goal: {
        ...createMockProfile().goal,
        daysPerWeek: 3,
      },
    });
    const log = createMockLog();

    const plan = fitnessPlan(profile, log, [log]);
    expect(plan.workouts.length).toBeLessThanOrEqual(3);
  });

  test('reduces cardio minutes during deload week', () => {
    const profile = createMockProfile();
    const normalLog = createMockLog({ pain: 3 });
    const highPainLog = createMockLog({ pain: 8 });

    const normalPlan = fitnessPlan(profile, normalLog, [normalLog]);
    const deloadPlan = fitnessPlan(profile, highPainLog, [highPainLog]);

    expect(deloadPlan.totalCardioMinutes).toBeLessThan(normalPlan.totalCardioMinutes);
  });

  test('uses bike when running is restricted', () => {
    const profile = createMockProfile({
      restrictions: {
        ...createMockProfile().restrictions,
        noRunning: true,
      },
      goal: {
        ...createMockProfile().goal,
        type: 'half-marathon',
      },
    });
    const log = createMockLog();

    const plan = fitnessPlan(profile, log, [log]);
    const cardioWorkouts = plan.workouts.filter(w => w.fitness?.type === 'cardio');

    // All cardio workouts should use bike, not run
    cardioWorkouts.forEach(w => {
      expect(w.fitness?.cardioType).not.toBe('run');
    });
  });
});

describe('shouldProgress', () => {
  test('returns false with fewer than 3 logs', () => {
    const logs = [createMockLog(), createMockLog()];
    expect(shouldProgress(logs)).toBe(false);
  });

  test('returns false when pain is too high', () => {
    const logs = [
      createMockLog({ pain: 5 }),
      createMockLog({ pain: 5 }),
      createMockLog({ pain: 5 }),
    ];
    expect(shouldProgress(logs)).toBe(false);
  });

  test('returns true when pain is consistently low', () => {
    const logs = [
      createMockLog({ pain: 2, flexionBucket: '90-120' }),
      createMockLog({ pain: 2, flexionBucket: '90-120' }),
      createMockLog({ pain: 2, flexionBucket: '120-150' }),
    ];
    expect(shouldProgress(logs)).toBe(true);
  });
});

describe('suggestNextMilestone', () => {
  test('suggests logging first for no logs', () => {
    const profile = createMockProfile();
    const suggestion = suggestNextMilestone(profile, null);
    expect(suggestion).toContain('first daily log');
  });

  test('suggests flexion 90 when low', () => {
    const profile = createMockProfile();
    const log = createMockLog({ flexionBucket: '<60' });

    const suggestion = suggestNextMilestone(profile, log);
    expect(suggestion).toContain('flexion');
    expect(suggestion).toContain('90');
  });

  test('suggests abduction when flexion is ok', () => {
    const profile = createMockProfile();
    const log = createMockLog({ flexionBucket: '120-150', abductionBucket: '<60' });

    const suggestion = suggestNextMilestone(profile, log);
    expect(suggestion).toContain('abduction');
  });

  test('suggests sling-free when still in sling', () => {
    const profile = createMockProfile();
    const log = createMockLog({
      flexionBucket: '150+',
      abductionBucket: '150+',
      slingWorn: true,
    });

    const suggestion = suggestNextMilestone(profile, log);
    expect(suggestion).toContain('sling');
  });
});
