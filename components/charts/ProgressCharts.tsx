"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { AssessmentResult } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Info, TrendingUp, Award } from "lucide-react";

interface ProgressChartsProps {
  assessmentResults: AssessmentResult[];
}

export function ProgressCharts({ assessmentResults }: ProgressChartsProps) {
  // Verileri kronolojik sıraya diz (en eskiden en yeniye)
  const chartData = [...assessmentResults]
    .reverse()
    .map((item, index) => {
      const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString("tr-TR") : `Ölçüm ${index + 1}`;
      return {
        name: dateStr,
        wpm: item.wpm,
        comprehension: item.comprehensionScore,
        type: item.assessmentType,
      };
    });

  const skillData = [
    { skill: "Görsel Tarama", score: 85 },
    { skill: "Kelime Tanıma", score: 78 },
    { skill: "Blok Okuma", score: 65 },
    { skill: "Akıcılık", score: 72 },
    { skill: "Ana Fikir", score: 88 },
    { skill: "Çıkarım Yapma", score: 68 },
  ];

  if (!assessmentResults || assessmentResults.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl border border-sage-200 bg-white space-y-3">
        <TrendingUp className="h-10 w-10 mx-auto text-sage-400" />
        <h4 className="text-base font-bold text-charcoal">Henüz Kayıtlı Ölçüm Bulunmuyor</h4>
        <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
          Okuma hızınızın ve anlama puanınızın zaman içindeki değişim grafiklerini görebilmek için en az bir okuma etkinliğini tamamlayın.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* İkili Grafik: WPM ve Anlama Değişimi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WPM Grafiği */}
        <Card className="border-sage-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-charcoal flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-700" />
                Okuma Hızı Değişimi (WPM)
              </CardTitle>
            </div>
            <p className="text-xs text-charcoal-muted">Zaman içinde dakika başına okunan kelime sayısı</p>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DF" />
                <XAxis dataKey="name" stroke="#526058" fontSize={11} />
                <YAxis stroke="#526058" fontSize={11} domain={[0, "auto"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "12px",
                    border: "1px solid #CBD5E1",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${val} WPM`, "Hız"]}
                />
                <Line
                  type="monotone"
                  dataKey="wpm"
                  stroke="#134E4A"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#134E4A" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Anlama Puanı Grafiği */}
        <Card className="border-sage-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-charcoal flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-600" />
                Okuduğunu Anlama Puanı (%)
              </CardTitle>
            </div>
            <p className="text-xs text-charcoal-muted">Değerlendirme sorularındaki anlama yüzdesi</p>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DF" />
                <XAxis dataKey="name" stroke="#526058" fontSize={11} />
                <YAxis stroke="#526058" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "12px",
                    border: "1px solid #CBD5E1",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`%${val}`, "Anlama"]}
                />
                <Line
                  type="monotone"
                  dataKey="comprehension"
                  stroke="#D97706"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#D97706" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Beceri Dağılımı Çubuk Grafiği */}
      <Card className="border-sage-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-charcoal">Beceri Bazında İlerleme Düzeyi</CardTitle>
          <p className="text-xs text-charcoal-muted">Farklı bilişsel okuma bileşenlerinde gösterilen performans</p>
        </CardHeader>
        <CardContent className="h-64 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={skillData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DF" />
              <XAxis dataKey="skill" stroke="#526058" fontSize={11} />
              <YAxis stroke="#526058" fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  border: "1px solid #CBD5E1",
                  fontSize: "12px",
                }}
                formatter={(val: any) => [`%${val}`, "Puan"]}
              />
              <Bar dataKey="score" fill="#3D8479" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bilimsel Sınırlılık Açıklaması */}
      <div className="p-4 rounded-2xl bg-ivory-beige border border-sage-200 text-xs text-charcoal-muted flex items-start gap-3">
        <Info className="h-5 w-5 text-brand-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-brand-900 block">Ölçüm Sınırlılıkları ve Bilimsel Uyarı</span>
          <p className="leading-relaxed">
            Farklı metinlerin türleri (bilgilendirici, öyküleyici, akademik), sözcük dağarcığı ve kavram yoğunlukları
            farklılık gösterir. Bu nedenle ham okuma hızının (WPM) farklı metinler arasında doğrudan ve bağlamdan kopuk
            karşılaştırılması yanıltıcı olabilir. AndaOku, her ölçümde metin zorluğunu ve okuduğunu anlama oranını
            birlikte analiz etmeyi önerir.
          </p>
        </div>
      </div>
    </div>
  );
}
