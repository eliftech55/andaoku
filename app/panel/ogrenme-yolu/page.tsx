"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  CheckCircle2,
  Lock,
  Play,
  Clock,
  ArrowRight,
  Target,
  Sparkles,
  Layers,
  Activity,
  Search,
  BrainCircuit,
  BookOpenCheck,
  Award,
  Eye,
} from "lucide-react";
import { fetchActivities, fetchAllModules } from "@/lib/services/contentService";
import { getUserProgressList } from "@/lib/firebase/firestore";
import type { Activity as LearningActivity, LearningModule, UserProgress } from "@/lib/types";

export default function OgrenmeYoluPage() {
  const { user, profile } = useAuth();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [progressList, setProgressList] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const uid = user?.uid || profile?.uid || "demo-learner-123";
      try {
        const [mods, progs, activityList] = await Promise.all([
          fetchAllModules(),
          getUserProgressList(uid),
          fetchActivities(),
        ]);
        setModules(mods);
        setProgressList(progs);
        setActivities(activityList);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, profile]);

  const completedModuleIds = new Set(
    progressList.filter((p) => p.status === "completed").map((p) => p.moduleId)
  );

  const getModuleIcon = (order: number) => {
    switch (order) {
      case 1: return Target;
      case 2: return Eye;
      case 3: return Sparkles;
      case 4: return Layers;
      case 5: return Activity;
      case 6: return Search;
      case 7: return BrainCircuit;
      case 8: return BookOpenCheck;
      case 9: return Compass;
      case 10: return Award;
      default: return Compass;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-5xl space-y-10">
      <div className="space-y-2">
        <Badge variant="amber">Kişiselleştirilmiş Müfredat</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-charcoal">
          Okuma Öğrenme Yolu
        </h1>
        <p className="text-sm text-charcoal-muted max-w-2xl leading-relaxed">
          Her modül hedeflenen bilişsel beceriyi geliştirir. Ön koşulları tamamladığınızda bir sonraki modülün kilidi açılır.
        </p>
      </div>

      <section aria-labelledby="completed-modules-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-emerald-700" />
          <h2 id="completed-modules-heading" className="text-xl font-bold font-serif text-charcoal">
            Tamamlanan modüller ve puanlar
          </h2>
        </div>
        {modules.some((module) => completedModuleIds.has(module.id)) ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {modules
              .filter((module) => completedModuleIds.has(module.id))
              .map((module) => {
                const progress = progressList.find((item) => item.moduleId === module.id);
                return (
                  <Card key={module.id} className="border-emerald-200 bg-emerald-50/40">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div>
                        <p className="font-semibold text-charcoal">{module.title}</p>
                        <p className="mt-1 text-xs text-charcoal-muted">
                          Okuma: {progress?.readingScore === undefined ? "—" : `%${progress.readingScore}`}
                          {" · "}Egzersiz: {progress?.exerciseScore === undefined ? "—" : `%${progress.exerciseScore}`}
                        </p>
                      </div>
                      <Badge variant="success" className="text-sm">
                        Modül puanı %{progress?.overallScore ?? progress?.completionPercentage ?? 0}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        ) : (
          <p className="rounded-xl border border-sage-200 bg-white p-4 text-sm text-charcoal-muted">
            Henüz tamamlanan modül yok. Modül puanınız en az %70 olduğunda burada görünür.
          </p>
        )}
      </section>

      <div className="space-y-6 relative before:absolute before:inset-0 before:left-7 before:w-1 before:bg-sage-200 before:hidden sm:before:block">
        {modules.map((mod) => {
          const isCompleted = completedModuleIds.has(mod.id);
          const isUnlocked =
            mod.prerequisites.length === 0 ||
            mod.prerequisites.every((prereq) => completedModuleIds.has(prereq));

          const Icon = getModuleIcon(mod.order);
          const moduleActivities = activities.filter(
            (activity) =>
              activity.moduleId === mod.id &&
              ["visual_attention", "fluency", "chunk_reading", "assessment"].includes(activity.type) &&
              !activity.level
          );
          const moduleProgress = progressList.find((progress) => progress.moduleId === mod.id);

          return (
            <div key={mod.id} className="relative flex flex-col sm:flex-row gap-6 items-start">
              {/* Durum Rozeti / Numaratör */}
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl z-10 shadow-sm font-bold text-lg transition-transform ${
                  isCompleted
                    ? "bg-emerald-600 text-white"
                    : isUnlocked
                    ? "bg-amber-500 text-white animate-pulse"
                    : "bg-sage-100 text-charcoal-muted border border-sage-200"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-7 w-7" />
                ) : isUnlocked ? (
                  <Icon className="h-6 w-6" />
                ) : (
                  <Lock className="h-5 w-5" />
                )}
              </div>

              {/* Modül Kartı */}
              <Card
                className={`flex-1 border transition-all ${
                  isCompleted
                    ? "border-emerald-200 bg-white"
                    : isUnlocked
                    ? "border-amber-400 bg-white shadow-md ring-2 ring-amber-400/20"
                    : "border-sage-200 bg-ivory-warm/60 opacity-80"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={isCompleted ? "success" : isUnlocked ? "amber" : "outline"}>
                        {isCompleted ? "Tamamlandı" : isUnlocked ? "Erişilebilir" : "Kilitli"}
                      </Badge>
                      <span className="text-xs font-semibold text-charcoal-muted uppercase">
                        Zorluk: {mod.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-charcoal-muted font-mono">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{mod.estimatedDuration} dk</span>
                    </div>
                  </div>

                  <CardTitle className="text-xl font-bold font-serif text-charcoal mt-1">
                    {mod.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                    {mod.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {mod.targetSkills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded-lg bg-sage-100 text-brand-900 text-[11px] font-medium"
                      >
                        #{skill}
                      </span>
                    ))}
                  </div>

                  {moduleProgress && (
                    <p className="text-xs font-medium text-charcoal-muted">
                      Modül puanı: {moduleProgress.overallScore === undefined ? "bekleniyor" : `%${moduleProgress.overallScore}`}
                      {" · "}Okuma: {moduleProgress.readingScore === undefined ? "—" : `%${moduleProgress.readingScore}`}
                      {" · "}Egzersiz: {moduleProgress.exerciseScore === undefined ? "—" : `%${moduleProgress.exerciseScore}`}
                    </p>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-sage-100">
                    <span className="text-xs text-charcoal-muted">
                      {mod.prerequisites.length > 0 && !isCompleted && !isUnlocked
                        ? `Ön koşul: ${mod.prerequisites.join(", ")} tamamlanmalı`
                        : "Hazır ve yapılandırılmış"}
                    </span>

                    {isUnlocked ? (
                      <div className="flex flex-wrap justify-end gap-2">
                        {mod.readingPassageId && (
                          <Link href={`/panel/okuma-laboratuvari?moduleId=${encodeURIComponent(mod.id)}&passageId=${encodeURIComponent(mod.readingPassageId)}`}>
                            <Button size="sm" variant="outline" className="font-semibold">
                              <BookOpenCheck className="mr-1.5 h-3.5 w-3.5" />Okuma metni
                            </Button>
                          </Link>
                        )}
                        {mod.exerciseTypes?.length ? (
                          <Link href={`/panel/egzersizler?moduleId=${encodeURIComponent(mod.id)}`}>
                            <Button size="sm" variant={isCompleted ? "outline" : "amber"} className="font-semibold">
                              <Play className="mr-1.5 h-3.5 w-3.5" />Atanmış egzersizler
                            </Button>
                          </Link>
                        ) : moduleActivities.length > 0 ? (
                          moduleActivities.map((activity) => (
                            <Link key={activity.id} href={`/panel/okuma-laboratuvari?tab=${activity.type === "visual_attention" ? "minigame" : "reader"}&moduleId=${encodeURIComponent(mod.id)}&activityId=${encodeURIComponent(activity.id)}&passageId=${encodeURIComponent(activity.contentConfig.passageId || "")}`}>
                              <Button size="sm" variant={isCompleted ? "outline" : "amber"} className="font-semibold">
                                <Play className="mr-1.5 h-3.5 w-3.5" />{activity.title}
                              </Button>
                            </Link>
                          ))
                        ) : (
                          <Link href={mod.order === 2 ? "/panel/okuma-laboratuvari?tab=minigame" : `/panel/okuma-laboratuvari?moduleId=${encodeURIComponent(mod.id)}`}>
                            <Button size="sm" variant={isCompleted ? "outline" : "amber"} className="font-semibold">
                              <Play className="mr-1.5 h-3.5 w-3.5" />
                              {isCompleted ? "Tekrar Et" : "Modülü Başlat"}
                            </Button>
                          </Link>
                        )}
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" disabled className="opacity-50">
                        <Lock className="mr-1.5 h-3.5 w-3.5" /> Kilitli
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
