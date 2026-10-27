"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ExerciseRunner, ExerciseResult } from "@/components/activities/ExerciseRunner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getUserExerciseAttempts, saveExerciseAttempt } from "@/lib/firebase/firestore";
import { fetchActivities, fetchActivityById, fetchAllModules } from "@/lib/services/contentService";
import { isExerciseLevelUnlocked } from "@/lib/services/moduleScoring";
import { Activity, ExerciseAttempt, ExerciseKind, LearningModule } from "@/lib/types";
import { ArrowLeft, Lock } from "lucide-react";

const EXERCISE_KINDS: ExerciseKind[] = [
  "peripheral_vision",
  "target_scan",
  "eye_saccade",
  "flash_words",
];

export default function RunExercisePage() {
  const params = useParams<{ activityId: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [module, setModule] = useState<LearningModule | null>(null);
  const [nextActivityId, setNextActivityId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<ExerciseAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
        const [loadedActivity, modules, attemptList, allActivities] = await Promise.all([
          fetchActivityById(params.activityId),
          fetchAllModules(),
          getUserExerciseAttempts(userId),
          fetchActivities(),
        ]);
        if (!active) return;
        if (!loadedActivity || !EXERCISE_KINDS.includes(loadedActivity.type as ExerciseKind) || !loadedActivity.level) {
          setError("Bu egzersiz bulunamadı veya artık yayımlanmıyor.");
          return;
        }
        const assignedModule = modules.find((item) => item.id === loadedActivity.moduleId);
        const assignedLevels = assignedModule?.exerciseLevels?.[loadedActivity.type as ExerciseKind];
        const isAssigned =
          assignedModule?.exerciseTypes?.includes(loadedActivity.type as ExerciseKind) &&
          (assignedModule.activityIds?.includes(loadedActivity.id) ?? true) &&
          (!assignedLevels || assignedLevels.includes(loadedActivity.level || 0));
        if (!assignedModule || !isAssigned) {
          setError("Bu egzersiz seviyesi şu anda öğrenci modülüne atanmamış.");
          return;
        }
        setActivity(loadedActivity);
        setModule(assignedModule);
        const assignedActivityIds = assignedModule.activityIds || [];
        const currentIndex = assignedActivityIds.indexOf(loadedActivity.id);
        const nextAssignedActivityId =
          currentIndex >= 0 ? assignedActivityIds[currentIndex + 1] : undefined;
        const nextActivity = nextAssignedActivityId
          ? allActivities.find((item) => item.id === nextAssignedActivityId && item.status === "published")
          : undefined;
        setNextActivityId(nextActivity?.id || null);
        setAttempts(attemptList);
      } catch (loadError) {
        console.error("Egzersiz açılamadı:", loadError);
        if (active) setError("Egzersiz yüklenemedi. Lütfen bağlantıyı kontrol edip yeniden deneyin.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [authLoading, params.activityId, user, profile]);

  const handleComplete = async (result: ExerciseResult) => {
    if (!activity) throw new Error("Egzersiz oturumu bulunamadı.");
    const uid = user?.uid || profile?.uid;
    if (!uid) throw new Error("Egzersiz puanını kaydetmek için giriş yapın.");
    await saveExerciseAttempt({
      userId: uid,
      moduleId: activity.moduleId,
      activityId: activity.id,
      exerciseKind: activity.type as ExerciseKind,
      level: activity.level || 1,
      score: result.score,
      correctCount: result.correctCount,
      totalCount: result.totalCount,
      durationSeconds: result.durationSeconds,
      createdAt: new Date().toISOString(),
    });
    setAttempts((current) => [
      {
        id: `local-${Date.now()}`,
        userId: uid,
        moduleId: activity.moduleId,
        activityId: activity.id,
        exerciseKind: activity.type as ExerciseKind,
        level: activity.level || 1,
        ...result,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setSaved(true);
  };

  if (authLoading || loading) {
    return <div className="container mx-auto px-4 py-10 text-center text-charcoal-muted">Egzersiz açılıyor...</div>;
  }
  if (!user && !profile) {
    return <div className="container mx-auto px-4 py-10"><p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Puan kaydetmek için öğrenci hesabıyla giriş yapın.</p></div>;
  }
  if (error || !activity || !module) {
    return (
      <div className="container mx-auto max-w-3xl space-y-4 px-4 py-10">
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error || "Egzersiz bulunamadı."}</p>
        <Link href="/panel/egzersizler"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Egzersizlere dön</Button></Link>
      </div>
    );
  }

  const previousLevel = (activity.level || 1) - 1;
  const previousBest = previousLevel > 0
    ? Math.max(0, ...attempts.filter((attempt) =>
        attempt.moduleId === activity.moduleId &&
        attempt.exerciseKind === activity.type &&
        attempt.level === previousLevel
      ).map((attempt) => attempt.score))
    : 100;
  if (!isExerciseLevelUnlocked(activity.level || 1, previousBest)) {
    return (
      <div className="container mx-auto max-w-3xl space-y-5 px-4 py-10">
        <Card><CardContent className="space-y-3 p-6">
          <Lock className="h-7 w-7 text-amber-700" />
          <h1 className="text-xl font-bold font-serif">Önceki seviye tamamlanmalı</h1>
          <p className="text-sm text-charcoal-muted">Bu seviyeyi açmak için Seviye {previousLevel} egzersizinden en az %70 alın. Şu anki en iyi puan: %{previousBest}.</p>
          <Link href="/panel/egzersizler"><Button variant="amber">Egzersiz seviyelerine dön</Button></Link>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-5 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <div><Badge variant="amber">{module.title}</Badge><p className="mt-1 text-xs text-charcoal-muted">Bu denemenin puanı öğrenci gelişim raporunuza kaydedilir.</p></div>
        <Link href="/panel/egzersizler"><Button size="sm" variant="outline"><ArrowLeft className="mr-1.5 h-4 w-4" />Egzersizlere dön</Button></Link>
      </div>
      <ExerciseRunner
        activity={activity}
        onComplete={handleComplete}
        nextActivityHref={nextActivityId ? `/panel/egzersizler/${encodeURIComponent(nextActivityId)}` : undefined}
      />
      {saved && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Puanınız ve modül ilerlemeniz Firestore’a kaydedildi.</p>}
    </div>
  );
}
