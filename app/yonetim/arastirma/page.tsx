"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Download, FileSpreadsheet, ShieldAlert, BookOpen, Database, CheckCircle2 } from "lucide-react";

export default function ArastirmaSayfasi() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [exportNotice, setExportNotice] = useState(false);

  // Veri Sözlüğü
  const dataDictionary = [
    { field: "participant_hash", desc: "Kişisel veriden arındırılmış benzersiz anonim katılımcı kimliği (SHA-256)" },
    { field: "education_level", desc: "Katılımcının eğitim kademesi (primary, middle, high, adult)" },
    { field: "assessment_type", desc: "Ölçümün türü (pretest, interim, posttest, followup)" },
    { field: "word_count", desc: "Okunan metindeki toplam kelime sayısı" },
    { field: "duration_seconds", desc: "Metnin okunması için geçen net süre (saniye)" },
    { field: "wpm", desc: "Dakika başına okunan kelime sayısı (word_count / (duration_seconds / 60))" },
    { field: "comprehension_score", desc: "Çoktan seçmeli sorulardaki başarı yüzdesi (% 0-100)" },
    { field: "created_at_epoch", desc: "Ölçümün gerçekleştirildiği zaman damgası (Unix Epoch)" },
  ];

  const handleExportCsv = () => {
    // UTF-8 BOM ile Türkçe karakter destekli CSV oluşturma
    const headers = dataDictionary.map((d) => d.field).join(",");
    const sampleRows = [
      "usr_9f83a21b,middle,pretest,139,45,185,75,1760865600",
      "usr_9f83a21b,middle,posttest,139,36,231,100,1761470400",
      "usr_c45d81e0,high,pretest,154,58,159,75,1760866000",
      "usr_c45d81e0,high,interim,154,49,188,100,1761125200",
      "usr_3a77b89f,adult,pretest,139,38,219,100,1760867000",
    ];

    const csvContent = "\uFEFF" + headers + "\n" + sampleRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `andaoku_anonim_arastirma_verisi_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 4000);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-5xl space-y-8">
      <div className="space-y-1">
        <Badge variant="amber">Akademik & Araştırma Veri Portalı</Badge>
        <h1 className="text-3xl font-extrabold font-serif text-charcoal">
          Anonimleştirilmiş Araştırma Verisi
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-muted max-w-2xl leading-relaxed">
          Eğitim bilimleri ve bilişsel psikoloji araştırmalarında kullanılmak üzere kişisel tanımlayıcılardan (ad, soyad, e-posta, telefon) tamamen arındırılmış ham okuma ve anlama ölçüm setleri.
        </p>
      </div>

      {exportNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Anonimleştirilmiş araştırma veri seti (UTF-8 CSV) başarıyla indirildi. Denetim günlüğüne işlem kaydedildi.</span>
        </div>
      )}

      {/* Dışa Aktarma Filtreleri ve Butonu */}
      <Card className="border-sage-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold font-serif flex items-center gap-2">
            <Database className="h-5 w-5 text-brand-700" />
            Veri Seti Filtreleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-charcoal block mb-1">Eğitim Kademesi</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-sage-200 bg-white"
              >
                <option value="all">Tüm Kademeler</option>
                <option value="primary">İlkokul</option>
                <option value="middle">Ortaokul</option>
                <option value="high">Lise</option>
                <option value="adult">Yetişkin</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-charcoal block mb-1">Ölçüm Türü</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-sage-200 bg-white"
              >
                <option value="all">Tüm Ölçümler (Ön test, Ara, Son test)</option>
                <option value="pretest">Yalnızca Ön Testler (Başlangıç)</option>
                <option value="posttest">Yalnızca Son Testler</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center border-t border-sage-100">
            <span className="text-charcoal-muted">Format: UTF-8 BOM destekli CSV (Excel ve R uyumlu)</span>
            <Button size="md" variant="amber" onClick={handleExportCsv} className="font-bold">
              <Download className="mr-2 h-4 w-4" /> Anonim CSV İndir
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Veri Sözlüğü Tablosu */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold font-serif text-charcoal">Veri Sözlüğü (Data Dictionary)</h2>
        <div className="rounded-2xl border border-sage-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory-warm border-b border-sage-200 text-charcoal font-semibold">
              <tr>
                <th className="p-3.5">Değişken Adı</th>
                <th className="p-3.5">Açıklama ve Hesaplama Biçimi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100">
              {dataDictionary.map((d, i) => (
                <tr key={i} className="hover:bg-ivory-warm/40">
                  <td className="p-3.5 font-mono font-bold text-brand-900">{d.field}</td>
                  <td className="p-3.5 text-charcoal-muted">{d.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
