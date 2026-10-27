import { ExerciseKind, LearningModule, UserProgress } from "@/lib/types";

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

export function isModuleUnlocked(
  module: LearningModule,
  modules: LearningModule[],
  progress: UserProgress[]
): boolean {
  return !module.prerequisites?.length || module.prerequisites.every((prerequisiteId) => {
    const prerequisiteModule = modules.find((candidate) => candidate.id === prerequisiteId);
    const prerequisiteProgress = progress.find((item) => item.moduleId === prerequisiteId);
    return Boolean(
      prerequisiteModule &&
      (prerequisiteProgress?.overallScore ?? 0) >=
        (prerequisiteModule.requiredCompletionScore ?? 70)
    );
  });
}
