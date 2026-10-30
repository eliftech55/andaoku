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

### Gemini ile İçerik Üretimi

Yönetim panelindeki yapay zekâ destekli içerik üretimi, yalnızca sunucuda kullanılan bir Gemini API anahtarı gerektirir. `.env.example` dosyasındaki aşağıdaki satırı `.env.local` dosyanıza kendi anahtarınızla ekleyin:

```bash
GEMINI_API_KEY="your-gemini-api-key"
```

Bu değişkeni `NEXT_PUBLIC_` ile başlatmayın ve anahtarı istemci koduna eklemeyin. `.env.local` değişikliğinden sonra çalışan geliştirme sunucusunu durdurup yeniden başlatın. Vercel gibi bir dağıtım ortamında aynı değişkeni ilgili ortam (Production/Preview) ayarlarına ekleyip yeniden dağıtım yapın.

---

## 🛠️ Teknoloji Mimarisi

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Görselleştirme:** Recharts (WPM Hız Değişimi, Anlama Puanı, Beceri Dağılım Grafikleri)
- **Veritabanı & Kimlik Doğrulama:** Google Cloud Firestore & Firebase Authentication
- **Yetkilendirme:** Rol tabanlı erişim (`learner`, `teacher`, `content_manager`, `admin`, `researcher`)
- **Güvenlik Kuralları:** `firestore.rules` açık erişim kuralları içerir; sınıf bazlı öğretmen erişimi ve değerlendirme yanıtlarının gizliliği üretim öncesinde ayrıca sıkılaştırılmalıdır.
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
Vitest birim testlerini çalıştırır.

---

## 🔥 Firebase Kurulumu

Bu depo `andaoku` Firebase projesini varsayılan hedef olarak kullanır (`.firebaserc`). Komut çalıştırmadan önce hedefi `firebase projects:list` ile doğrulayın; üretim verileriyle ilgili komutlarda `--project andaoku` parametresini açıkça kullanın.

1. Firebase Console'da `andaoku` projesini açın ve Web uygulaması yapılandırmasını alın.
2. Authentication → Sign-in method bölümünde Email/Password girişini etkinleştirin.
3. Cloud Firestore'u **Standard / Production mode** ile oluşturun. Firestore konumu oluşturulduktan sonra değiştirilemez; bu uygulamanın veritabanı `europe-west3` (Frankfurt) konumunda oluşturulmuştur.
4. `.env.example` dosyasını `.env.local` olarak kopyalayıp altı `NEXT_PUBLIC_FIREBASE_*` değerini Web uygulaması ayarlarıyla doldurun. `.env.local` dosyasını Git'e eklemeyin.
5. Firebase CLI ile giriş yapın ve kuralları/indeksleri yayınlayın:

   ```bash
   firebase login
   firebase projects:list
   firebase deploy --only firestore:rules,firestore:indexes --project andaoku
   ```

6. Vercel'de aynı altı `NEXT_PUBLIC_FIREBASE_*` değişkenini Production ve Preview ortamlarına ekleyip yeni deployment oluşturun.
7. Uygulama yapılandırması, kurallar ve indeksler doğrulanmadan Firebase bağlantısının üretimde çalıştığını varsaymayın.

### Yerel Firebase Emulator'ları

Auth ve Firestore Emulator'ları `firebase.json` içinde tanımlıdır. Test verilerini canlı projeye göndermemek için yerel geliştirmede `demo-andaoku` gibi `demo-` ile başlayan bir proje kimliği kullanın:

```bash
firebase emulators:start --only auth,firestore --project demo-andaoku
```

Emulator kullanımı uygulamada ayrıca etkinleştirilmelidir; canlı Firebase ayarları emulator bağlantısına otomatik yönlendirilmez.

### Firebase Storage

Uygulamanın şu an Storage'a bağlı bir kullanıcı akışı yoktur; bu nedenle Storage bucket'ı etkinleştirilmemiştir. Dosya yükleme özelliği eklenecekse Firebase Storage kurulumu ve gerekebilecek Blaze faturalandırma planı önce ayrıca değerlendirilmelidir.
