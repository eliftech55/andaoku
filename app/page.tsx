"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  ArrowRight,
  Target,
  Sparkles,
  Layers,
  BrainCircuit,
  Eye,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  GraduationCap,
  Users,
  Compass,
} from "lucide-react";

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const stages = [
    {
      step: 1,
      title: "Başlangıç Seviye Tespiti",
      desc: "Mevcut okuma hızınızı (WPM) ve anlama yüzdesini nesnel kriterlerle ölçer.",
      icon: Target,
    },
    {
      step: 2,
      title: "Görsel Dikkat & Tarama",
      desc: "Göz kaslarını esnetir, çevresel görüş alanını genişletir ve regresyonu azaltır.",
      icon: Eye,
    },
    {
      step: 3,
      title: "Kelime Bloklarıyla Algılama",
      desc: "Kelimeleri tek tek okumak yerine 2'li ve 3'lü anlamlı gruplar halinde sıçrayarak okur.",
      icon: Layers,
    },
    {
      step: 4,
      title: "Derinlemesine Anlama",
      desc: "Hız artışıyla birlikte ana fikir, çıkarım ve eleştirel analiz becerilerini korur.",
      icon: BrainCircuit,
    },
  ];

  const features = [
    {
      title: "Ayrı Ölçüm İlkeleri",
      desc: "Okuma hızı ile okuduğunu anlama puanı bağımsız hesaplanır. Anlamadan sadece hızlı göz gezdirmek başarı sayılmaz.",
      icon: Target,
    },
    {
      title: "Kolaydan Zora Öğrenme Yolu",
      desc: "Kolay, orta ve zor modüller; ön koşulları tamamladıkça açılan, pedagojik araştırma temelli yapılandırılmış bir müfredat sunar.",
      icon: Compass,
    },
    {
      title: "Çoklu Okuma Laboratuvarı",
      desc: "Standart, blok (chunk) ve RSVP flaş okuma yöntemleri; özelleştirilebilir yazı boyutu, satır aralığı ve sepya temaları.",
      icon: BookOpen,
    },
    {
      title: "Öğretmen ve Sınıf İzleme",
      desc: "Eğitimciler için sınıf oluşturma, etkinlik ödevi atama ve öğrenci WPM/anlama gelişimini raporlama araçları.",
      icon: GraduationCap,
    },
    {
      title: "Kolay, Orta ve Zor İçerikler",
      desc: "Metinler; okuma becerilerini adım adım geliştirmek için kolay, orta ve zor seviyelere göre ayrıştırılmış zengin bir kütüphane sunar.",
      icon: Users,
    },
    {
      title: "Google Firebase Güvencesi",
      desc: "Cloud Firestore ve Firebase Authentication ile güvenli, şifrelenmiş ve KVKK uyumlu veri yönetimi.",
      icon: ShieldCheck,
    },
  ];

  const faqs = [
    {
      q: "AndaOku diğer hızlı okuma programlarından nasıl farklıdır?",
      a: "Pek çok geleneksel hızlı okuma tekniği yalnızca göz hızına odaklanır ve anlama kaybını göz ardı eder. AndaOku, okuma hızını ve anlama düzeyini iki ayrı bağımsız metrik olarak ölçer; kullanıcının anlama puanı hedefin altına düştüğünde hızı sabitleyerek derin anlama alıştırmalarına öncelik verir.",
    },
    {
      q: "Her yaştan kullanıcı AndaOku'dan faydalanabilir mi?",
      a: "Evet. Platformumuz, her kullanıcıya kolay, orta ve zor seviyelerde ayrıştırılmış metinler ve etkinlikler sunar. İlerleyiş, eğitim kademesinden bağımsız olarak tamamlanan çalışmalar ve alınan puanlarla belirlenir.",
    },
    {
      q: "Öğretmenler sınıflarını nasıl sisteme dâhil edebilir?",
      a: "Öğretmen paneli üzerinden bir sınıf oluşturup benzersiz sınıf kodunu öğrencileriyle paylaşabilir. Ardından öğrencilere belirli okuma metinlerini veya görsel dikkat etkinliklerini ödev olarak atayıp ilerlemelerini tek ekrandan izleyebilir.",
    },
    {
      q: "Ölçüm sonuçları ve kişisel veriler nasıl korunur?",
      a: "AndaOku, Google Cloud Firestore güvenlik kuralları (Firestore Security Rules) ve Firebase Authentication standartlarını uygular. Öğrenci verileri yetkisiz üçüncü taraflarla paylaşılmaz ve araştırma amaçlı veriler yalnızca anonimleştirilerek işlenir.",
    },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* HERO ALANI */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-ivory-warm to-ivory">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge variant="amber" className="mb-4 px-3.5 py-1 text-xs uppercase tracking-wider font-semibold">
            Araştırma Temelli Bilişsel Okuma Platformu
          </Badge>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-brand-950 font-serif max-w-4xl mx-auto leading-tight">
            Daha bilinçli oku, <br className="hidden sm:inline" />
            <span className="text-amber-600">daha iyi anla.</span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-charcoal-muted max-w-2xl mx-auto leading-relaxed">
            Okuma hızını geliştir, anlamı kaybetme. AndaOku; görsel tarama, kelime tanıma, akıcılık ve derinlemesine anlama becerilerini bütünleşik olarak geliştiren çağdaş bir eğitim teknolojisidir.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/kayit">
              <Button size="lg" variant="amber" className="px-8 shadow-md hover:shadow-lg font-bold text-base">
                Hemen Ücretsiz Başla
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/nasil-calisir">
              <Button size="lg" variant="outline" className="px-6 text-base">
                Nasıl Çalışır?
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-xs text-charcoal-muted font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Bağımsız WPM & Anlama Ölçümü</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Kolaydan Zora Modüler Yol</span>
            </div>
            <div className="flex items-center gap-2 hidden sm:flex">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Öğretmen ve Sınıf Takibi</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 AŞAMALI GELİŞİM ALANI */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-2">Kolaydan Zora Öğrenme</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-charcoal">
            Okuma Gelişiminin 4 Temel Ayağı
          </h2>
          <p className="text-sm text-charcoal-muted mt-2">
            Rastgele değil, bilişsel psikoloji ve okuma fizyolojisi ilkelerine göre yapılandırılmış sistem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <Card key={stage.step} className="border-sage-200 relative overflow-hidden group hover:border-brand-500">
                <div className="absolute top-0 left-0 h-1 w-full bg-brand-700 transition-all group-hover:h-2" />
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-extrabold font-serif text-sage-300 group-hover:text-amber-600 transition-colors">
                      0{stage.step}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ivory-warm text-brand-800">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <CardTitle className="text-lg font-bold font-serif">{stage.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-charcoal-muted leading-relaxed">{stage.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* DUAL SPOTLIGHT: HIZ VE ANLAMA DENGESİ */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-brand-800 text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-xl">
          <div className="max-w-2xl space-y-6 relative z-10">
            <Badge variant="amber">Temel Pedagojik İlke</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-serif leading-tight">
              Anlamadan Hızlı Okumak Başarı Değildir.
            </h2>
            <p className="text-sm sm:text-base text-sage-200 leading-relaxed">
              AndaOku, okuma hızını (WPM) ve anlama yüzdesini ayrı ayrı raporlar. Eğer okuma hızınız yükselirken anlama puanınız düşüyorsa, sistemimiz bunu bir gelişim olarak değil, anlama stratejilerinin devreye sokulması gereken bir ikaz olarak yorumlar.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-700">
              <div>
                <h4 className="font-bold text-amber-400 text-lg">Dakika Başına Kelime</h4>
                <p className="text-xs text-sage-300">Göz tarama ve blok okuma teknikleriyle kademeli hız artışı.</p>
              </div>
              <div>
                <h4 className="font-bold text-amber-400 text-lg">Okuduğunu Anlama</h4>
                <p className="text-xs text-sage-300">Ana fikir, çıkarım ve bağlamsal yorum sorularıyla derin kavrama.</p>
              </div>
            </div>
            <div className="pt-2">
              <Link href="/panel/okuma-laboratuvari">
                <Button size="lg" variant="amber" className="font-bold">
                  Okuma Laboratuvarını Keşfet
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TEMEL ÖZELLİKLER GRİDİ */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-2">Platform Özellikleri</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-charcoal">
            Bütünleşik Dijital Okuma Sistemi
          </h2>
          <p className="text-sm text-charcoal-muted mt-2">
            Öğrenci, öğretmen ve yöneticiler için tasarlanmış kapsamlı araç seti.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card key={i} className="border-sage-200 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 mb-3">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg font-bold font-serif">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-charcoal-muted leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* SSS (FAQ) ALANI */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-2">Merak Edilenler</Badge>
          <h2 className="text-3xl font-bold font-serif text-charcoal">Sıkça Sorulan Sorular</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-2xl border border-sage-200 bg-white overflow-hidden transition-all shadow-sm"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-charcoal hover:bg-ivory-warm transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-5 w-5 text-charcoal-muted shrink-0 transition-transform ${
                    activeFaq === index ? "rotate-180 text-brand-700" : ""
                  }`}
                />
              </button>
              {activeFaq === index && (
                <div className="p-5 pt-0 text-xs sm:text-sm text-charcoal-muted leading-relaxed border-t border-sage-100 bg-ivory-warm">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ALT ÇAĞRI (CTA) ALANI */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-ivory-warm border border-sage-300 p-8 sm:p-12 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-serif text-charcoal">
            Okuma Yolculuğunuza Bugün Başlayın
          </h2>
          <p className="text-sm text-charcoal-muted max-w-lg mx-auto">
            Ücretsiz kayıt olun, başlangıç seviye tespit okumanızı yapın ve size özel hazırlanmış öğrenme yolunuzu keşfedin.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/kayit">
              <Button size="lg" variant="primary" className="px-8 font-bold">
                Ücretsiz Kayıt Ol
              </Button>
            </Link>
            <Link href="/giris">
              <Button size="lg" variant="outline" className="px-8 font-medium">
                Giriş Yap
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
