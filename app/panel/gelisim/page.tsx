"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserAssessmentResults,
  getUserExerciseAttempts,
  getUserProgressList,
  getUserReadingSessions,
} from "@/lib/firebase/firestore";
import { fetchAllModules } from "@/lib/services/contentService";
import { AssessmentResult, ExerciseAttempt, ExerciseKind, LearningModule, ReadingSession, UserProgress } from "@/lib/types";
import { ProgressCharts } from "@/components/charts/ProgressCharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Award, FileText } from "lucide-react";
import { formatDuration } from "@/lib/utils";

const EXERCISE_LABELS: Record<ExerciseKind, string> = {
  peripheral_vision: "Çevresel Görüş",
  target_scan: "Hedef ve Harf Tarama",
  eye_saccade: "Göz Sıçraması",
  flash_words: "Flaş Kelime Tanıma",
  point_tracking: "Nokta Takibi",
  infinity_tracking: "Sekiz Takibi",
  chunk_reading: "Kelime Grubu Flaş",
  pacer_reading: "Rehberli Satır Takibi",
  schulte_table: "Schulte Tablosu",
  regression_prevention: "Geri Dönüşü Engelleme",
  digit_memory: "Rakam Dizisi Hafızası",
  word_memory: "Kelime Listesi Hatırlama",
  matching_cards: "Eşleştirme Kartları",
  sequence_memory: "Görsel Sıra Hafızası",
  passage_memory: "Metin Parçası Hatırlama",
  memory_palace: "Hafıza Sarayı",
  n_back: "Çift Görev Hafızası",
  visual_change: "Neyin Değişti?",
};

