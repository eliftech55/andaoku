"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getExerciseDefinitions,
  initializeExerciseCatalog,
  saveExerciseDefinition,
} from "@/lib/firebase/firestore";
import { ExerciseDefinition, ExerciseKind } from "@/lib/types";
import { CheckCircle2, Eye, LoaderCircle, Save } from "lucide-react";

const KIND_LABELS: Record<ExerciseKind, string> = {
  peripheral_vision: "Çevresel Görüş",
  target_scan: "Hedef ve Harf Tarama",
  eye_saccade: "Göz Sıçraması",
  flash_words: "Flaş Kelime Tanıma",
};

const KIND_ORDER = Object.keys(KIND_LABELS) as ExerciseKind[];

export default function ExerciseManagementPage() {
  const { profile, loading: authLoading } = useAuth();
  const [definitions, setDefinitions] = useState<ExerciseDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadDefinitions = async () => {
    try {
      setDefinitions(await getExerciseDefinitions());
      setError(null);
    } catch (loadError) {
      console.error("Egzersiz tanımları yüklenemedi:", loadError);
      setError("Egzersizler yüklenemedi. Firestore bağlantısını ve yönetici erişimini kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || profile?.role !== "admin") {
      setLoading(false);
      return;
    }
    void loadDefinitions();
  }, [authLoading, profile]);

  const handleInitialize = async () => {
    setInitializing(true);
    setError(null);
    setNotice(null);
    try {
      await initializeExerciseCatalog();
      await loadDefinitions();
      setNotice("Dört egzersiz türünün beşer seviyesi kataloğa eklendi. Var olan ayarlar korunmuştur.");
    } catch (initializeError) {
      console.error("Egzersiz kataloğu oluşturulamadı:", initializeError);
      setError("Egzersiz kataloğu oluşturulamadı. Firestore yazma erişimini kontrol edin.");
    } finally {
      setInitializing(false);
    }
  };

  const updateDefinition = (id: string, update: Partial<ExerciseDefinition>) => {
    setDefinitions((current) =>
      current.map((definition) => definition.id === id ? { ...definition, ...update } : definition)
    );
  };

  const handleSave = async (definition: ExerciseDefinition) => {
    setSavingId(definition.id);
    setError(null);
    setNotice(null);
    try {
      await saveExerciseDefinition(definition);
      setNotice(`${definition.title} ayarları kaydedildi.`);
    } catch (saveError) {
      console.error("Egzersiz ayarı kaydedilemedi:", saveError);
      setError("Egzersiz ayarı kaydedilemedi. Değişiklikleri kaydetme yetkisini kontrol edin.");
    } finally {
      setSavingId(null);
    }
  };

  if (authLoading || loading) {
    return <div className="container mx-auto px-4 py-10 text-center text-charcoal-muted">Egzersizler yükleniyor...</div>;
  }
  if (profile?.role !== "admin") {
    return <div className="container mx-auto px-4 py-10"><p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Egzersiz yönetimi için yönetici yetkisi gerekir.</p></div>;
  }

  const grouped = KIND_ORDER.map((kind) => ({
    kind,
    items: definitions.filter((definition) => definition.kind === kind).sort((a, b) => a.level - b.level),
  }));

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col items-start justify-between gap-4 border-b border-sage-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <Badge variant="amber" className="mb-1">Eğitsel İçerik</Badge>
          <h1 className="text-3xl font-extrabold font-serif text-charcoal">Egzersiz Yönetimi</h1>
          <p className="text-sm text-charcoal-muted">Dört göz/okuma egzersizi türünü ve kolaydan zora beş seviyesini düzenleyin.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/yonetim">
            <Button size="sm" variant="outline">Yönetim Paneline Dön</Button>
          </Link>
          <Button size="sm" variant="amber" onClick={handleInitialize} disabled={initializing}>
            {initializing ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Hazırlanıyor</> : <><Eye className="mr-2 h-4 w-4" />{definitions.length ? "Eksik seviyeleri ekle" : "Egzersiz kataloğunu oluştur"}</>}
          </Button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p>}
      {notice && <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 className="h-4 w-4" />{notice}</p>}

      {definitions.length === 0 ? (
        <Card><CardContent className="p-6 text-sm text-charcoal-muted">Katalog henüz oluşturulmadı. Dört egzersizin tüm seviyelerini Firestore’a eklemek için yukarıdaki düğmeyi kullanın.</CardContent></Card>
      ) : grouped.map(({ kind, items }) => (
        <section key={kind} className="space-y-3">
          <h2 className="text-xl font-bold font-serif text-charcoal">{KIND_LABELS[kind]}</h2>
          {items.map((definition) => (
            <Card key={definition.id} className="border-sage-200">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{definition.title}</CardTitle>
                  <Badge variant={definition.status === "published" ? "success" : "outline"}>{definition.status === "published" ? "Kullanılabilir" : "Taslak"}</Badge>
                </div>
                <p className="text-sm text-charcoal-muted">{definition.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="block space-y-1 text-sm font-medium">
                  Yönerge
                  <textarea rows={2} maxLength={500} value={definition.instructions} onChange={(event) => updateDefinition(definition.id, { instructions: event.target.value })} className="w-full rounded-xl border border-sage-200 p-2.5" />
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {definition.config.gridSize !== undefined && (
                    <label className="space-y-1 text-sm font-medium">Izgara boyutu
                      <input type="number" min={3} max={10} value={definition.config.gridSize} onChange={(event) => updateDefinition(definition.id, { config: { ...definition.config, gridSize: Number(event.target.value) } })} className="w-full rounded-xl border border-sage-200 p-2.5" />
                    </label>
                  )}
                  {definition.config.targetCount !== undefined && (
                    <label className="space-y-1 text-sm font-medium">Hedef / tur sayısı
                      <input type="number" min={3} max={30} value={definition.config.targetCount} onChange={(event) => updateDefinition(definition.id, { config: { ...definition.config, targetCount: Number(event.target.value) } })} className="w-full rounded-xl border border-sage-200 p-2.5" />
                    </label>
                  )}
                  {definition.config.timeLimitSeconds !== undefined && (
                    <label className="space-y-1 text-sm font-medium">Süre (saniye)
                      <input type="number" min={10} max={180} value={definition.config.timeLimitSeconds} onChange={(event) => updateDefinition(definition.id, { config: { ...definition.config, timeLimitSeconds: Number(event.target.value) } })} className="w-full rounded-xl border border-sage-200 p-2.5" />
                    </label>
                  )}
                  {definition.config.sequenceLength !== undefined && kind === "eye_saccade" && (
                    <label className="space-y-1 text-sm font-medium">Sıçrama adımı
                      <input type="number" min={3} max={20} value={definition.config.sequenceLength} onChange={(event) => updateDefinition(definition.id, { config: { ...definition.config, sequenceLength: Number(event.target.value) } })} className="w-full rounded-xl border border-sage-200 p-2.5" />
                    </label>
                  )}
                  {definition.config.flashDurationMs !== undefined && kind === "flash_words" && (
                    <label className="space-y-1 text-sm font-medium">Kelime gösterim süresi (ms)
                      <input type="number" min={200} max={3000} step={100} value={definition.config.flashDurationMs} onChange={(event) => updateDefinition(definition.id, { config: { ...definition.config, flashDurationMs: Number(event.target.value) } })} className="w-full rounded-xl border border-sage-200 p-2.5" />
                    </label>
                  )}
                  <label className="flex items-end gap-2 pb-2 text-sm font-medium">
                    <input type="checkbox" checked={definition.status === "published"} onChange={(event) => updateDefinition(definition.id, { status: event.target.checked ? "published" : "draft" })} />
                    Modül seçiminde kullanılabilir
                  </label>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => handleSave(definition)} disabled={savingId === definition.id}>
                    {savingId === definition.id ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Seviyeyi kaydet
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length !== 5 && <p className="text-sm text-amber-800">Bu egzersiz türünde 5 seviye yok. Kataloğu oluştur/eksik seviyeleri ekle düğmesini kullanın.</p>}
        </section>
      ))}
    </div>
  );
}
