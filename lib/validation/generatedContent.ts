import { z } from "zod";

export const generationInputSchema = z.object({
  topic: z.string().trim().min(2).max(120),
  targetDifficulty: z.enum(["beginner", "intermediate", "advanced"]),
  educationLevels: z
    .array(z.enum(["primary", "middle", "high", "university", "adult"]))
    .min(1)
    .max(5),
});

const questionCategorySchema = z.enum([
  "acik_bilgi",
  "ana_fikir",
  "cikarim",
  "kelime_anlami",
  "siralama",
  "yazar_amaci",
]);

export const generatedContentSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(300),
  passageTitle: z.string().min(3).max(120),
  passageContent: z.string().min(300).max(10000),
  genre: z.enum(["bilgilendirici", "oykuleyici", "aciklayici", "akademik", "diger"]),
  topic: z.string().min(2).max(120),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  questions: z
    .array(
      z.object({
        questionText: z.string().min(10).max(500),
        questionType: questionCategorySchema,
        options: z
          .array(
            z.object({
              id: z.enum(["A", "B", "C", "D"]),
              text: z.string().min(1).max(300),
            })
          )
          .length(4),
        correctOptionId: z.enum(["A", "B", "C", "D"]),
        explanation: z.string().min(5).max(500),
      })
    )
    .length(10),
});

export type GeneratedContent = z.infer<typeof generatedContentSchema>;
