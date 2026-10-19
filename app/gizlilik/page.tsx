import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Lock, FileText } from "lucide-react";

export default function GizlilikPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl space-y-8">
      <div className="space-y-2">
        <Badge variant="amber">Yasal Bilgilendirme</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-charcoal">
          KVKK ve Gizlilik Politikası
        </h1>
        <p className="text-xs text-charcoal-muted">
          Son Güncelleme: 19 Ekim 2026 | 6698 Sayılı Kişisel Verilerin Korunması Kanunu Kapsamında Aydınlatma Metni
        </p>
      </div>

      <Card className="border-sage-200 bg-white">
        <CardContent className="p-8 space-y-6 text-xs sm:text-sm text-charcoal-muted leading-relaxed">
          <section className="space-y-2">
            <h3 className="text-base font-bold text-charcoal">1. Veri Sorumlusu</h3>
            <p>
              AndaOku platformu olarak (“Platform”), 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca,
              öğrencilerimizin, öğretmenlerimizin ve bireysel okurlarımızın kişisel verilerini korumayı ve gizliliğini
              sağlamayı en üst düzey öncelik kabul ediyoruz.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-charcoal">2. İşlenen Kişisel Veriler ve İşleme Amaçları</h3>
            <p>
              Platformumuzda yalnızca eğitsel hizmetin sunulabilmesi için zorunlu olan veriler işlenir:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Kimlik Bilgileri:</strong> Ad ve soyad (kullanıcı profili ve sınıf tanımlamaları için).</li>
              <li><strong>İletişim Bilgileri:</strong> E-posta adresi (hesap güvenliği, parola sıfırlama ve bildirimler için).</li>
              <li><strong>Eğitsel ve Performans Verileri:</strong> Okuma süresi, WPM (okuma hızı), soru yanıtlama oranları ve modül tamamlama yüzdeleri.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-charcoal">3. Çocukların ve Küçük Yaştaki Öğrencilerin Korunması</h3>
            <p>
              İlkokul ve ortaokul düzeyindeki reşit olmayan öğrencilerin üyelik süreçlerinde veli / vasinin bilgilendirilmesi
              ve onayı esastır. Platformumuz çocuk kullanıcıların ticari veya reklam amaçlı profilini çıkarmaz; verilerini
              üçüncü şahıslara aktarmaz.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-charcoal">4. Araştırma Verilerinin Anonimleştirilmesi</h3>
            <p>
              Eğitim bilimleri ve okuma becerileri üzerine yürütülen akademik araştırmalara katkı sunmak amacıyla, kullanıcı
              kimlikleri SHA-256 kriptografik yöntemleriyle tek yönlü olarak anonimleştirilir. Anonimleştirilmiş veri setlerinde
              ad, soyad, e-posta veya telefon gibi hiçbir doğrudan tanımlayıcı yer almaz.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-charcoal">5. Kullanıcı Hakları ve Hesap Silme</h3>
            <p>
              Kullanıcılar profil sayfaları üzerinden her zaman bilgilerini güncelleyebilir veya hesaplarının ve ilişkili tüm
              verilerinin kalıcı olarak silinmesini talep edebilir. Silme talepleri yasal saklama yükümlülükleri haricinde
              30 gün içerisinde yerine getirilir.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
