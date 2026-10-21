import { describe, expect, it } from "vitest";
import { calculateModuleScore, isExerciseLevelUnlocked } from "../lib/services/moduleScoring";
import { ExerciseKind } from "../lib/types";

const exerciseTypes: ExerciseKind[] = ["peripheral_vision", "target_scan"];

describe("module scoring", () => {
  it("averages reading and exercise scores equally and completes at 70", () => {
    const result = calculateModuleScore({
      readingScore: 80,
      exerciseTypes,
      bestExerciseScores: { peripheral_vision: 80, target_scan: 60 },
    });

    expect(result.exerciseScore).toBe(70);
    expect(result.overallScore).toBe(75);
    expect(result.isComplete).toBe(true);
  });

  it("does not complete a module below the 70-point threshold", () => {
    const result = calculateModuleScore({
      readingScore: 68,
      exerciseTypes: ["peripheral_vision"],
      bestExerciseScores: { peripheral_vision: 70 },
    });

    expect(result.overallScore).toBe(69);
    expect(result.isComplete).toBe(false);
  });

  it("completes a module when the combined score is exactly 70", () => {
    const result = calculateModuleScore({
      readingScore: 80,
      exerciseTypes: ["peripheral_vision"],
      bestExerciseScores: { peripheral_vision: 60 },
    });

    expect(result.overallScore).toBe(70);
    expect(result.isComplete).toBe(true);
  });

  it("requires a score for every assigned exercise kind", () => {
    const result = calculateModuleScore({
      readingScore: 100,
      exerciseTypes,
      bestExerciseScores: { peripheral_vision: 100 },
    });

    expect(result.exerciseScore).toBe(50);
    expect(result.isComplete).toBe(false);
  });

  it("keeps the module incomplete until a reading score is recorded", () => {
    const result = calculateModuleScore({
      exerciseTypes: ["peripheral_vision"],
      bestExerciseScores: { peripheral_vision: 100 },
    });

    expect(result.overallScore).toBeNull();
    expect(result.isComplete).toBe(false);
  });
});

describe("exercise level unlocking", () => {
  it("unlocks the first level by default", () => {
    expect(isExerciseLevelUnlocked(1)).toBe(true);
  });

  it("unlocks the next level only after a previous best score of at least 70", () => {
    expect(isExerciseLevelUnlocked(2, 69)).toBe(false);
    expect(isExerciseLevelUnlocked(2, 70)).toBe(true);
  });
});
