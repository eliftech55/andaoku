import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function KullanimKosullariPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl space-y-8">
      <div className="space-y-2">
        <Badge variant="amber">Hukuki Şartlar</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-charcoal">
          Kullanım Koşulları
        </h1>
        <p className="text-xs text-charcoal-muted">
          Son Güncelleme: 19 Ekim 2026 | AndaOku Dijital Öğrenme Platformu Hizmet Şartları
        </p>
      </div>

      <Card className="border-sage-200 bg-white">
        <CardContent className="p-8 space-y-6 text-xs sm:text-sm text-charcoal-muted leading-relaxed">
          <section className="space-y-2">
            <h3 className="text-base font-bold text-charcoal">1. Hizmetin Kapsamı</h3>
            <p>
              AndaOku, bireylerin okuma hızını, görsel tarama ve okuduğunu anlama becerilerini desteklemek amacıyla geliştirilmiş
              eğitsel bir web platformudur. Platformda sunulan metinler, sorular ve ölçüm araçları bilgilendirme ve kişisel gelişim
              amaçlıdır.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-charcoal">2. Ölçüm Sınırlılıkları ve Bilimsel Beyan</h3>
            <p>
              Platformda hesaplanan dakika başına kelime (WPM) ve anlama yüzdeleri, standartlaştırılmış tıbbi veya psikometrik bir
              tanı aracı değildir. Okuma hızı; kişinin yorgunluk düzeyi, ortam aydınlatması, metnin zorluk derecesi ve ilgi alanına
              göre dalgalanma gösterebilir. Tek bir ölçüm kalıcı bilişsel yeterlik olarak kabul edilemez.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-charcoal">3. Fikri Mülkiyet ve İçerik Hakları</h3>
            <p>
              AndaOku platformunda yer alan özgün metinler, algoritmalar, tasarım bileşenleri, logolar ve yazılım kodları telif
              haklarıyla korunmaktadır. Yazılı izin alınmaksızın kopyalanamaz veya ticari amaçla çoğaltılamaz.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-charcoal">4. Kullanıcı Sorumlulukları</h3>
            <p>
              Kullanıcılar hesap güvenliklerini korumakla yükümlüdür. Platform sistemlerine yetkisiz erişim sağlamaya çalışmak,
              diğer kullanıcıların verilerine müdahale etmek veya otomatik veri kazıma (scraping) araçları çalıştırmak yasaktır.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
