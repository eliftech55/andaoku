import { describe, it, expect } from "vitest";
import {
  countTurkishWords,
  calculateWpm,
  calculateComprehensionScore,
  evaluateReadingPerformance,
} from "../lib/utils/readingMetrics";
import { generateLearningRecommendation } from "../lib/services/recommendationEngine";
import { SEED_MODULES, SEED_ACTIVITIES } from "../lib/services/seedData";

describe("AndaOku — Okuma Ölçüm ve Metrik Testleri", () => {
  it("Türkçe kelime sayımını noktalama ve boşluklara rağmen doğru yapmalıdır", () => {
    expect(countTurkishWords("")).toBe(0);
    expect(countTurkishWords("   ")).toBe(0);
    expect(countTurkishWords("Daha bilinçli oku, daha iyi anla.")).toBe(6);
    expect(countTurkishWords("Ağaçlar, mikoriza adı verilen... yer altı ağıyla konuşur!")).toBe(8);
  });

  it("WPM (Dakika Başına Kelime) formülünü doğru hesaplamalıdır", () => {
    // 200 kelime 60 saniyede = 200 WPM
    expect(calculateWpm(200, 60)).toBe(200);
    // 100 kelime 30 saniyede = 200 WPM
    expect(calculateWpm(100, 30)).toBe(200);
    // 150 kelime 45 saniyede = 200 WPM
    expect(calculateWpm(150, 45)).toBe(200);
    // Geçersiz süre veya kelime kontrolü
    expect(calculateWpm(0, 60)).toBe(0);
    expect(calculateWpm(100, 0)).toBe(0);
    expect(calculateWpm(100, -10)).toBe(0);
  });

  it("Okuduğunu anlama puanını doğru yüzde olarak hesaplamalıdır", () => {
    expect(calculateComprehensionScore(4, 4)).toBe(100);
    expect(calculateComprehensionScore(3, 4)).toBe(75);
    expect(calculateComprehensionScore(2, 4)).toBe(50);
    expect(calculateComprehensionScore(0, 4)).toBe(0);
    expect(calculateComprehensionScore(1, 0)).toBe(0);
  });

  it("Düşük anlama puanında tek başına hızı önermemeli, anlama çalışması tavsiye etmelidir", () => {
    const evalResult = evaluateReadingPerformance(300, 40);
    expect(evalResult.comprehensionCategory).toBe("zayif");
    expect(evalResult.feedback).toContain("anlamadan hızlı okumak");
  });

  it("Kişiselleştirilmiş öneri motoru veri yokken Başlangıç Değerlendirmesini önermelidir", () => {
    const rec = generateLearningRecommendation({
      assessmentResults: [],
      userProgressList: [],
      modules: SEED_MODULES,
      activities: SEED_ACTIVITIES,
    });
    expect(rec.status).toBe("insufficient_data");
    expect(rec.recommendedModuleId).toBe("modul-1");
  });
});
