import { describe, it, expect } from 'vitest';
import {
  exercises,
  getExerciseById,
  getExercisesByCategory,
  getRehabExercises,
  getCardioExercises,
  getStrengthExercises,
} from '../exercises';

// ---------------------------------------------------------------------------
// Data integrity
// ---------------------------------------------------------------------------
describe('exercises data', () => {
  it('contains exercises', () => {
    expect(exercises.length).toBeGreaterThan(0);
  });

  it('every exercise has a unique id', () => {
    const ids = exercises.map((e) => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every exercise has the required fields', () => {
    for (const exercise of exercises) {
      expect(exercise.id, `${exercise.id} missing id`).toBeTruthy();
      expect(exercise.name, `${exercise.id} missing name`).toBeTruthy();
      expect(exercise.category, `${exercise.id} missing category`).toBeTruthy();
      expect(exercise.targetArea, `${exercise.id} missing targetArea`).toBeTruthy();
      expect(typeof exercise.difficulty).toBe('number');
      expect(typeof exercise.requiresOverhead).toBe('boolean');
      expect(typeof exercise.requiresShoulderLoading).toBe('boolean');
      expect(typeof exercise.requiresExternalRotation).toBe('boolean');
      expect(typeof exercise.minAbductionAngle).toBe('number');
      expect(typeof exercise.minFlexionAngle).toBe('number');
    }
  });

  it('difficulty is always between 1 and 5', () => {
    for (const exercise of exercises) {
      expect(exercise.difficulty).toBeGreaterThanOrEqual(1);
      expect(exercise.difficulty).toBeLessThanOrEqual(5);
    }
  });

  it('angle requirements are non-negative', () => {
    for (const exercise of exercises) {
      expect(exercise.minAbductionAngle).toBeGreaterThanOrEqual(0);
      expect(exercise.minFlexionAngle).toBeGreaterThanOrEqual(0);
    }
  });

  it('exercises that require overhead have minFlexionAngle or minAbductionAngle ≥ 90', () => {
    const overhead = exercises.filter((e) => e.requiresOverhead);
    for (const exercise of overhead) {
      const meetsAngle =
        exercise.minFlexionAngle >= 90 || exercise.minAbductionAngle >= 90;
      expect(
        meetsAngle,
        `${exercise.id} requires overhead but has low angle requirements`
      ).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// getExerciseById
// ---------------------------------------------------------------------------
describe('getExerciseById', () => {
  it('finds an exercise by id', () => {
    const exercise = getExerciseById('pendulum');
    expect(exercise).toBeDefined();
    expect(exercise?.name).toBe('Pendulum Swings');
  });

  it('returns undefined for an unknown id', () => {
    expect(getExerciseById('does-not-exist')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getExercisesByCategory
// ---------------------------------------------------------------------------
describe('getExercisesByCategory', () => {
  it('returns only rehab exercises', () => {
    const result = getExercisesByCategory('rehab');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((e) => e.category === 'rehab')).toBe(true);
  });

  it('returns only cardio exercises', () => {
    const result = getExercisesByCategory('cardio');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((e) => e.category === 'cardio')).toBe(true);
  });

  it('returns only strength exercises', () => {
    const result = getExercisesByCategory('strength');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((e) => e.category === 'strength')).toBe(true);
  });

  it('returns empty array for unknown category', () => {
    // @ts-expect-error testing invalid category
    expect(getExercisesByCategory('unknown')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getRehabExercises
// ---------------------------------------------------------------------------
describe('getRehabExercises', () => {
  it('returns rehab and mobility exercises', () => {
    const result = getRehabExercises();
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((e) => e.category === 'rehab' || e.category === 'mobility')).toBe(true);
  });

  it('includes mobility exercises', () => {
    const result = getRehabExercises();
    expect(result.some((e) => e.category === 'mobility')).toBe(true);
  });

  it('does not include cardio or strength exercises', () => {
    const result = getRehabExercises();
    expect(result.some((e) => e.category === 'cardio')).toBe(false);
    expect(result.some((e) => e.category === 'strength')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getCardioExercises
// ---------------------------------------------------------------------------
describe('getCardioExercises', () => {
  it('returns only cardio exercises', () => {
    const result = getCardioExercises();
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((e) => e.category === 'cardio')).toBe(true);
  });

  it('does not include rehab or strength exercises', () => {
    const result = getCardioExercises();
    expect(result.some((e) => e.category === 'rehab')).toBe(false);
    expect(result.some((e) => e.category === 'strength')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getStrengthExercises
// ---------------------------------------------------------------------------
describe('getStrengthExercises', () => {
  it('returns only strength exercises', () => {
    const result = getStrengthExercises();
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((e) => e.category === 'strength')).toBe(true);
  });

  it('covers legs and core target areas', () => {
    const result = getStrengthExercises();
    expect(result.some((e) => e.targetArea === 'legs')).toBe(true);
    expect(result.some((e) => e.targetArea === 'core')).toBe(true);
  });
});
