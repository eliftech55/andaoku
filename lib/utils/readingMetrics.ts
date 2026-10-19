/**
 * AndaOku — Okuma Ölçüm ve Metrik Hesaplama Motoru
 * Bilimsel standartlara uygun kelime sayımı, WPM ve anlama puanı hesaplamaları.
 */

/**
 * Türkçe metinler için güvenilir kelime sayımı fonksiyonu.
 * Fazladan boşlukları, satır sonlarını ve noktalama işaretlerini doğru işler.
 */
export function countTurkishWords(text: string | null | undefined): number {
  if (!text || typeof text !== "string") {
    return 0;
  }

  // Fazladan boşlukları ve satır sonlarını temizle
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return 0;
  }

  // Kelime sınırlarını belirle (boşluklar, tablar, yeni satırlar)
  const tokens = trimmed.split(/[\s\r\n\t]+/);

  // Yalnızca alfanümerik veya anlamlı harf içeren belirteçleri say
  const validWords = tokens.filter((token) => {
    // Sadece noktalama işaretlerinden oluşan token'ları çıkar (örn: "...", "—", ",")
    return /[a-zA-Z0-9çÇğĞıİöÖşŞüÜ]/.test(token);
  });

  return validWords.length;
}

/**
 * Dakika başına okunan kelime sayısı (WPM) hesabı.
 * Formül: WPM = kelimeSayisi / (okumaSuresiSaniye / 60)
 * Süre 0 veya negatifse 0 döner.
 */
export function calculateWpm(wordCount: number, durationSeconds: number): number {
  if (!wordCount || wordCount <= 0 || !durationSeconds || durationSeconds <= 0) {
    return 0;
  }

  const minutes = durationSeconds / 60;
  const wpm = Math.round(wordCount / minutes);
  return Math.max(0, wpm);
}

/**
 * Okuduğunu anlama puanı hesabı.
 * Formül: AnlamaYüzdesi = (DoğruCevapSayisi / PuanlanabilirSoruSayisi) * 100
 * Puanlanabilir soru sayısı 0 ise 0 döner.
 */
export function calculateComprehensionScore(
  correctCount: number,
  gradableQuestionCount: number
): number {
  if (
    typeof correctCount !== "number" ||
    typeof gradableQuestionCount !== "number" ||
    gradableQuestionCount <= 0 ||
    correctCount < 0
  ) {
    return 0;
  }

  const percentage = (correctCount / gradableQuestionCount) * 100;
  // 0 ile 100 arasında sınırla ve tam sayıya yuvarla
  return Math.min(100, Math.max(0, Math.round(percentage)));
}

/**
 * Saniye cinsinden süreyi Türkçe okunabilir formata dönüştürür.
 * Örn: 125 -> "2 dk 5 sn" veya "02:05"
 */
export function formatDuration(seconds: number, format: "short" | "digital" = "short"): string {
  if (!seconds || seconds <= 0) {
    return format === "digital" ? "00:00" : "0 sn";
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  if (format === "digital") {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(mins)}:${pad(secs)}`;
  }

  if (mins === 0) {
    return `${secs} sn`;
  }
  return secs === 0 ? `${mins} dk` : `${mins} dk ${secs} sn`;
}

/**
 * WPM ve Anlama puanına göre geri bildirim ve gelişim önerisi üretir.
 * Okuma hızı tek başına başarı sayılmaz; anlama ile dengeli olmalıdır.
 */
export function evaluateReadingPerformance(wpm: number, comprehensionScore: number) {
  let speedCategory: "yavas" | "orta" | "iyi" | "cok_iyi" = "orta";
  let comprehensionCategory: "zayif" | "gelistirilmeli" | "iyi" | "mukemmel" = "iyi";

  if (wpm < 140) speedCategory = "yavas";
  else if (wpm <= 220) speedCategory = "orta";
  else if (wpm <= 320) speedCategory = "iyi";
  else speedCategory = "cok_iyi";

  if (comprehensionScore < 50) comprehensionCategory = "zayif";
  else if (comprehensionScore < 70) comprehensionCategory = "gelistirilmeli";
  else if (comprehensionScore < 90) comprehensionCategory = "iyi";
  else comprehensionCategory = "mukemmel";

  let feedback = "";
  let recommendation = "";

  if (comprehensionCategory === "zayif" || comprehensionCategory === "gelistirilmeli") {
    feedback = "Okuma hızınız iyi olsa bile, anlamadan hızlı okumak hedeflenen beceriyi sağlamaz.";
    recommendation = "Okuma hızınızı biraz düşürerek anahtar kelimelere ve ana fikre odaklanın. Modül 7 (Okuduğunu Anlama) etkinliklerini tekrarlayın.";
  } else if (speedCategory === "yavas" && comprehensionScore >= 80) {
    feedback = "Anlama düzeyiniz mükemmel! Artık kelime gruplarıyla okuma teknikleriyle hızınızı güvenle artırabilirsiniz.";
    recommendation = "Modül 4 (Kelime Gruplarıyla Okuma) ve Modül 2 (Görsel Dikkat) alıştırmalarıyla göz kaslarınızı ve tarama hızınızı geliştirin.";
  } else if (speedCategory === "iyi" && comprehensionScore >= 80) {
    feedback = "Tebrikler! Hem hız hem anlama puanınız dengeli ve yüksek bir seviyede.";
    recommendation = "Bütünleşik okuma uygulamaları ve ileri düzey analitik metinlerle akıcılığınızı pekiştirin.";
  } else {
    feedback = "İstikrarlı bir okuma performansı sergilediniz.";
    recommendation = "Düzenli günlük 15 dakikalık okuma çalışmalarıyla hem hızınızı hem anlama oranınızı kademeli olarak yükseltebilirsiniz.";
  }

  return {
    speedCategory,
    comprehensionCategory,
    feedback,
    recommendation,
  };
}
