import { describe, expect, it } from "vitest";
import { calculateModuleScore, isExerciseLevelUnlocked, isModuleUnlocked } from "../lib/services/moduleScoring";
import { ExerciseKind, LearningModule, UserProgress } from "../lib/types";

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

  it("uses the module-specific completion threshold", () => {
    const result = calculateModuleScore({
      readingScore: 70,
      exerciseTypes: ["peripheral_vision"],
      bestExerciseScores: { peripheral_vision: 70 },
      requiredCompletionScore: 75,
    });

    expect(result.overallScore).toBe(70);
    expect(result.isComplete).toBe(false);
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

describe("module unlocking", () => {
  const prerequisite: LearningModule = {
    id: "module-1",
    title: "Modül 1",
    description: "",
    targetSkills: [],
    difficulty: "easy",
    exerciseTypes: exerciseTypes,
    prerequisites: [],
    requiredCompletionScore: 70,
    order: 1,
    estimatedDuration: 10,
    status: "published",
    createdBy: "test",
    createdAt: "",
    updatedAt: "",
  };
  const lockedModule: LearningModule = {
    ...prerequisite,
    id: "module-2",
    title: "Modül 2",
    prerequisites: ["module-1"],
    order: 2,
  };

  it("keeps a module locked below its prerequisite score", () => {
    const progress: UserProgress[] = [{
      id: "progress-1",
      userId: "user-1",
      moduleId: "module-1",
      status: "completed",
      overallScore: 65,
      completionPercentage: 65,
      attemptCount: 1,
      lastActivityAt: "",
      updatedAt: "",
    }];

    expect(isModuleUnlocked(lockedModule, [prerequisite, lockedModule], progress)).toBe(false);
  });

  it("unlocks a module when its prerequisite meets the threshold", () => {
    const progress: UserProgress[] = [{
      id: "progress-1",
      userId: "user-1",
      moduleId: "module-1",
      status: "completed",
      overallScore: 70,
      completionPercentage: 70,
      attemptCount: 1,
      lastActivityAt: "",
      updatedAt: "",
    }];

    expect(isModuleUnlocked(lockedModule, [prerequisite, lockedModule], progress)).toBe(true);
  });
});
