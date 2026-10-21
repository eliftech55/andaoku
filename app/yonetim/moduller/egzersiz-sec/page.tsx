"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assignExercisesToModule, getExerciseDefinitions } from "@/lib/firebase/firestore";
import { getLearningModules } from "@/lib/firebase/firestore";
import { ExerciseDefinition, ExerciseKind, LearningModule } from "@/lib/types";
import { CheckCircle2, Eye, BookOpen, LoaderCircle } from "lucide-react";

const KIND_ORDER: ExerciseKind[] = [
  "peripheral_vision",
  "target_scan",
  "eye_saccade",
  "flash_words",
];

const EXERCISE_LEVELS = [1, 2, 3, 4, 5];

const KIND_LABELS: Record<ExerciseKind, string> = {
  peripheral_vision: "Çevresel Görüş",
  target_scan: "Hedef ve Harf Tarama",
  eye_saccade: "Göz Sıçraması",
  flash_words: "Flaş Kelime Tanıma",
};

function getInitialExerciseLevels(
  module: LearningModule | undefined
): Partial<Record<ExerciseKind, number[]>> {
  const defaults = module?.order === 1 ? [1, 2, 3] : EXERCISE_LEVELS;
  return (module?.exerciseTypes || []).reduce<Partial<Record<ExerciseKind, number[]>>>(
    (levels, kind) => {
      levels[kind] = module?.exerciseLevels?.[kind] || defaults;
      return levels;
    },
    {}
  );
}

