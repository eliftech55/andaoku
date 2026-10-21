import { ExerciseDefinition, ExerciseKind } from "@/lib/types";

const LEVELS = [
  { level: 1, label: "Başlangıç", gridSize: 4, seconds: 50, targetCount: 5, sequenceLength: 4, flashDurationMs: 1400 },
  { level: 2, label: "Kolay", gridSize: 5, seconds: 45, targetCount: 7, sequenceLength: 6, flashDurationMs: 1100 },
  { level: 3, label: "Orta", gridSize: 6, seconds: 40, targetCount: 10, sequenceLength: 8, flashDurationMs: 800 },
  { level: 4, label: "Zor", gridSize: 7, seconds: 35, targetCount: 14, sequenceLength: 10, flashDurationMs: 600 },
  { level: 5, label: "Uzman", gridSize: 8, seconds: 30, targetCount: 18, sequenceLength: 12, flashDurationMs: 400 },
] as const;

const EXERCISES: Record<
  ExerciseKind,
  { title: string; description: string; instructions: string; targetSymbol: string }
> = {
  peripheral_vision: {
    title: "Çevresel Görüş",
    description: "Merkez odağı korurken çevredeki hedef sembolleri fark etme çalışması.",
    instructions: "Bakışınızı merkezde tutun; çevrede gördüğünüz hedeflerin tümünü seçin.",
    targetSymbol: "●",
  },
  target_scan: {
    title: "Hedef ve Harf Tarama",
    description: "Karışık sembol ve harfler arasından hedefleri hızlı ve doğru bulma çalışması.",
    instructions: "Izgaradaki hedef sembollerin tümünü süre bitmeden seçin.",
    targetSymbol: "A",
  },
  eye_saccade: {
    title: "Göz Sıçraması",
    description: "Görüşü farklı noktalara kontrollü biçimde taşıma ve hedef sırasını izleme çalışması.",
    instructions: "Görünen hedefleri soldan sağa ve yukarıdan aşağıya doğru sırayla seçin.",
    targetSymbol: "●",
  },
  flash_words: {
    title: "Flaş Kelime Tanıma",
    description: "Kısa süre gösterilen kelimeyi hızlı algılama ve doğru seçeneği bulma çalışması.",
    instructions: "Kısa süre gösterilen kelimeyi aklınızda tutup seçenekler arasından seçin.",
    targetSymbol: "",
  },
};

export const BUILT_IN_EXERCISE_DEFINITIONS: ExerciseDefinition[] = (
  Object.keys(EXERCISES) as ExerciseKind[]
).flatMap((kind) =>
  LEVELS.map((level) => {
    const exercise = EXERCISES[kind];
    return {
      id: `${kind}-level-${level.level}`,
      kind,
      level: level.level as 1 | 2 | 3 | 4 | 5,
      title: `${exercise.title} — Seviye ${level.level} (${level.label})`,
      description: exercise.description,
      instructions: exercise.instructions,
      config: {
        gridSize: level.gridSize,
        targetCount: level.targetCount,
        timeLimitSeconds: level.seconds,
        sequenceLength: level.sequenceLength,
        flashDurationMs: level.flashDurationMs,
        targetSymbol: exercise.targetSymbol,
      },
      status: "published" as const,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
  })
);
