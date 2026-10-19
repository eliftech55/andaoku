"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ReadingLab } from "@/components/reading/ReadingLab";
import { VisualAttentionGame } from "@/components/activities/VisualAttentionGame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Target, Sparkles, Layers, RefreshCw } from "lucide-react";
import { fetchPassages, fetchQuestionsForPassage } from "@/lib/services/contentService";
import { ReadingPassage, Question } from "@/lib/types";

export default function OkumaLaboratuvariPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-5xl text-center text-charcoal-muted">
          Okuma laboratuvarı yükleniyor...
        </div>
      }
    >
      <OkumaLaboratuvariContent />
    </Suspense>
  );
}

function OkumaLaboratuvariContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "minigame" ? "minigame" : "reader";

  const [activeTab, setActiveTab] = useState<"reader" | "minigame">(initialTab);
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [selectedPassage, setSelectedPassage] = useState<ReadingPassage | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await fetchPassages();
        setPassages(list);
        if (list.length > 0) {
          const passageIdParam = searchParams.get("passageId");
          const target = list.find((p) => p.id === passageIdParam) || list[0];
          setSelectedPassage(target);
          const qList = await fetchQuestionsForPassage(target.id);
          setQuestions(qList);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [searchParams]);

  const handlePassageSelect = async (p: ReadingPassage) => {
    setSelectedPassage(p);
    const qList = await fetchQuestionsForPassage(p.id);
    setQuestions(qList);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-5xl space-y-8">
      {/* Başlık ve Sekme Seçiciler */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sage-200">
        <div>
          <Badge variant="amber" className="mb-1">İnteraktif Çalışma Alanı</Badge>
          <h1 className="text-3xl font-extrabold font-serif text-charcoal">Okuma Laboratuvarı</h1>
          <p className="text-xs sm:text-sm text-charcoal-muted">
            Standart, blok veya RSVP okuma tekniklerini uygulayın; anlama derinliğini ve hızınızı test edin.
          </p>
        </div>

        {/* Sekmeler */}
        <div className="bg-sage-100 p-1.5 rounded-2xl flex gap-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("reader")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "reader"
                ? "bg-white text-brand-900 shadow-sm"
                : "text-charcoal-muted hover:text-charcoal"
            }`}
          >
            <BookOpen className="h-4 w-4 text-brand-700" />
            Okuma & Anlama Seansı
          </button>
          <button
            onClick={() => setActiveTab("minigame")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "minigame"
                ? "bg-white text-brand-900 shadow-sm"
                : "text-charcoal-muted hover:text-charcoal"
            }`}
          >
            <Target className="h-4 w-4 text-amber-600" />
            Görsel Dikkat Matrisi
          </button>
        </div>
      </div>

      {/* METİN SEÇİCİ ÇUBUĞU (Yalnızca Okuma Modunda) */}
      {activeTab === "reader" && passages.length > 0 && (
        <div className="p-3 rounded-2xl bg-ivory-warm border border-sage-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-charcoal">Çalışılacak Metin:</span>
          <div className="flex flex-wrap gap-2">
            {passages.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePassageSelect(p)}
                className={`px-3 py-1.5 rounded-xl border transition-all ${
                  selectedPassage?.id === p.id
                    ? "bg-brand-700 text-white font-bold border-brand-800 shadow-sm"
                    : "bg-white text-charcoal border-sage-200 hover:bg-ivory-beige"
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* İÇERİK: LABORATUVAR VEYA MİNİ OYUN */}
      {activeTab === "reader" ? (
        selectedPassage ? (
          <ReadingLab passage={selectedPassage} questions={questions} />
        ) : (
          <div className="p-8 text-center text-charcoal-muted">Metin yükleniyor...</div>
        )
      ) : (
        <VisualAttentionGame />
      )}
    </div>
  );
}
