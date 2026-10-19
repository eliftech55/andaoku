import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Zap,
  Eye,
  Sparkles,
  Activity,
  BrainCircuit,
  BookOpenCheck,
  Compass,
  LineChart,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

export default function OzelliklerPage() {
  const modulesList = [
    {
      title: "Hızlı Okuma Çalışmaları",
      icon: Zap,
      desc: "Dakika başına okunan kelime sayısını (WPM) kademeli ve güvenli bir ritimde artıran, satır başı ve sonlarındaki gereksiz göz duraklamalarını azaltan egzersizler.",
    },
    {
      title: "Görsel Dikkat ve Tarama",
      icon: Eye,
      desc: "Çevresel görüş alanını genişletme, sembol matrisleri üzerinde hedef arama ve göz kaslarının odaklanma koordinasyonunu güçlendirme etkinlikleri.",
    },
    {
      title: "Hızlı Kelime Tanıma",
      icon: Sparkles,
      desc: "Kelimeleri heceleme refleksini aşarak, kelimeyi biçimsel ve anlamsal olarak anında kavrayan flaş gösterim (RSVP) çalışmaları.",
    },
    {
      title: "Okuma Akıcılığı ve Ritim",
      icon: Activity,
      desc: "Metin üzerinde geri dönüşleri (regresyon) engelleyen, ritmik ve akıcı okuma temposunu içselleştiren paragraf ve kısa metin alıştırmaları.",
    },
    {
      title: "Okuduğunu Derinlemesine Anlama",
      icon: BrainCircuit,
      desc: "Ana fikir bulma, yardımcı düşünceleri tespit etme, metin içi neden-sonuç bağları kurma ve eleştirel çıkarım yapma soruları.",
    },
    {
      title: "Bilişsel Okuma Stratejileri",
      icon: BookOpenCheck,
      desc: "Okuma öncesinde tahmin yürütme, başlık ve alt başlıklardan yararlanma, soru üreterek okuma ve sonrasında zihinsel özetleme teknikleri.",
    },
    {
      title: "Kişiselleştirilmiş Öğrenme Rotası",
      icon: Compass,
      desc: "Öğrencinin güçlü ve zayıf becerilerini değerlendirerek ona en uygun bir sonraki etkinliği öneren kural tabanlı pedagojik motor.",
    },
    {
      title: "Bilimsel Gelişim Grafikleri",
      icon: LineChart,
      desc: "Recharts tabanlı WPM ve anlama puanı çizgi grafikleri, beceri dağılım çubukları ve başlangıç-son test karşılaştırma raporları.",
    },
    {
      title: "Öğretmen ve Sınıf Yönetim Paneli",
      icon: GraduationCap,
      desc: "Sınıf oluşturma, öğrenci davet etme, okuma görevleri ve ödev atama, sınıf düzeyinde özet analizleri dışa aktarma araçları.",
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-6xl space-y-16">
      <div className="text-center space-y-4">
        <Badge variant="amber">Özellikler & Kabiliyetler</Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold font-serif text-charcoal">
          AndaOku'nun Bilişsel Araç Seti
        </h1>
        <p className="text-base text-charcoal-muted max-w-2xl mx-auto leading-relaxed">
          Platformumuz, hızlı okumayı yalnızca bir hız gösterisi olarak değil, anlama ve kavrama becerisiyle bütünleşik bir okuma kültürü olarak tasarlar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modulesList.map((m, idx) => {
          const Icon = m.icon;
          return (
            <Card key={idx} className="border-sage-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 mb-3">
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold font-serif">{m.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-charcoal-muted leading-relaxed">{m.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-3xl bg-ivory-warm border border-sage-300 p-8 sm:p-12 text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-charcoal">
          Bu Özellikleri Kendi Okuma Seanslarınızda Deneyin
        </h2>
        <p className="text-sm text-charcoal-muted max-w-md mx-auto">
          Okuma laboratuvarını başlatarak standart, blok ve RSVP modlarını hemen test edebilirsiniz.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/panel/okuma-laboratuvari">
            <Button size="lg" variant="amber" className="font-bold">
              Okuma Laboratuvarına Git
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
