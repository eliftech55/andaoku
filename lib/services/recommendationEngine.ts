/**
 * AndaOku — Kural Tabanlı Kişiselleştirilmiş Öğrenme ve Öneri Motoru
 * Bilimsel, açıklanabilir ve yapılandırılabilir pedagojik kurallara dayanır.
 */

import { AssessmentResult, UserProgress, LearningModule, Activity } from "../types";

export interface LearningRecommendation {
  status: "insufficient_data" | "needs_comprehension" | "needs_fluency" | "balanced_progress" | "ready_for_next";
  title: string;
  rationale: string;
  recommendedModuleId: string;
  recommendedActivityId?: string;
  suggestedAction: string;
  priorityScore: number;
}

export interface RecommendationContext {
  assessmentResults: AssessmentResult[];
  userProgressList: UserProgress[];
  modules: LearningModule[];
  activities: Activity[];
}

/**
 * Kullanıcı geçmişine göre kişiselleştirilmiş bir sonraki adım önerisi üretir.
 */
export function generateLearningRecommendation(context: RecommendationContext): LearningRecommendation {
  const { assessmentResults, userProgressList, modules } = context;

  // 1. Veri yetersizliği kontrolü
  if (!assessmentResults || assessmentResults.length === 0) {
    return {
      status: "insufficient_data",
      title: "Başlangıç Değerlendirmesini Tamamlayın",
      rationale: "Öğrenme yolunuzun kişiselleştirilebilmesi için öncelikle okuma hızı ve anlama düzeyinizi ölçen Başlangıç Değerlendirmesini tamamlamanız gerekmektedir.",
      recommendedModuleId: "modul-1",
      recommendedActivityId: "act-pretest-1",
      suggestedAction: "Başlangıç Seviye Tespit Sınavını Başlat",
      priorityScore: 100,
    };
  }

  // En son değerlendirme ve oturum
  const latestResult = assessmentResults[0]; // createdAt'e göre sıralı varsayılır
  const averageComprehension =
    assessmentResults.reduce((acc, curr) => acc + curr.comprehensionScore, 0) / assessmentResults.length;

  // 2. Anlama puanı hedefin altındaysa (Örn: <%65)
  // Kural: Anlama zayıfken hız artışı başarısızlık sayılır, anlama güçlendirilmelidir.
  if (latestResult.comprehensionScore < 65 || averageComprehension < 65) {
    return {
      status: "needs_comprehension",
      title: "Okuduğunu Anlama ve Çıkarım Çalışması",
      rationale: `Son anlama puanınız %${latestResult.comprehensionScore} seviyesinde. Okuma hızını yükseltirken anlam kaybı yaşamamak için metin içi anahtar kelimelere ve ana fikre odaklanmalısınız.`,
      recommendedModuleId: "modul-7",
      recommendedActivityId: "act-comp-1",
      suggestedAction: "Ana Fikir ve Çıkarım Alıştırmalarına Başla",
      priorityScore: 90,
    };
  }

  // 3. Hız artışı var ancak anlama düşüş eğilimindeyse (Sonuç sayısı >= 2)
  if (assessmentResults.length >= 2) {
    const prevResult = assessmentResults[1];
    if (latestResult.wpm > prevResult.wpm * 1.15 && latestResult.comprehensionScore < prevResult.comprehensionScore - 15) {
      return {
        status: "needs_comprehension",
        title: "Hız ve Anlama Dengesini Sağlama",
        rationale: "Okuma hızınızda artış görülürken anlama puanınızda düşüş tespit edildi. Okuma hızını geçici olarak sabitleyip metin yapısını kavramaya öncelik verilmelidir.",
        recommendedModuleId: "modul-8",
        recommendedActivityId: "act-strat-1",
        suggestedAction: "Okuma Öncesi ve Sonrası Stratejilerini Uygula",
        priorityScore: 85,
      };
    }
  }

  // 4. Anlama yüksek (%80+) ancak hız yavaşsa (WPM < 160)
  if (latestResult.comprehensionScore >= 80 && latestResult.wpm < 160) {
    return {
      status: "needs_fluency",
      title: "Kelime Gruplarıyla Okuma ve Akıcılık",
      rationale: `Anlama puanınız mükemmel (%${latestResult.comprehensionScore}), ancak dakikada ${latestResult.wpm} kelime hızındasınız. Kelimeleri tek tek okumak yerine 2'li ve 3'lü gruplar halinde algılama becerisi kazanabilirsiniz.`,
      recommendedModuleId: "modul-4",
      recommendedActivityId: "act-chunk-1",
      suggestedAction: "Göz Sıçrama ve Blok Okuma Alıştırmasına Başla",
      priorityScore: 80,
    };
  }

  // 5. Tamamlanmamış veya devam eden modül kontrolü
  const inProgress = userProgressList.find((p) => p.status === "in_progress");
  if (inProgress) {
    const activeModule = modules.find((m) => m.id === inProgress.moduleId);
    return {
      status: "balanced_progress",
      title: `${activeModule ? activeModule.title : "Mevcut Modüle"} Devam Edin`,
      rationale: "Başlamış olduğunuz modülü başarıyla tamamlayarak bir sonraki seviyeye geçebilirsiniz.",
      recommendedModuleId: inProgress.moduleId,
      recommendedActivityId: inProgress.activityId,
      suggestedAction: "Kaldığınız Yerden Devam Edin",
      priorityScore: 70,
    };
  }

  // 6. Sıradaki kilitli olmayan modülü bulma
  const completedModuleIds = new Set(
    userProgressList.filter((p) => p.status === "completed").map((p) => p.moduleId)
  );

  const nextModule = modules.find((m) => {
    if (completedModuleIds.has(m.id)) return false;
    // Ön koşulları tamamlanmış mı?
    return m.prerequisites.every((prereq) => completedModuleIds.has(prereq));
  });

  if (nextModule) {
    return {
      status: "ready_for_next",
      title: nextModule.title,
      rationale: `${nextModule.description} Bu modülün ön koşullarını başarıyla tamamladınız.`,
      recommendedModuleId: nextModule.id,
      suggestedAction: "Modülü Başlat",
      priorityScore: 60,
    };
  }

  // 7. Genel dengeli ilerleme tavsiyesi
  return {
    status: "balanced_progress",
    title: "Bütünleşik Okuma Pratiği",
    rationale: "Tüm temel modülleri tamamladınız. Kazanımlarınızı korumak için güncel makaleler ve edebi metinlerle düzenli okuma seansları yapın.",
    recommendedModuleId: "modul-9",
    suggestedAction: "Bütünleşik Okuma Laboratuvarına Git",
    priorityScore: 50,
  };
}
