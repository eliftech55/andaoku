"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserExerciseAttempts, getUserProgressList } from "@/lib/firebase/firestore";
import { fetchActivities, fetchAllModules } from "@/lib/services/contentService";
import { isExerciseLevelUnlocked } from "@/lib/services/moduleScoring";
import { ExerciseAttempt, ExerciseKind, Activity, LearningModule, UserProgress } from "@/lib/types";
import { BookOpen, CheckCircle2, Eye, Lock, Play } from "lucide-react";

const KIND_LABELS: Record<ExerciseKind, string> = {
  peripheral_vision: "Çevresel Görüş",
  target_scan: "Hedef ve Harf Tarama",
  eye_saccade: "Göz Sıçraması",
  flash_words: "Flaş Kelime Tanıma",
};

export default function StudentExercisesPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [attempts, setAttempts] = useState<ExerciseAttempt[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    const uid = user?.uid || profile?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }
    const userId = uid;
    let active = true;
    async function load() {
      try {
        const [moduleList, activityList, attemptList, progressList] = await Promise.all([
          fetchAllModules(),
          fetchActivities(),
          getUserExerciseAttempts(userId),
          getUserProgressList(userId),
        ]);
        if (!active) return;
        setModules(moduleList);
        setActivities(activityList.filter((activity) => activity.level !== undefined));
        setAttempts(attemptList);
        setProgress(progressList);
      } catch (loadError) {
        console.error("Öğrenci egzersizleri yüklenemedi:", loadError);
        if (active) setError("Egzersizler yüklenemedi. Lütfen bağlantınızı kontrol edip yenileyin.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [authLoading, user, profile]);

  if (authLoading || loading) {
    return <div className="container mx-auto px-4 py-10 text-center text-charcoal-muted">Egzersizler yükleniyor...</div>;
  }
  if (!user && !profile) {
    return <div className="container mx-auto px-4 py-10"><p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Egzersiz puanlarının kaydedilmesi için öğrenci hesabıyla giriş yapın.</p></div>;
  }

  const uid = user?.uid || profile?.uid || "";
  const activityAttempts = (activity: Activity) =>
    attempts.filter((attempt) => attempt.activityId === activity.id);
  const bestScore = (activity: Activity) =>
    Math.max(0, ...activityAttempts(activity).map((attempt) => attempt.score));

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-2 border-b border-sage-200 pb-4">
        <Badge variant="amber">Kişisel Egzersiz Alanı</Badge>
        <h1 className="text-3xl font-extrabold font-serif text-charcoal">Göz ve Okuma Egzersizleri</h1>
        <p className="text-sm text-charcoal-muted">Her egzersiz türü kolaydan zora beş seviyelidir. Yeni seviye, önceki seviyeden en az %70 alınca açılır. Denemeleriniz ve en iyi puanınız kaydedilir.</p>
      </header>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p>}
      {modules.length === 0 && !error && <Card><CardContent className="p-6 text-sm text-charcoal-muted">Henüz yayımlanmış modül bulunmuyor.</CardContent></Card>}
      {modules.map((module) => {
        const moduleActivities = activities
          .filter((activity) => activity.moduleId === module.id)
          .sort((left, right) => (left.level || 0) - (right.level || 0));
        const moduleProgress = progress.find((item) => item.moduleId === module.id);
        const exerciseKinds = module.exerciseTypes || [];
        return (
          <Card key={module.id} className="border-sage-200">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="font-serif">{module.title}</CardTitle>
                <Badge variant={moduleProgress?.status === "completed" ? "success" : "outline"}>
                  Modül puanı {moduleProgress?.overallScore === undefined ? "bekleniyor" : `%${moduleProgress.overallScore}`}
                </Badge>
              </div>
              <p className="text-sm text-charcoal-muted">Okuma: {moduleProgress?.readingScore === undefined ? "bekleniyor" : `%${moduleProgress.readingScore}`} · Egzersiz: {moduleProgress?.exerciseScore === undefined ? "bekleniyor" : `%${moduleProgress.exerciseScore}`}</p>
            </CardHeader>
            <CardContent className="space-y-5">
              {module.readingPassageId && (
                <Link href={`/panel/okuma-laboratuvari?moduleId=${encodeURIComponent(module.id)}&passageId=${encodeURIComponent(module.readingPassageId)}`}>
                  <Button size="sm" variant="outline"><BookOpen className="mr-2 h-4 w-4" />Modül okuma metnini çalış</Button>
                </Link>
              )}
              {exerciseKinds.length === 0 && <p className="text-sm text-amber-800">Bu modüle henüz egzersiz atanmamış.</p>}
              {exerciseKinds.map((kind) => {
                const levels = moduleActivities
                  .filter((activity) => activity.type === kind)
                  .sort((left, right) => (left.level || 0) - (right.level || 0));
                const previousPassed = (level: number) => {
                  const previous = levels.find((activity) => activity.level === level - 1);
                  return isExerciseLevelUnlocked(level, previous ? bestScore(previous) : 0);
                };
                return (
                  <section key={kind} className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-charcoal">
                      {kind === "flash_words" ? <BookOpen className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {KIND_LABELS[kind]}
                    </h3>
                    {levels.length === 0 ? (
                      <p className="text-xs text-charcoal-muted">Bu egzersiz türünde henüz seviye etkinliği yok.</p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-5">
                        {levels.map((activity) => {
                          const score = bestScore(activity);
                          const unlocked = previousPassed(activity.level || 1);
                          const latest = activityAttempts(activity)[0];
                          return (
                            <Link
                              key={activity.id}
                              aria-disabled={!unlocked}
                              tabIndex={unlocked ? undefined : -1}
                              className={!unlocked ? "pointer-events-none opacity-55" : ""}
                              href={unlocked ? `/panel/egzersizler/${encodeURIComponent(activity.id)}` : "#"}
                            >
                              <span className="flex h-full min-h-24 flex-col justify-between rounded-xl border border-sage-200 bg-white p-3 hover:border-amber-400">
                                <span className="flex items-center justify-between text-xs font-semibold">
                                  Seviye {activity.level}
                                  {unlocked ? <Play className="h-3.5 w-3.5 text-amber-700" /> : <Lock className="h-3.5 w-3.5" />}
                                </span>
                                <span className="text-xs text-charcoal-muted">
                                  {latest ? `En iyi %${score}` : "Henüz denenmedi"}
                                </span>
                                {score >= 70 && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
              {!uid && <p className="text-xs text-red-700">Puanlar kullanıcı hesabına kaydedilecek.</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
