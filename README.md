# AndaOku — Daha Bilinçli Oku, Daha İyi Anla

> **“Okuma hızını geliştir, anlamı kaybetme.”**

**AndaOku**, bireylerin okuma hızını, görsel dikkatini, kelime tanıma becerisini, okuma akıcılığını ve okuduğunu anlama düzeyini geliştirmek amacıyla tasarlanmış, araştırma temelli bir dijital öğrenme platformudur.

Platform, Google Firebase altyapısı (Firebase Authentication, Cloud Firestore, Firebase Storage) ve Next.js App Router ile geliştirilmiştir.

---

## 🚀 Hızlı Başlangıç

### 1. Gereksinimler
- Node.js v18+ veya v20+ (Tavsiye edilen: Node v24 LTS)
- npm veya pnpm

### 2. Bağımlılıkların Kurulması
```bash
cd c:/Users/ELİF/MyFirstFullStackApp/andaoku
npm install
```

### 3. Geliştirme Sunucusunun Başlatılması
```bash
npm run dev
```
Uygulama varsayılan olarak **http://localhost:3005** adresinde çalışmaya başlar.

---

## 🛠️ Teknoloji Mimarisi

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Görselleştirme:** Recharts (WPM Hız Değişimi, Anlama Puanı, Beceri Dağılım Grafikleri)
- **Veritabanı & Kimlik Doğrulama:** Google Cloud Firestore & Firebase Authentication
- **Yetkilendirme:** Rol tabanlı erişim (`learner`, `teacher`, `content_manager`, `admin`, `researcher`)
- **Güvenlik Kuralları:** `firestore.rules` (Default-deny prensibiyle yazılmış, öğrenci ve sınıf izolasyonu sağlayan güvenlik kuralları)
- **Test:** Vitest ile WPM, kelime sayımı, anlama puanı ve öneri motoru birim testleri

---

## 📚 10 Aşamalı Öğrenme Modülü

1. **Modül 1: Başlangıç Değerlendirmesi** — WPM ve okuduğunu anlama seviyesini tespit eder.
2. **Modül 2: Görsel Dikkat ve Tarama** — İnteraktif sembol arama matrisi oyunuyla göz koordinasyonunu güçlendirir.
3. **Modül 3: Hızlı Kelime Tanıma** — 200ms flaş kelime algılama (RSVP) çalışmaları.
4. **Modül 4: Kelime Gruplarıyla Okuma** — İkili ve üçlü bloklar halinde sıçrayarak okuma.
5. **Modül 5: Okuma Akıcılığı ve Ritim** — Geri dönüşleri önleyen sabit tempolu okuma seansları.
6. **Modül 6: Tarama ve Seçici Okuma** — Metinde tarih, sayı ve anahtar kavramları hızla bulma.
7. **Modül 7: Okuduğunu Anlama** — Ana fikir, çıkarım ve eleştirel analiz soruları.
8. **Modül 8: Bilişsel Okuma Stratejileri** — Okuma öncesi tahmin, okuma sırası soru üretme ve özetleme.
9. **Modül 9: Bütünleşik Okuma Laboratuvarı** — Tüm becerilerin birleştiği gerçek metin pratiği.
10. **Modül 10: Son ve Takip Değerlendirmesi** — Kalıcılık ve gelişim karşılaştırma raporu.

---

## 🔬 Bilimsel Ölçüm Standartları

- **Dakika Başına Kelime:** `WPM = KelimeSayısı / (OkumaSüresiSaniye / 60)`
- **Okuduğunu Anlama Puanı:** `AnlamaYüzdesi = (DoğruCevap / SoruSayısı) * 100`
- **Pedagojik İlke:** Okuma hızı ve okuduğunu anlama bağımsız olarak ölçülür. Kullanıcının anlama puanı düştüğünde, sistem hız artışını başarı saymaz ve anlama çalışmalarına öncelik verir.

---

## 🧪 Testleri Çalıştırma

```bash
npm test
```
Tüm birim ve kural testleri Vitest ile koşturulur.
