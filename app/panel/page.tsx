"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Compass,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Award,
  Clock,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Lock,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { getUserAssessmentResults, getUserProgressList, getUserReadingSessions } from "@/lib/firebase/firestore";
import { AssessmentResult, LearningModule, UserProgress, ReadingSession } from "@/lib/types";
import { generateLearningRecommendation } from "@/lib/services/recommendationEngine";
import { fetchAllModules, fetchActivities } from "@/lib/services/contentService";
import { ProgressCharts } from "@/components/charts/ProgressCharts";
import { formatDuration } from "@/lib/utils";

export default function UserDashboardPage() {
  const { user, profile } = useAuth();

  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [progressList, setProgressList] = useState<UserProgress[]>([]);
  const [totalModules, setTotalModules] = useState(0);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [readingSessions, setReadingSessions] = useState<ReadingSession[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const uid = user?.uid || profile?.uid || "demo-learner-123";

      try {
        const [results, progress, sessions, modules, activities] = await Promise.all([
          getUserAssessmentResults(uid),
          getUserProgressList(uid),
          getUserReadingSessions(uid),
          fetchAllModules(),
          fetchActivities(),
        ]);

        setAssessmentResults(results);
        setProgressList(progress);
        setTotalModules(modules.length);
        setModules(modules.sort((left, right) => left.order - right.order));
        setReadingSessions(sessions);

        // Kural tabanlı öneri motorunu çalıştır
        const rec = generateLearningRecommendation({
          assessmentResults: results,
          userProgressList: progress,
          modules,
          activities,
        });
        setRecommendation(rec);
      } catch (e) {
        console.error("Panel verisi yükleme hatası:", e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, profile]);

  const latestReadingSession = [...readingSessions]
    .filter((session) => session.status === "completed")
    .sort((left, right) =>
      String(right.completedAt || right.createdAt).localeCompare(
        String(left.completedAt || left.createdAt)
      )
    )[0] || null;
  const latestResult = latestReadingSession
    ? [...assessmentResults]
      .filter(
        (result) =>
          result.assessmentType === "practice" &&
          result.passageId === latestReadingSession.passageId
      )
      .sort((left, right) =>
        String(right.createdAt).localeCompare(String(left.createdAt))
      )[0] || null
    : null;
  const completedModulesCount = progressList.filter((p) => p.status === "completed").length;
  const totalActivitiesCount = readingSessions.length;
  const displayName =
    profile?.displayName?.trim() ||
    user?.displayName?.trim() ||
    user?.email?.split("@")[0] ||
    "Okur";
  const firstName = displayName.split(/\s+/)[0];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 max-w-7xl">
      {/* Karşılama ve Günlük Hedef Başlığı */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-brand-900 to-brand-800 text-white shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Öğrenci Portalı</span>
            <span className="text-xs text-sage-300">•</span>
            <span className="text-xs text-sage-300 capitalize">{profile?.educationLevel || "Ortaokul"} Kademesi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif">
            Hoş geldin, {firstName}!
          </h1>
          <p className="text-xs sm:text-sm text-sage-200">
            Bugün hedefinize ulaşmak için 1 okuma seansı ve 1 görsel dikkat çalışması tamamlayın.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 p-3.5 rounded-2xl backdrop-blur-sm border border-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-brand-950 font-bold">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="text-xs">
            <span className="text-sage-200 block">Günlük İlerleme</span>
            <span className="font-bold text-white text-sm">
              {totalActivitiesCount > 0 ? "1 / 2 Tamamlandı (%50)" : "0 / 2 Tamamlandı"}
            </span>
          </div>
        </div>
      </div>

      {/* 4 ÖZET İSTATİSTİK KARTI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* WPM */}
        <Card className="border-sage-200">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-xs text-charcoal-muted">
              <span>Son Okuma Hızı</span>
              <TrendingUp className="h-4 w-4 text-brand-700" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-charcoal">
              {latestReadingSession ? `${latestReadingSession.wpm} ` : "-- "}
              <span className="text-xs font-sans text-charcoal-muted font-normal">WPM</span>
            </div>
            <p className="text-[11px] text-charcoal-muted">
              {latestReadingSession ? "Dakika başına kelime" : "Ölçüm bekleniyor"}
            </p>
          </CardContent>
        </Card>

        {/* Anlama Puanı */}
        <Card className="border-sage-200">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-xs text-charcoal-muted">
              <span>Son Anlama Puanı</span>
              <Award className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-600">
              {latestResult ? `%${latestResult.comprehensionScore}` : "--"}
            </div>
            <p className="text-[11px] text-charcoal-muted">
              {latestResult ? `${latestResult.correctCount} doğru yanıt` : "Ölçüm bekleniyor"}
            </p>
          </CardContent>
        </Card>

        {/* Tamamlanan Modüller */}
        <Card className="border-sage-200">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-xs text-charcoal-muted">
              <span>Modül Durumu</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-charcoal">
              {completedModulesCount} <span className="text-xs font-sans text-charcoal-muted font-normal">/ {totalModules}</span>
            </div>
            <p className="text-[11px] text-charcoal-muted">Tamamlanan modül</p>
          </CardContent>
        </Card>

        {/* Toplam Etkinlik */}
        <Card className="border-sage-200">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-xs text-charcoal-muted">
              <span>Toplam Etkinlik</span>
              <BookOpen className="h-4 w-4 text-brand-700" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-charcoal">
              {totalActivitiesCount}
            </div>
            <p className="text-[11px] text-charcoal-muted">Kayıtlı çalışma oturumu</p>
          </CardContent>
        </Card>
      </div>

      {/* KİŞİSELLEŞTİRİLMİŞ ÖNERİ & KALDIĞI YERDEN DEVAM ET */}
      {recommendation && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="amber" className="flex items-center gap-1 text-[11px]">
                <Sparkles className="h-3 w-3" />
                ÖNERİLEN SONRAKİ ADIM
              </Badge>
              <span className="text-xs font-bold text-amber-900">{recommendation.title}</span>
            </div>
            <p className="text-xs sm:text-sm text-charcoal leading-relaxed">{recommendation.rationale}</p>
          </div>

          <Link href={recommendation.status === "insufficient_data" ? "/panel/baslangic-sinavi" : "/panel/okuma-laboratuvari"}>
            <Button size="lg" variant="amber" className="font-bold shrink-0 shadow-md">
              <Play className="mr-2 h-4 w-4" />
              {recommendation.suggestedAction}
            </Button>
          </Link>
        </div>
      )}

      {/* GELİŞİM GRAFİKLERİ BÖLÜMÜ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-serif text-charcoal">Ölçüm ve Gelişim Geçmişi</h2>
          <Link href="/panel/gelisim" className="text-xs font-semibold text-brand-800 hover:underline flex items-center gap-1">
            Detaylı Raporları İncele
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ProgressCharts assessmentResults={assessmentResults} />
      </div>

      {/* MODÜLLER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-serif text-charcoal">Modüllerim</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/panel/egzersizler" className="text-xs font-semibold text-brand-800 hover:underline flex items-center gap-1">
              Egzersizlerim <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/panel/ogrenme-yolu" className="text-xs font-semibold text-brand-800 hover:underline flex items-center gap-1">
              Tüm Modül Haritasını Aç <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-sage-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs text-charcoal-muted">
            <span>Genel Yol İlerlemesi</span>
            <span className="font-bold text-brand-900">%{totalModules ? Math.round((completedModulesCount / totalModules) * 100) : 0}</span>
          </div>
          <Progress value={totalModules ? (completedModulesCount / totalModules) * 100 : 0} />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
            {modules.map((module) => {
              const progress = progressList.find((item) => item.moduleId === module.id);
              const isCompleted = progress?.status === "completed";
              const isUnlocked =
                !module.prerequisites?.length ||
                module.prerequisites.every((prerequisite) =>
                  progressList.some(
                    (item) => item.moduleId === prerequisite && item.status === "completed"
                  )
                );
              const content = (
                <span className="flex h-full flex-col justify-between gap-3">
                  <span className="flex items-start justify-between gap-2">
                    <span>
                      <span className="block text-xs font-bold uppercase text-charcoal-muted">
                        Modül {String(module.order).padStart(2, "0")}
                      </span>
                      <span className="mt-1 block font-semibold text-charcoal">{module.title}</span>
                    </span>
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    ) : isUnlocked ? (
                      <Play className="h-5 w-5 shrink-0 text-amber-700" />
                    ) : (
                      <Lock className="h-5 w-5 shrink-0 text-charcoal-muted" />
                    )}
                  </span>
                  <span className="flex items-center justify-between text-xs text-charcoal-muted">
                    <span>{isCompleted ? `Tamamlandı · %${progress?.overallScore || 0}` : isUnlocked ? "Çalışmaya başla" : "Ön koşul kilitli"}</span>
                    {isUnlocked && !isCompleted && <ArrowRight className="h-3.5 w-3.5" />}
                  </span>
                </span>
              );
              return isUnlocked ? (
                <Link
                  key={module.id}
                  href={`/panel/ogrenme-yolu#module-${encodeURIComponent(module.id)}`}
                  className={`rounded-2xl border p-4 transition-all hover:border-amber-400 ${isCompleted ? "border-emerald-200 bg-emerald-50/60" : "border-amber-300 bg-amber-50/60"}`}
                >
                  {content}
                </Link>
              ) : (
                <div key={module.id} aria-disabled="true" className="rounded-2xl border border-sage-200 bg-ivory-warm p-4 opacity-70">
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
