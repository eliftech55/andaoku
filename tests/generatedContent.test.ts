import { describe, expect, it } from "vitest";
import { generatedContentSchema, generationInputSchema } from "../lib/validation/generatedContent";

const validQuestion = (index: number) => ({
  questionText: `Metinde ${index + 1}. konu hakkında hangi bilgi verilmiştir?`,
  questionType: "acik_bilgi" as const,
  options: [
    { id: "A" as const, text: "İlk seçenek" },
    { id: "B" as const, text: "İkinci seçenek" },
    { id: "C" as const, text: "Üçüncü seçenek" },
    { id: "D" as const, text: "Dördüncü seçenek" },
  ],
  correctOptionId: "A" as const,
  explanation: "Metindeki açıklamaya göre doğru yanıt budur.",
});

const validGeneratedContent = {
  title: "Okuma paketi",
  description: "Okuma ve anlama çalışması için içerik paketi.",
  passageTitle: "Doğanın Döngüsü",
  passageContent: "a".repeat(300),
  genre: "bilgilendirici" as const,
  topic: "Doğa",
  difficulty: "beginner" as const,
  questions: Array.from({ length: 10 }, (_, index) => validQuestion(index)),
};

describe("AI generated content schema", () => {
  it("accepts a complete package with exactly ten four-option questions", () => {
    expect(generatedContentSchema.safeParse(validGeneratedContent).success).toBe(true);
  });

  it("rejects packages that do not contain exactly ten questions", () => {
    expect(
      generatedContentSchema.safeParse({
        ...validGeneratedContent,
        questions: validGeneratedContent.questions.slice(0, 9),
      }).success
    ).toBe(false);
  });

  it("validates topic, target difficulty, and target audience before generation", () => {
    expect(
      generationInputSchema.safeParse({
        topic: "Doğa",
        targetDifficulty: "beginner",
        educationLevels: ["middle"],
      }).success
    ).toBe(true);
    expect(
      generationInputSchema.safeParse({
        topic: "",
        targetDifficulty: "invalid",
        educationLevels: [],
      }).success
    ).toBe(false);
  });
});
