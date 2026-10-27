import { ExerciseKind } from "@/lib/types";

interface ModuleScoreInput {
  readingScore?: number;
  exerciseTypes: ExerciseKind[];
  bestExerciseScores: Partial<Record<ExerciseKind, number>>;
  requiredCompletionScore?: number;
}

interface ModuleScore {
  exerciseScore: number;
  overallScore: number | null;
  isComplete: boolean;
}

export function calculateModuleScore({
  readingScore,
  exerciseTypes,
  bestExerciseScores,
  requiredCompletionScore = 70,
}: ModuleScoreInput): ModuleScore {
  const exerciseScore = exerciseTypes.length
    ? Math.round(
        exerciseTypes.reduce((total, type) => total + (bestExerciseScores[type] || 0), 0) /
          exerciseTypes.length
      )
    : 0;
  const hasCompletedAllExerciseTypes =
    exerciseTypes.length > 0 &&
    exerciseTypes.every((type) => bestExerciseScores[type] !== undefined);
  const overallScore =
    readingScore === undefined ? null : Math.round((readingScore + exerciseScore) / 2);

  return {
    exerciseScore,
    overallScore,
    isComplete:
      readingScore !== undefined &&
      hasCompletedAllExerciseTypes &&
      overallScore !== null &&
      overallScore >= requiredCompletionScore,
  };
}

export function isExerciseLevelUnlocked(level: number, previousLevelBestScore = 0): boolean {
  return level <= 1 || previousLevelBestScore >= 70;
}