function SelectModuleExercisesContent() {
  const searchParams = useSearchParams();
  const { profile, loading: authLoading } = useAuth();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [definitions, setDefinitions] = useState<ExerciseDefinition[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedKinds, setSelectedKinds] = useState<ExerciseKind[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<Partial<Record<ExerciseKind, number[]>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || profile?.role !== "admin") {
      setLoading(false);
      return;
    }
    let active = true;
    async function load() {
      try {
        const [moduleList, exerciseDefinitions] = await Promise.all([
          getLearningModules(),
          getExerciseDefinitions(),
        ]);
        if (!active) return;
        setModules(moduleList);
        setDefinitions(exerciseDefinitions);
        const requestedModuleId = searchParams.get("moduleId");
        const initialModuleId =
          moduleList.find((module) => module.id === requestedModuleId)?.id || moduleList[0]?.id || "";
        setSelectedModuleId(initialModuleId);
        const initialModule = moduleList.find((module) => module.id === initialModuleId);
        setSelectedKinds(initialModule?.exerciseTypes || []);
        setSelectedLevels(getInitialExerciseLevels(initialModule));
      } catch (loadError) {
        console.error("Modül egzersiz seçimi yüklenemedi:", loadError);
        if (active) setError("Modül veya egzersiz kataloğu yüklenemedi.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [authLoading, profile, searchParams]);

  const selectedModule = modules.find((module) => module.id === selectedModuleId);

  const handleModuleChange = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    const module = modules.find((item) => item.id === moduleId);
    setSelectedKinds(module?.exerciseTypes || []);
    setSelectedLevels(getInitialExerciseLevels(module));
    setSuccess(null);
  };

  const handleToggleKind = (kind: ExerciseKind) => {
    if (selectedKinds.includes(kind)) {
      setSelectedKinds((current) => current.filter((value) => value !== kind));
      return;
    }
    setSelectedKinds((current) => [...current, kind]);
    setSelectedLevels((current) => ({
      ...current,
      [kind]: selectedModule?.exerciseLevels?.[kind] ||
        (selectedModule?.order === 1 ? [1, 2, 3] : EXERCISE_LEVELS),
    }));
  };

  const handleToggleLevel = (kind: ExerciseKind, level: number) => {
    setSelectedLevels((current) => {
      const currentLevels = current[kind] || [];
      const highestLevel = Math.max(0, ...currentLevels);
      const nextLevels =
        level > highestLevel
          ? EXERCISE_LEVELS.filter((item) => item <= level)
          : EXERCISE_LEVELS.filter((item) => item < level && currentLevels.includes(item));
      return { ...current, [kind]: nextLevels };
    });
  };

  const handleSave = async () => {
    if (!selectedModuleId) {
      setError("Önce bir modül seçin.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await assignExercisesToModule(selectedModuleId, selectedKinds, selectedLevels, definitions);
      const selectedModule = modules.find((module) => module.id === selectedModuleId);
      setModules((current) =>
        current.map((module) =>
          module.id === selectedModuleId
            ? { ...module, exerciseTypes: selectedKinds, exerciseLevels: selectedLevels }
            : module
        )
      );
      setSuccess(
        `${selectedModule?.title || "Modül"} için seçilen egzersiz seviyeleri bağlandı. Modül başarısı okuma ve egzersiz puanlarının ortalamasında en az %70 gerektirir.`
      );
    } catch (saveError) {
      console.error("Modül egzersizleri kaydedilemedi:", saveError);
      setError("Seçimler kaydedilemedi. Her seçili egzersiz türü için seviyeleri 1’den başlayarak kesintisiz seçin ve seviyelerin yayımlanmış olduğunu doğrulayın.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className="container mx-auto px-4 py-10 text-center text-charcoal-muted">Egzersiz seçimi yükleniyor...</div>;
  }
  if (profile?.role !== "admin") {
    return <div className="container mx-auto px-4 py-10"><p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Modüllere egzersiz atamak için yönetici yetkisi gerekir.</p></div>;
  }

  const catalogReady = KIND_ORDER.every(
    (kind) => definitions.filter((definition) => definition.kind === kind && definition.status === "published").length === 5
  );

  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-2 border-b border-sage-200 pb-4">
        <Badge variant="amber">Müfredat Düzenleme</Badge>
        <h1 className="text-3xl font-extrabold font-serif text-charcoal">Modüle Egzersiz Seç</h1>
        <p className="text-sm text-charcoal-muted">Modüle atanacak egzersiz türlerini ve seviyelerini seçin. Seviye seçimi 1’den başlayarak kesintisiz olmalıdır; sonraki seviye bir önceki seviyede %70 alınca açılır.</p>
      </header>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p>}
      {success && <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{success}</p>}
      {!catalogReady && (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Egzersiz kataloğu henüz hazır değil. Önce <a className="font-semibold underline" href="/yonetim/egzersizler">Egzersiz Yönetimi</a> sayfasında dört egzersizin beş seviyesini oluşturun.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Modül seçimi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="block space-y-1 text-sm font-medium">
            Öğrenme modülü
            <select value={selectedModuleId} onChange={(event) => handleModuleChange(event.target.value)} className="w-full rounded-xl border border-sage-200 bg-white p-2.5">
              {modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
            </select>
          </label>
          {modules.length === 0 ? (
            <p className="text-sm text-charcoal-muted">Henüz modül yok. Önce modül yönetiminden modül oluşturun.</p>
          ) : (
            <>
              <fieldset className="grid gap-3 sm:grid-cols-2">
                <legend className="mb-2 text-sm font-semibold">Modüle atanacak egzersiz türleri</legend>
                {KIND_ORDER.map((kind) => {
                  const publishedLevels = definitions.filter(
                    (definition) => definition.kind === kind && definition.status === "published"
                  ).length;
                  return (
                    <div key={kind} className={`rounded-xl border p-4 ${selectedKinds.includes(kind) ? "border-amber-400 bg-amber-50" : "border-sage-200 bg-white"}`}>
                      <label className="flex cursor-pointer items-start gap-3">
                        <input type="checkbox" checked={selectedKinds.includes(kind)} onChange={() => handleToggleKind(kind)} />
                        <span className="flex-1">
                          <span className="flex items-center gap-2 font-semibold text-charcoal">
                            {kind === "flash_words" ? <BookOpen className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            {KIND_LABELS[kind]}
                          </span>
                          <span className="mt-1 block text-xs text-charcoal-muted">{publishedLevels}/5 yayımlanmış seviye</span>
                        </span>
                      </label>
                      {selectedKinds.includes(kind) && (
                        <fieldset className="mt-4 border-t border-sage-200 pt-3">
                          <legend className="mb-2 text-xs font-semibold text-charcoal">Modülde kullanılacak seviyeler</legend>
                          <div className="flex flex-wrap gap-2">
                            {EXERCISE_LEVELS.map((level) => {
                              const isPublished = definitions.some(
                                (definition) =>
                                  definition.kind === kind &&
                                  definition.level === level &&
                                  definition.status === "published"
                              );
                              return (
                                <label
                                  key={level}
                                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${
                                    isPublished ? "cursor-pointer border-sage-200 bg-white" : "cursor-not-allowed border-sage-100 opacity-50"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={(selectedLevels[kind] || []).includes(level)}
                                    disabled={!isPublished}
                                    onChange={() => handleToggleLevel(kind, level)}
                                  />
                                  Seviye {level}
                                </label>
                              );
                            })}
                          </div>
                        </fieldset>
                      )}
                    </div>
                  );
                })}
              </fieldset>
              <div className="rounded-xl bg-ivory-warm p-4 text-sm text-charcoal-muted">
                <p className="font-semibold text-charcoal">Başarı hesabı</p>
                <p>Modül puanı = (okuduğunu anlama puanı + seçilen egzersiz türlerinin en iyi puanlarının ortalaması) / 2.</p>
                <p className="mt-1">Tüm seçilen egzersiz türlerinde en az bir deneme ve toplamda en az %70 gerekir. Sonraki egzersiz seviyesi, önceki seviye puanı %70 olduğunda açılır.</p>
                {selectedKinds.length > 0 && (
                  <p className="mt-2">
                    Seçilen seviyeler: {selectedKinds.map((kind) =>
                      `${KIND_LABELS[kind]} (${(selectedLevels[kind] || []).map((level) => level).join(", ") || "seviye seçilmedi"})`
                    ).join(" · ")}
                  </p>
                )}
                {selectedModule?.activityIds?.length ? <p className="mt-2">Bu modülde şu anda {selectedModule.activityIds.length} seviye etkinliği var; kaydetmek mevcut atamayı günceller.</p> : null}
              </div>
              <div className="flex justify-end">
                <Button variant="amber" onClick={handleSave} disabled={saving || !catalogReady}>
                  {saving ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Kaydediliyor</> : "Seçimleri modüle kaydet"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SelectModuleExercisesPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-10 text-center">Sayfa yükleniyor...</div>}>
      <SelectModuleExercisesContent />
    </Suspense>
  );
}
