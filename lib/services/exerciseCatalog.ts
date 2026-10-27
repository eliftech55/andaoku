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
  point_tracking: {
    title: "Nokta Takibi",
    description: "Hareket eden noktayı başınızı oynatmadan gözlerinizle takip etme çalışması.",
    instructions: "Merkezdeki noktayı yalnızca gözlerinizle takip edin ve yön değişimlerine odaklanın.",
    targetSymbol: "●",
  },
  infinity_tracking: {
    title: "Sekiz Takibi",
    description: "Sonsuz işareti üzerinde hareket eden noktayı akıcı biçimde takip etme çalışması.",
    instructions: "Hareket eden noktayı gözlerinizle izleyin; başınızı sabit tutun.",
    targetSymbol: "●",
  },
  chunk_reading: {
    title: "Kelime Grubu Flaş",
    description: "Kelimeleri tek tek yerine anlamlı gruplar hâlinde algılama çalışması.",
    instructions: "Kısa süre gösterilen kelime grubunu okuyup ardından anlamını hatırlayın.",
    targetSymbol: "",
  },
  pacer_reading: {
    title: "Rehberli Satır Takibi",
    description: "Metin üzerinde düzenli hızda ilerleyen vurguyu takip etme çalışması.",
    instructions: "Vurgulanan kelime veya kelime grubunu geriye dönmeden takip edin.",
    targetSymbol: "",
  },
  schulte_table: {
    title: "Schulte Tablosu",
    description: "Sayıları sırayla bularak görsel tarama ve odaklanma çalışması.",
    instructions: "Sayıları 1’den başlayarak mümkün olduğunca hızlı sırayla seçin.",
    targetSymbol: "",
  },
  regression_prevention: {
    title: "Geri Dönüşü Engelleme",
    description: "Okuma sırasında geriye dönmeden ilerlemeyi destekleyen çalışma.",
    instructions: "Vurguyu takip edin; geride kalan kelimeler silikleşirken metni ileri doğru okuyun.",
    targetSymbol: "",
  },
  digit_memory: {
    title: "Rakam Dizisi Hafızası",
    description: "Rastgele sayı dizilerini kısa süreli bellekte tutma çalışması.",
    instructions: "Görünen sayı dizisini kaybolduktan sonra doğru sırayla girin.",
    targetSymbol: "",
  },
  word_memory: {
    title: "Kelime Listesi Hatırlama",
    description: "Farklı Türkçe kelimeleri kısa süreli bellekte tutma çalışması.",
    instructions: "Gösterilen kelimeleri hatırlayıp giriş alanına virgülle ayırarak yazın.",
    targetSymbol: "",
  },
  matching_cards: {
    title: "Eşleştirme Kartları",
    description: "Kart çiftlerini konumlarıyla hatırlama ve eşleştirme çalışması.",
    instructions: "Kartları ikişer açın ve aynı çiftleri mümkün olduğunca az hamlede bulun.",
    targetSymbol: "",
  },
  sequence_memory: {
    title: "Görsel Sıra Hafızası",
    description: "Işık dizilerini aynı sırayla tekrarlayarak çalışma belleğini geliştirme.",
    instructions: "Yanan kutuları aynı sırayla seçin; her başarılı turda dizi uzar.",
    targetSymbol: "",
  },
  passage_memory: {
    title: "Metin Parçası Hatırlama",
    description: "Farklı kısa metinleri okuyup ana bilgileri hatırlama çalışması.",
    instructions: "Metni dikkatle okuyun; gizlendikten sonra soruları yanıtlayın.",
    targetSymbol: "",
  },
  memory_palace: {
    title: "Hafıza Sarayı",
    description: "Kelimeleri ve nesneleri konumlarıyla ilişkilendirme çalışması.",
    instructions: "Konumlarda görünen nesneleri hatırlayın ve sorulan konumla eşleştirin.",
    targetSymbol: "",
  },
  n_back: {
    title: "Çift Görev Hafızası",
    description: "Güncel uyaranı önceki uyaranlarla karşılaştırarak çalışma belleğini geliştirme.",
    instructions: "Konumun veya harfin N adım önceki uyaranla eşleşip eşleşmediğini seçin.",
    targetSymbol: "",
  },
  visual_change: {
    title: "Neyin Değişti?",
    description: "Görsel düzen içindeki küçük değişiklikleri fark etme çalışması.",
    instructions: "İki görsel arasındaki değişen nesneyi seçin.",
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
