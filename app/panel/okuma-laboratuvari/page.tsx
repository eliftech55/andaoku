"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ReadingLab } from "@/components/reading/ReadingLab";
import { VisualAttentionGame } from "@/components/activities/VisualAttentionGame";
import {
  EyeMovementExercise,
  EyeMovementExerciseType,
} from "@/components/activities/EyeMovementExercise";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Target, Sparkles, Layers, RefreshCw } from "lucide-react";
import {
  fetchActivities,
  fetchExerciseContent,
  fetchPassageById,
  fetchQuestionsForPassage,
} from "@/lib/services/contentService";
import { useAuth } from "@/contexts/AuthContext";
import { Activity, ReadingPassage, Question } from "@/lib/types";

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
  const { user, profile } = useAuth();
  const initialTab = searchParams.get("tab") === "minigame" ? "minigame" : "reader";

  const [activeTab, setActiveTab] = useState<"reader" | "minigame">(initialTab);
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [exerciseContents, setExerciseContents] = useState<
    { passage: ReadingPassage; questions: Question[] }[]
  >([]);
  const [selectedPassage, setSelectedPassage] = useState<ReadingPassage | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedEyeExercise, setSelectedEyeExercise] =
    useState<"matrix" | EyeMovementExerciseType>("matrix");
  const [requestedModuleId, setRequestedModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveTab(searchParams.get("tab") === "minigame" ? "minigame" : "reader");
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const moduleId = searchParams.get("moduleId");
        const activityId = searchParams.get("activityId");
        if (active) setRequestedModuleId(moduleId);
        const activityList = moduleId ? await fetchActivities(moduleId) : [];
        const activity = activityList.find((item) => item.id === activityId) || null;
        if (active) setSelectedActivity(activity);

        const exerciseList = await fetchExerciseContent();
        const list = exerciseList.map((content) => content.passage);
        const hasRequestedContent = Boolean(moduleId || activityId || searchParams.get("passageId"));
        let availableList = list;
        if (!user && !profile && !hasRequestedContent) {
          const easyPassages = list.filter((passage) => passage.difficulty === "beginner");
          const previousIds = JSON.parse(
            localStorage.getItem("andaoku_lab_seen_passages") || "[]"
          ) as string[];
          const unseen = easyPassages.filter((passage) => !previousIds.includes(passage.id));
          availableList = unseen.length > 0 ? unseen : easyPassages;
          if (availableList.length > 0) {
            const randomPassage = availableList[Math.floor(Math.random() * availableList.length)];
            localStorage.setItem(
              "andaoku_lab_seen_passages",
              JSON.stringify([
                ...previousIds.filter((id) => id !== randomPassage.id),
                randomPassage.id,
              ].slice(-50))
            );
            availableList = [randomPassage];
          }
        }
        const requestedPassageId = activity?.contentConfig.passageId || searchParams.get("passageId");
        let target: ReadingPassage | null = requestedPassageId
          ? availableList.find((passage) => passage.id === requestedPassageId) || null
          : availableList[0] || null;
        if (!target && requestedPassageId) {
          target = await fetchPassageById(requestedPassageId);
        }
        if (!active) return;
        setExerciseContents(exerciseList);
        setPassages(moduleId || hasRequestedContent ? (target ? [target] : []) : availableList);
        setSelectedPassage(target);
        if (!target) {
          setQuestions([]);
          return;
        }
        const exerciseContent = exerciseList.find((content) => content.passage.id === target.id);
        const qList = exerciseContent
          ? exerciseContent.questions
          : await fetchQuestionsForPassage(target.id);
        if (active) setQuestions(qList);
      } catch (e) {
        console.error("Okuma laboratuvarı içeriği yüklenemedi:", e);
      } finally {
        if (active) setLoading(false);
      }
    }
    setLoading(true);
    void loadData();
    return () => {
      active = false;
    };
  }, [searchParams]);

  const handlePassageSelect = async (p: ReadingPassage) => {
    setSelectedPassage(p);
    const exerciseContent = exerciseContents.find((content) => content.passage.id === p.id);
    const qList = exerciseContent
      ? exerciseContent.questions
      : await fetchQuestionsForPassage(p.id);
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
            Göz Egzersizleri
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
          <ReadingLab
            key={selectedActivity?.id || selectedPassage.id}
            passage={selectedPassage}
            questions={questions}
            mode={
              selectedActivity?.type === "chunk_reading"
                ? "chunk"
                : selectedActivity?.type === "fluency"
                  ? "rsvp"
                  : "standard"
            }
            moduleId={selectedActivity?.moduleId || requestedModuleId || undefined}
            activityId={selectedActivity?.id}
            readingPacingWpm={selectedActivity?.contentConfig.speedPacingWpm}
            chunkSize={selectedActivity?.contentConfig.chunkSize}
            persistResults={false}
          />
        ) : (
          <div className="p-8 text-center text-charcoal-muted">
            {loading ? "Metin yükleniyor..." : "Bu çalışma için uygun bir okuma metni bulunamadı."}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3" aria-label="Göz egzersizi seçin">
            {[
              {
                id: "matrix" as const,
                title: "Görsel Dikkat Matrisi",
                description: "Matris içindeki hedef sembolleri bulun.",
              },
              {
                id: "tracking" as const,
                title: "Hareketli Hedefi İzle",
                description: "Ekranda konum değiştiren hedefi takip edin.",
              },
              {
                id: "saccade" as const,
                title: "Sakkadik Sağ-Sol Bakış",
                description: "Hedefi iki farklı tarafta bulup bakışınızı değiştirin.",
              },
            ].map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                aria-pressed={selectedEyeExercise === exercise.id}
                onClick={() => setSelectedEyeExercise(exercise.id)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  selectedEyeExercise === exercise.id
                    ? "border-brand-700 bg-brand-50 shadow-sm"
                    : "border-sage-200 bg-white hover:bg-ivory-warm"
                }`}
              >
                <span className="block text-sm font-bold text-charcoal">{exercise.title}</span>
                <span className="mt-1 block text-xs text-charcoal-muted">
                  {exercise.description}
                </span>
                <span className="mt-3 inline-block rounded-full bg-sage-100 px-2.5 py-1 text-[10px] font-semibold text-charcoal">
                  5 seviye · Kolaydan zora
                </span>
              </button>
            ))}
          </div>
          {selectedEyeExercise === "matrix" ? (
            <VisualAttentionGame
              key={`${selectedActivity?.id || "default"}-matrix`}
              targetSymbol={selectedActivity?.contentConfig.targetSymbol}
              instructions={selectedActivity?.instructions}
            />
          ) : (
            <EyeMovementExercise
              key={selectedEyeExercise}
              type={selectedEyeExercise}
            />
          )}
        </div>
      )}
    </div>
  );
}
