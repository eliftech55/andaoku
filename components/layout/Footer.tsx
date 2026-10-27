import React from "react";
import Link from "next/link";
import { BookOpen, ShieldCheck, HeartHandshake } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-sage-200 bg-ivory-warm text-charcoal">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Kolon 1: Marka ve Misyon */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-amber-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-xl text-brand-950 font-serif">
                Anda<span className="text-amber-600">Oku</span>
              </span>
            </div>
            <p className="text-sm font-medium text-brand-900 font-serif italic">
              “Daha bilinçli oku, daha iyi anla.”
            </p>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Araştırma temelli dijital öğrenme platformu. Okuma hızını ve görsel dikkat becerilerini
              geliştirirken okuduğunu anlama derinliğini korumayı hedefler.
            </p>
          </div>

          {/* Kolon 2: Hızlı Bağlantılar */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-brand-900 uppercase tracking-wider">Keşfet</h4>
            <ul className="space-y-2 text-sm text-charcoal-muted">
              <li>
                <Link href="/" className="hover:text-brand-700 transition-colors">
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link href="/nasil-calisir" className="hover:text-brand-700 transition-colors">
                  Nasıl Çalışır? (6 Adım)
                </Link>
              </li>
              <li>
                <Link href="/ozellikler" className="hover:text-brand-700 transition-colors">
                  Öğrenme Modülleri
                </Link>
              </li>
              <li>
                <Link href="/panel/kutuphane" className="hover:text-brand-700 transition-colors">
                  Okuma Kütüphanesi
                </Link>
              </li>
              <li>
                <Link href="/panel/okuma-laboratuvari" className="hover:text-brand-700 transition-colors">
                  Okuma Laboratuvarı
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolon 3: Hedef Kitle & Roller */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-brand-900 uppercase tracking-wider">Hedef Gruplar</h4>
            <ul className="space-y-2 text-sm text-charcoal-muted">
              <li>Kolay Seviye İçerikler</li>
              <li>Orta Seviye İçerikler</li>
              <li>Zor Seviye İçerikler</li>
              <li>
                <Link href="/ogretmen" className="hover:text-brand-700 transition-colors font-medium">
                  Öğretmen ve Sınıf Takibi
                </Link>
              </li>
              <li>
                <Link href="/yonetim/arastirma" className="hover:text-brand-700 transition-colors">
                  Araştırmacı Veri Portalı
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolon 4: Güvenlik, Gizlilik & KVKK */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-brand-900 uppercase tracking-wider">Güvenlik ve Yasal</h4>
            <ul className="space-y-2 text-sm text-charcoal-muted">
              <li>
                <Link href="/gizlilik" className="hover:text-brand-700 transition-colors flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  KVKK ve Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link href="/kullanim-kosullari" className="hover:text-brand-700 transition-colors">
                  Kullanım Koşulları
                </Link>
              </li>
              <li>
                <span className="text-xs text-charcoal-muted flex items-center gap-1">
                  <HeartHandshake className="h-3.5 w-3.5 text-amber-600" />
                  Veli ve Öğrenci Hakları
                </span>
              </li>
            </ul>
            <div className="rounded-xl border border-sage-200 bg-white/70 p-3 text-[11px] text-charcoal-muted leading-tight">
              <span className="font-semibold text-brand-900">Bilimsel Hatırlatma:</span> Ham hız ölçümleri metin zorluğuna göre değişir; okuduğunu anlama ile birlikte değerlendirilmelidir.
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-sage-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-charcoal-muted gap-4">
          <p>© {new Date().getFullYear()} AndaOku. Tüm hakları saklıdır. Google Firebase altyapısıyla desteklenmektedir.</p>
          <p className="italic">“Okuma hızını geliştir, anlamı kaybetme.”</p>
        </div>
      </div>
    </footer>
  );
}
