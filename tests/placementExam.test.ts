import { describe, it, expect, vi } from "vitest";
import {
  SEED_PLACEMENT_EXAMS,
  SEED_PLACEMENT_PASSAGES,
  SEED_PLACEMENT_QUESTIONS,
} from "../lib/services/placementSeedData";
import {
  getStudentPlacementQuestions,
  evaluatePlacementAttempt,
  getRandomPlacementExam,
} from "../lib/services/placementExamService";
import { countTurkishWords, calculateWpm, calculateComprehensionScore } from "../lib/utils/readingMetrics";
import { EducationLevel } from "../lib/types";

describe("AndaOku — Başlangıç Sınavı ve Seviye Belirleme Test Paketi", () => {
  it("Beş hedef grup için de örnek sınav paketi ve metin mevcut olmalıdır", () => {
    expect(SEED_PLACEMENT_EXAMS.length).toBe(5);
    expect(SEED_PLACEMENT_PASSAGES.length).toBe(5);

    const levels: EducationLevel[] = ["primary", "middle", "high", "university", "adult"];
    levels.forEach((lvl) => {
      const exam = SEED_PLACEMENT_EXAMS.find((e) => e.educationLevels.includes(lvl));
      expect(exam).toBeDefined();
      expect(exam?.status).toBe("published");
    });
  });

  it("Her başlangıç sınavında tam olarak 10 soru bulunmalıdır", () => {
    SEED_PLACEMENT_EXAMS.forEach((exam) => {
      const questions = SEED_PLACEMENT_QUESTIONS[exam.code];
      expect(questions).toBeDefined();
      expect(questions.length).toBe(10);
      expect(exam.questionCount).toBe(10);
    });
  });

  it("Her soruda tam olarak 4 seçenek (A, B, C, D) ve tek bir doğru cevap bulunmalıdır", () => {
    Object.values(SEED_PLACEMENT_QUESTIONS).forEach((questionList) => {
      questionList.forEach((q, idx) => {
        expect(q.options.length).toBe(4);
        expect(q.options.map((o) => o.id)).toEqual(["A", "B", "C", "D"]);
        // Seçenek metinleri boş olamaz
        q.options.forEach((opt) => {
          expect(opt.text.trim().length).toBeGreaterThan(0);
        });
        // Doğru cevap A, B, C veya D olmalıdır
        expect(["A", "B", "C", "D"]).toContain(q.correctOptionId);
        // Açıklama mevcut olmalıdır
        expect(q.explanation.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it("Öğrenciye sunulan sorularda doğru cevap anahtarı (correctOptionId) kesinlikle gizlenmelidir", async () => {
    const studentQuestions = await getStudentPlacementQuestions("ortaokul-baslangic-01");
    expect(studentQuestions.length).toBe(10);
    studentQuestions.forEach((sq) => {
      // @ts-ignore
      expect(sq.correctOptionId).toBeUndefined();
    });
  });

  it("Okuma süresi ile soru çözme süresi ayrı tutulmalı ve WPM sadece okuma süresiyle hesaplanmalıdır", () => {
    const wordCount = 180;
    const readingDurationSeconds = 60; // 1 dakika
    const questionDurationSeconds = 120; // 2 dakika soru çözdü

    // WPM yalnızca 60 saniye üzerinden hesaplanmalı
    const wpm = calculateWpm(wordCount, readingDurationSeconds);
    expect(wpm).toBe(180);

    // Eğer soru süresi yanlışlıkla eklenseydi (180 saniye): 180 / 3 = 60 WPM olurdu (YANLIŞ OLURDU)
    const wrongMergedWpm = calculateWpm(wordCount, readingDurationSeconds + questionDurationSeconds);
    expect(wrongMergedWpm).toBe(60);
    expect(wpm).not.toBe(wrongMergedWpm);
  });

  it("Değerlendirme motoru doğru, yanlış ve boş yanıtları doğru puanlamalıdır", async () => {
    const questions = SEED_PLACEMENT_QUESTIONS["ortaokul-baslangic-01"];
    // 8 doğru, 1 yanlış, 1 boş yanıt simülasyonu
    const userAnswers: Record<string, string> = {};
    for (let i = 0; i < 8; i++) {
      userAnswers[questions[i].id] = questions[i].correctOptionId;
    }
    // 9. soru yanlış
    const wrongOpt = questions[8].correctOptionId === "A" ? "B" : "A";
    userAnswers[questions[8].id] = wrongOpt;
    // 10. soru boş (userAnswers'a eklenmedi)

    const result = await evaluatePlacementAttempt({
      userId: "test-user-1",
      examCode: "ortaokul-baslangic-01",
      passageId: "pass-mid-01",
      readingDurationSeconds: 60,
      questionDurationSeconds: 90,
      userAnswers,
    });

    expect(result.attempt.correctCount).toBe(8);
    expect(result.attempt.incorrectCount).toBe(1);
    expect(result.attempt.unansweredCount).toBe(1);
    expect(result.attempt.comprehensionPercentage).toBe(80);
    expect(result.attempt.rawWpm).toBeGreaterThan(0);
    expect(result.attempt.readingDurationSeconds).toBe(60);
    expect(result.attempt.questionDurationSeconds).toBe(90);
  });

  it("Eğitim kademesinden bağımsız olarak yayımlanmış başlangıç sınavlarından rastgele birini seçmelidir", async () => {
    const random = vi.spyOn(Math, "random").mockReturnValue(0.999);
    try {
      const match = await getRandomPlacementExam();
      const eligibleExams = SEED_PLACEMENT_EXAMS.filter(
        (exam) =>
          exam.status === "published" &&
          (exam.learningStage === undefined || exam.learningStage === "placement_exam")
      );

      expect(match).not.toBeNull();
      expect(match?.exam.code).toBe(eligibleExams[eligibleExams.length - 1].code);
      expect(match?.passage.id).toBe(match?.exam.passageId);
      expect(match?.passage.wordCount).toBeGreaterThan(50);
    } finally {
      random.mockRestore();
    }
  });

  it("Kelime sayımı Türkçe karakterler, noktalama ve boşluklarla doğru çalışmalıdır", () => {
    const sampleText = "Ali, okula giderken arkadaşı Ayşe'yi gördü; birlikte neşeyle koştular.";
    const count = countTurkishWords(sampleText);
    expect(count).toBe(9);
    expect(countTurkishWords("")).toBe(0);
    expect(countTurkishWords("   ")).toBe(0);
  });

  it("Seçenek harf dağılımı (A, B, C, D) dengeli olmalı, tek bir seçeneğe yığılma olmamalıdır", () => {
    const totalByLetter: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    Object.values(SEED_PLACEMENT_QUESTIONS).forEach((questions) => {
      questions.forEach((q) => {
        totalByLetter[q.correctOptionId] = (totalByLetter[q.correctOptionId] || 0) + 1;
      });
    });

    // Toplam 50 sorunun dağılımında her şıktan en az 8 adet bulunmalıdır
    expect(totalByLetter["A"]).toBeGreaterThanOrEqual(8);
    expect(totalByLetter["B"]).toBeGreaterThanOrEqual(8);
    expect(totalByLetter["C"]).toBeGreaterThanOrEqual(8);
    expect(totalByLetter["D"]).toBeGreaterThanOrEqual(8);
  });
});
