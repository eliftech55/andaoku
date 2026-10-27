import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Target,
  Route,
  Activity,
  BookOpen,
  BarChart3,
  Flag,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";

export default function NasilCalisirPage() {
  const steps = [
    {
      num: "01",
      title: "Başlangıç Değerlendirmesi",
      icon: Target,
      desc: "Platforma katıldığınızda başlangıç seviyenize uygun bir metinle ilk okuma seansınızı yaparsınız. Sistem kelime sayısını, başlangıç-bitiş süresini ve ardından yöneltilen çoktan seçmeli anlama sorularını değerlendirerek ham WPM ve anlama yüzdenizi tespit eder.",
      notes: "Hız ve anlama bağımsız olarak ölçülür. Başlangıç puanı, sonraki tüm gelişiminizin referans noktasıdır.",
    },
    {
      num: "02",
      title: "Kişisel Öğrenme Yolunun Oluşturulması",
      icon: Route,
      desc: "Ölçüm sonuçlarınıza göre kural tabanlı öneri motorumuz size özel bir eğitim rotası çizer. Eğer anlama oranınız yüksek fakat hızınız düşükse blok okuma ve görsel tarama modüllerine; hızınız yüksek fakat anlama puanınız düşükse ana fikir ve çıkarım modüllerine öncelik verilir.",
      notes: "Sistem sabit bir kalıbı herkese zorunlu kılmaz; zayıf ve güçlü yönlerinize göre şekillenir.",
    },
    {
      num: "03",
      title: "Aşamalı Etkinlikler",
      icon: Activity,
      desc: "Göz kaslarını esneten görsel dikkat matrisleri, anlık beliren flaş kelimeler (RSVP) ve ikili/üçlü kelime gruplarını algılama alıştırmalarıyla gözün satır üzerindeki sıçrama (saccade) becerisi sistematik olarak geliştirilir.",
      notes: "Göz hareketlerinin doğrudan ekran üzerinden kusursuz ölçüldüğü iddia edilmez; hedef odaklanma ve tarama refleksini güçlendirmektir.",
    },
    {
      num: "04",
      title: "Okuma ve Anlama Çalışmaları",
      icon: BookOpen,
      desc: "Geliştirilen tarama becerileri gerçek edebi, bilgilendirici ve akademik metinler üzerinde denenir. Kullanıcı metni okurken duraklatma, devam etme ve yazı tipi/satır aralığı gibi ergonomik tercihlerini yönetebilir.",
      notes: "Her okuma seansı, metin yapısına uygun anlama sorularıyla doğrulanır.",
    },
    {
      num: "05",
      title: "İlerleme Ölçümü ve Analiz",
      icon: BarChart3,
      desc: "Her çalışma oturumu Firestore veritabanına kaydedilir. Kullanıcı gelişim panelinde okuma hızı ve anlama puanının zaman içindeki grafiklerini inceler. Öğretmenler de sınıflarındaki öğrencilerin gelişim eğrilerini tek panelden izleyebilir.",
      notes: "Zorluk seviyeleri farklı metinlerin doğrudan karşılaştırılmasının sınırlılıkları raporlarda açıkça belirtilir.",
    },
    {
      num: "06",
      title: "Yeni Hedeflerin Belirlenmesi",
      icon: Flag,
      desc: "Modül tamamlandıkça bir sonraki modülün kilidi açılır. Ara ve son değerlendirmelerle kalıcı öğrenme takip edilir; öğrenciye yeni ve daha zorlu metin hedefleri sunulur.",
      notes: "Tek bir ölçümden kalıcı başarı sonucu çıkarılmaz; süreklilik ve istikrar esas alınır.",
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-5xl space-y-16">
      <div className="text-center space-y-4">
        <Badge variant="amber">Öğrenme Metodolojisi</Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold font-serif text-charcoal">
          AndaOku Nasıl Çalışır?
        </h1>
        <p className="text-base text-charcoal-muted max-w-2xl mx-auto leading-relaxed">
          Platformumuz, bilimsel olarak kanıtlanmamış abartılı başarı vaatleri yerine; bilişsel psikoloji, görsel dikkat ve ölçme-değerlendirme standartlarına dayalı 6 adımlı bir yaklaşım benimser.
        </p>
      </div>

      {/* 6 Adım Listesi */}
      <div className="space-y-8">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <Card key={idx} className="border-sage-200 overflow-hidden hover:border-brand-500 transition-colors">
              <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 font-mono text-xl font-bold">
                  {s.num}
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xl font-bold font-serif text-charcoal flex items-center gap-2">
                      <Icon className="h-5 w-5 text-amber-600" />
                      {s.title}
                    </h3>
                  </div>
                  <p className="text-sm text-charcoal-muted leading-relaxed">{s.desc}</p>
                  <div className="p-3 rounded-xl bg-ivory-warm border border-sage-200 text-xs text-charcoal-muted flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Pedagojik Not:</strong> {s.notes}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bilimsel Dürüstlük Çerçevesi */}
      <div className="rounded-3xl bg-sage-50 border border-sage-200 p-8 space-y-3">
        <div className="flex items-center gap-2 text-brand-900 font-bold text-base">
          <ShieldCheck className="h-5 w-5 text-brand-700" />
          <span>AndaOku Bilimsel Sorumluluk İlkeleri</span>
        </div>
        <p className="text-xs sm:text-sm text-charcoal leading-relaxed">
          AndaOku olarak '1 haftada 10 kat hızlı okuma' gibi gerçek dışı ve akademik temeli bulunmayan iddialarda bulunmuyoruz. Okuma hızı, bireyin kelime haznesi, metnin kavramsal yoğunluğu ve okuma amacı ile doğrudan ilişkilidir. Hedefimiz, bireyin gereksiz göz duraklamalarını azaltması, metin yapısını daha iyi kavraması ve okuduğunu derinlemesine anlamasıdır.
        </p>
      </div>

      {/* Başlama Çağrısı */}
      <div className="text-center pt-4">
        <Link href="/kayit">
          <Button size="lg" variant="primary" className="px-8 font-bold">
            Başlangıç Değerlendirmenizi Yapın
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
