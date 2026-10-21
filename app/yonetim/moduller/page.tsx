"use client";

import React, { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { saveLearningModuleWithActivities } from "@/lib/firebase/firestore";
import { fetchPassages } from "@/lib/services/contentService";
import { DifficultyLevel, EducationLevel, LearningModule, ReadingPassage } from "@/lib/types";
import { CheckCircle2, Eye, Plus, BookOpen, LoaderCircle } from "lucide-react";

const EDUCATION_LEVELS: { value: EducationLevel; label: string }[] = [
  { value: "primary", label: "İlkokul" },
  { value: "middle", label: "Ortaokul" },
  { value: "high", label: "Lise" },
  { value: "university", label: "Üniversite" },
  { value: "adult", label: "Yetişkin" },
];

const DIFFICULTIES: { value: DifficultyLevel; label: string }[] = [
  { value: "beginner", label: "Başlangıç" },
  { value: "intermediate", label: "Orta" },
  { value: "advanced", label: "İleri" },
];

export default function ModuleManagementPage() {
  const { profile, loading: authLoading } = useAuth();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("beginner");
  const [educationLevel, setEducationLevel] = useState<EducationLevel>("middle");
  const [duration, setDuration] = useState(20);
  const [targetSkills, setTargetSkills] = useState("");
  const [passageId, setPassageId] = useState("");
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [status, setStatus] = useState<"draft" | "published">("draft");

  useEffect(() => {
    if (authLoading || profile?.role !== "admin") {
      setIsLoading(false);
      return;
    }

    let active = true;

    async function loadContent() {
      setIsLoading(true);
      setError(null);
      try {
        if (!isFirebaseConfigured) {
          throw new Error("Firebase yapılandırması bulunamadı.");
        }
        const [moduleSnapshot, passageList] = await Promise.all([
          getDocs(query(collection(db, "learningModules"), orderBy("order", "asc"))),
          fetchPassages(),
        ]);
        if (!active) return;
        setModules(
          moduleSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as LearningModule)
        );
        const publishedPassages = passageList.filter((passage) => passage.status === "published");
        setPassages(publishedPassages);
        setPassageId((current) => current || publishedPassages[0]?.id || "");
      } catch (loadError) {
        console.error("Modüller yüklenemedi:", loadError);
        if (active) setError("Modüller yüklenemedi. Firestore bağlantısını ve yönetici erişimini kontrol edin.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadContent();
    return () => {
      active = false;
    };
  }, [authLoading, profile]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDifficulty("beginner");
    setEducationLevel("middle");
    setDuration(20);
    setTargetSkills("");
    setPassageId(passages[0]?.id || "");
    setPrerequisites([]);
    setStatus("draft");
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (profile?.role !== "admin") return;

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    if (!cleanTitle || !cleanDescription || !passageId) {
      setError("Başlık, açıklama ve okuma metni seçilmelidir.");
      return;
    }

    const chosenPassage = passages.find((passage) => passage.id === passageId);
    if (!chosenPassage) {
      setError("Seçilen okuma metni artık kullanılamıyor. Lütfen başka bir metin seçin.");
      return;
    }

    const now = new Date().toISOString();
    const id = `modul-${crypto.randomUUID()}`;
    const skills = targetSkills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
    const module: LearningModule = {
      id,
      title: cleanTitle,
      description: cleanDescription,
      targetSkills: skills.length ? skills : ["hizli_okuma", "goz_tarama", "anlama"],
      difficulty,
      educationLevel,
      readingPassageId: passageId,
      exerciseTypes: [],
      activityIds: [],
      requiredCompletionScore: 70,
      order: Math.max(0, ...modules.map((item) => item.order)) + 1,
      prerequisites,
      estimatedDuration: duration,
      status,
      createdAt: now,
      updatedAt: now,
    };

    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await saveLearningModuleWithActivities(module, []);
      setModules((current) => [...current, module].sort((left, right) => left.order - right.order));
      setSuccess("Modül kaydedildi. Egzersiz seçimi sayfasından beş seviyeli egzersizleri atayın.");
      setFormOpen(false);
      resetForm();
    } catch (saveError) {
      console.error("Modül kaydedilemedi:", saveError);
      setError("Modül kaydedilemedi. Firestore yazma yetkisini ve bağlantıyı kontrol edin.");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return <div className="container mx-auto px-4 py-10 text-center text-charcoal-muted">Modüller yükleniyor...</div>;
  }

  if (profile?.role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-10">
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Modül yönetimi için yönetici yetkisi gerekir.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col items-start justify-between gap-4 border-b border-sage-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <Badge variant="amber" className="mb-1">Eğitsel İçerik</Badge>
          <h1 className="text-3xl font-extrabold font-serif text-charcoal">Modül Yönetimi</h1>
          <p className="text-sm text-charcoal-muted">
            Modülleri oluşturun, okuma metinlerini ve beş seviyeli egzersizleri ayrı seçim ekranında atayın.
          </p>
        </div>
        <Button
          size="sm"
          variant="amber"
          onClick={() => {
            setError(null);
            setSuccess(null);
            setFormOpen((open) => !open);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {formOpen ? "Formu Kapat" : "Yeni Modül Ekle"}
        </Button>
      </header>
      <div className="flex flex-wrap gap-2">
        <Link href="/yonetim/egzersizler">
          <Button size="sm" variant="outline"><Eye className="mr-1.5 h-4 w-4" />Egzersiz kataloğunu yönet</Button>
        </Link>
        <Link href="/yonetim/moduller/egzersiz-sec">
          <Button size="sm" variant="outline"><BookOpen className="mr-1.5 h-4 w-4" />Modüllere egzersiz seç</Button>
        </Link>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p>}
      {success && (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4" />{success}
        </p>
      )}

      {formOpen && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="font-serif">Yeni öğrenme modülü</CardTitle>
            <p className="text-sm text-charcoal-muted">Modül için bir okuma metni belirleyin. Egzersiz türlerini ve seviyelerini sonraki seçim adımında atayın.</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSave}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium">
                  Modül adı
                  <input required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-xl border border-sage-200 p-2.5" placeholder="Örn. Akıcı Okuma Temelleri" />
                </label>
                <label className="space-y-1 text-sm font-medium">
                  Hedef kademe
                  <select value={educationLevel} onChange={(event) => setEducationLevel(event.target.value as EducationLevel)} className="w-full rounded-xl border border-sage-200 bg-white p-2.5">
                    {EDUCATION_LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
                  </select>
                </label>
              </div>
              <label className="block space-y-1 text-sm font-medium">
                Açıklama
                <textarea required maxLength={500} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-xl border border-sage-200 p-2.5" placeholder="Bu modülde geliştirilecek becerileri açıklayın." />
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-1 text-sm font-medium">
                  Zorluk seviyesi
                  <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as DifficultyLevel)} className="w-full rounded-xl border border-sage-200 bg-white p-2.5">
                    {DIFFICULTIES.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
                  </select>
                </label>
                <label className="space-y-1 text-sm font-medium">
                  Süre (dakika)
                  <input required type="number" min={5} max={180} value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="w-full rounded-xl border border-sage-200 p-2.5" />
                </label>
                <label className="space-y-1 text-sm font-medium">
                  Yayın durumu
                  <select value={status} onChange={(event) => setStatus(event.target.value as "draft" | "published")} className="w-full rounded-xl border border-sage-200 bg-white p-2.5">
                    <option value="draft">Taslak</option>
                    <option value="published">Yayında</option>
                  </select>
                </label>
              </div>
              <label className="block space-y-1 text-sm font-medium">
                Geliştirilecek beceriler
                <input value={targetSkills} onChange={(event) => setTargetSkills(event.target.value)} className="w-full rounded-xl border border-sage-200 p-2.5" placeholder="virgülle ayırın: goz_tarama, akici_okuma, anlama" />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                Okuma egzersizi metni
                <select required value={passageId} onChange={(event) => setPassageId(event.target.value)} className="w-full rounded-xl border border-sage-200 bg-white p-2.5">
                  {passages.map((passage) => <option key={passage.id} value={passage.id}>{passage.title}</option>)}
                </select>
              </label>
              {modules.length > 0 && (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold">Ön koşul modülleri (isteğe bağlı)</legend>
                  <div className="flex flex-wrap gap-3">
                    {modules.map((module) => (
                      <label key={module.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={prerequisites.includes(module.id)} onChange={(event) => setPrerequisites((current) => event.target.checked ? [...current, module.id] : current.filter((id) => id !== module.id))} />
                        {module.title}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              <div className="rounded-xl bg-ivory-warm p-4 text-sm text-charcoal-muted">
                <p className="font-semibold text-charcoal">Modül geçiş koşulu</p>
                <p>Okuma anlama puanı ve atanan egzersiz puanları ortalaması en az %70 olmalıdır.</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setFormOpen(false)}>İptal</Button>
                <Button type="submit" size="sm" variant="amber" disabled={isSaving || passages.length === 0}>
                  {isSaving ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Kaydediliyor</> : "Modülü kaydet"}
                </Button>
              </div>
              {passages.length === 0 && <p className="text-sm text-red-700">Yayınlanmış okuma metni bulunamadı; önce içerik yönetiminden metin ekleyin.</p>}
            </form>
          </CardContent>
        </Card>
      )}

      <section className="space-y-4" aria-label="Öğrenme modülleri">
        <h2 className="text-xl font-bold font-serif text-charcoal">Mevcut modüller ({modules.length})</h2>
        {modules.length === 0 ? (
          <Card><CardContent className="p-6 text-sm text-charcoal-muted">Henüz Firestore’da modül bulunmuyor. Yeni bir modül ekleyerek başlayın.</CardContent></Card>
        ) : modules.map((module) => (
          <Card key={module.id} className="border-sage-200">
            <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-charcoal">{module.title}</h3>
                  <Badge variant={module.status === "published" ? "success" : "outline"}>{module.status === "published" ? "Yayında" : "Taslak"}</Badge>
                </div>
                <p className="text-sm text-charcoal-muted">{module.description}</p>
                <p className="mt-1 text-xs text-charcoal-muted">
                  {DIFFICULTIES.find((level) => level.value === module.difficulty)?.label || module.difficulty}
                  {module.educationLevel ? ` · ${EDUCATION_LEVELS.find((level) => level.value === module.educationLevel)?.label}` : ""}
                  {` · ${module.estimatedDuration} dk · Sıra ${module.order}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-2 text-xs text-charcoal-muted sm:items-end">
                <span>{module.exerciseTypes?.length || 0} egzersiz türü atanmış</span>
                <Link href={`/yonetim/moduller/egzersiz-sec?moduleId=${encodeURIComponent(module.id)}`}>
                  <Button size="sm" variant="outline"><Eye className="mr-1.5 h-4 w-4" />Egzersizleri seç</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