export default function GelisimRaporlariPage() {
  const { user, profile } = useAuth();
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [sessions, setReadingSessions] = useState<ReadingSession[]>([]);
  const [exerciseAttempts, setExerciseAttempts] = useState<ExerciseAttempt[]>([]);
  const [moduleProgress, setModuleProgress] = useState<UserProgress[]>([]);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const uid = user?.uid || profile?.uid || "demo-learner-123";
      try {
        const [res, sess, attempts, progress, moduleList] = await Promise.all([
          getUserAssessmentResults(uid),
          getUserReadingSessions(uid),
          getUserExerciseAttempts(uid),
          getUserProgressList(uid),
          fetchAllModules(),
        ]);
        setResults(res);
        setReadingSessions(sess);
        setExerciseAttempts(attempts);
        setModuleProgress(progress);
        setModules(moduleList);
      } catch (e) {
        console.error(e);
        setLoadError("Gelişim verileri yüklenemedi. Lütfen bağlantınızı kontrol edip yenileyin.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, profile]);

  const avgWpm =
    results.length > 0
      ? Math.round(results.reduce((acc, curr) => acc + curr.wpm, 0) / results.length)
      : 0;

  const avgComp =
    results.length > 0
      ? Math.round(results.reduce((acc, curr) => acc + curr.comprehensionScore, 0) / results.length)
      : 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-5xl space-y-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Badge variant="amber">Kişisel Analitik</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-charcoal">
            Gelişim ve Ölçüm Raporları
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted max-w-xl leading-relaxed">
            Tamamladığınız tüm okuma seanslarının, kelime hızlarının ve anlama testlerinin ayrıntılı geçmişi.
          </p>
        </div>
      </div>

      {loadError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{loadError}</p>}

      {/* 3 Metrik Kartı */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-sage-200">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-xs text-charcoal-muted">
              <span>Ortalama Okuma Hızı</span>
              <TrendingUp className="h-4 w-4 text-brand-700" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-charcoal">
              {avgWpm > 0 ? `${avgWpm} ` : "-- "}
              <span className="text-xs font-sans text-charcoal-muted font-normal">WPM</span>
            </div>
            <p className="text-[11px] text-charcoal-muted">Tüm seansların ortalaması</p>
          </CardContent>
        </Card>

        <Card className="border-sage-200">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-xs text-charcoal-muted">
              <span>Ortalama Anlama Oranı</span>
              <Award className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-amber-600">
              {avgComp > 0 ? `%${avgComp}` : "--"}
            </div>
            <p className="text-[11px] text-charcoal-muted">Sorulardaki başarı yüzdesi</p>
          </CardContent>
        </Card>

        <Card className="border-sage-200">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-xs text-charcoal-muted">
              <span>Toplam Kayıtlı Ölçüm</span>
              <FileText className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-charcoal">{results.length}</div>
            <p className="text-[11px] text-charcoal-muted">Değerlendirme oturumu</p>
          </CardContent>
        </Card>
      </div>

      {/* GRAFİKLER */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold font-serif text-charcoal">Hız ve Anlama Grafikleri</h2>
        <ProgressCharts assessmentResults={results} />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-charcoal">Modül Başarı Durumu</h2>
          <p className="mt-1 text-xs text-charcoal-muted">Modül puanı, okuma anlama ve atanan egzersiz puanlarının eşit ağırlıklı ortalamasıdır. Geçiş için en az %70 gerekir.</p>
        </div>
        {moduleProgress.length === 0 ? (
          <div className="rounded-2xl border border-sage-200 bg-white p-6 text-center text-xs text-charcoal-muted">
            Henüz modül ilerlemesi kaydedilmedi.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-sage-200 bg-white shadow-sm">
            <table className="w-full min-w-[600px] text-left text-xs">
              <thead className="border-b border-sage-200 bg-ivory-warm font-semibold text-charcoal">
                <tr>
                  <th className="p-3.5">Modül</th>
                  <th className="p-3.5">Okuma</th>
                  <th className="p-3.5">Egzersiz</th>
                  <th className="p-3.5">Toplam</th>
                  <th className="p-3.5">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {moduleProgress.map((progress) => (
                  <tr key={progress.id}>
                    <td className="p-3.5 font-medium text-charcoal">
                      {modules.find((module) => module.id === progress.moduleId)?.title || progress.moduleId}
                    </td>
                    <td className="p-3.5 font-mono">{progress.readingScore === undefined ? "--" : `%${progress.readingScore}`}</td>
                    <td className="p-3.5 font-mono">{progress.exerciseScore === undefined ? "--" : `%${progress.exerciseScore}`}</td>
                    <td className="p-3.5 font-mono font-bold text-brand-900">{progress.overallScore === undefined ? "--" : `%${progress.overallScore}`}</td>
                    <td className="p-3.5">
                      <Badge variant={progress.status === "completed" ? "success" : "outline"}>
                        {progress.status === "completed" ? "Tamamlandı" : "Devam ediyor"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-charcoal">Egzersiz Denemeleri</h2>
          <p className="mt-1 text-xs text-charcoal-muted">Her deneme, puanı ve süresiyle birlikte Firestore kayıtlarından listelenir.</p>
        </div>
        {exerciseAttempts.length === 0 ? (
          <div className="rounded-2xl border border-sage-200 bg-white p-6 text-center text-xs text-charcoal-muted">
            Henüz egzersiz denemeniz bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-sage-200 bg-white shadow-sm">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead className="border-b border-sage-200 bg-ivory-warm font-semibold text-charcoal">
                <tr>
                  <th className="p-3.5">Tarih</th>
                  <th className="p-3.5">Modül</th>
                  <th className="p-3.5">Egzersiz</th>
                  <th className="p-3.5">Seviye</th>
                  <th className="p-3.5">Puan</th>
                  <th className="p-3.5">Doğru / Toplam</th>
                  <th className="p-3.5">Süre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {exerciseAttempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td className="p-3.5 text-charcoal-muted">{new Date(attempt.createdAt).toLocaleString("tr-TR")}</td>
                    <td className="p-3.5">{modules.find((module) => module.id === attempt.moduleId)?.title || attempt.moduleId}</td>
                    <td className="p-3.5">{EXERCISE_LABELS[attempt.exerciseKind] || attempt.exerciseKind}</td>
                    <td className="p-3.5">{attempt.level}</td>
                    <td className="p-3.5 font-mono font-bold text-brand-900">%{attempt.score}</td>
                    <td className="p-3.5">{attempt.correctCount} / {attempt.totalCount}</td>
                    <td className="p-3.5">{formatDuration(attempt.durationSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* GEÇMİŞ ÖLÇÜMLER TABLOSU */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold font-serif text-charcoal">Ölçüm Geçmişi Kayıtları</h2>

        {results.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-sage-200 text-xs text-charcoal-muted">
            Henüz kaydedilmiş bir değerlendirme ölçümü bulunmuyor.
          </div>
        ) : (
          <div className="rounded-2xl border border-sage-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-warm border-b border-sage-200 text-charcoal font-semibold">
                  <tr>
                    <th className="p-3.5">Tarih</th>
                    <th className="p-3.5">Ölçüm Türü</th>
                    <th className="p-3.5">Kelime</th>
                    <th className="p-3.5">Süre</th>
                    <th className="p-3.5">WPM (Hız)</th>
                    <th className="p-3.5">Anlama Puanı</th>
                    <th className="p-3.5">Doğru / Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage-100">
                  {results.map((r) => (
                    <tr key={r.id} className="hover:bg-ivory-warm/50 transition-colors">
                      <td className="p-3.5 font-medium text-charcoal">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString("tr-TR") : "--"}
                      </td>
                      <td className="p-3.5 capitalize">
                        <Badge variant="outline" className="text-[10px]">
                          {r.assessmentType}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-charcoal-muted">{r.wordCount}</td>
                      <td className="p-3.5 text-charcoal-muted">{formatDuration(r.durationSeconds)}</td>
                      <td className="p-3.5 font-mono font-bold text-brand-900">{r.wpm}</td>
                      <td className="p-3.5 font-mono font-bold text-amber-600">%{r.comprehensionScore}</td>
                      <td className="p-3.5 text-charcoal-muted">
                        {r.correctCount} / {r.gradableQuestionCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
