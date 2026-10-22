"use client";

import React, { useState, useEffect } from "react";
import { fetchPassages } from "@/lib/services/contentService";
import { saveReadingPassage } from "@/lib/firebase/firestore";
import BaslangicSinavlariYonetimPage from "../baslangic-sinavlari/page";
import { ReadingPassage, DifficultyLevel, ContentStatus, LearningStage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { countTurkishWords } from "@/lib/utils";
import { Plus, Edit, FileText, CheckCircle2, ClipboardCheck } from "lucide-react";

const learningStages: { value: LearningStage; label: string }[] = [
  { value: "placement_exam", label: "Başlangıç sınavı" },
  { value: "module_1", label: "Modül 1" },
  { value: "module_2", label: "Modül 2" },
  { value: "module_3", label: "Modül 3" },
  { value: "module_4", label: "Modül 4" },
  { value: "module_5", label: "Modül 5" },
  { value: "exercises", label: "Alıştırmalar" },
];

export default function IcerikYonetimiPage() {
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [activeTab, setActiveTab] = useState<"content" | "exams">("content");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form alanları
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [genre, setGenre] = useState<ReadingPassage["genre"]>("bilgilendirici");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("intermediate");
  const [learningStage, setLearningStage] = useState<LearningStage>("module_1");
  const [status, setStatus] = useState<ContentStatus>("published");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const list = await fetchPassages();
      setPassages(list);
    }
    load();
  }, []);

  const handleOpenNew = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setGenre("bilgilendirici");
    setTopic("");
    setDifficulty("intermediate");
    setLearningStage("module_1");
    setStatus("published");
    setSaveError(null);
    setModalOpen(true);
  };

  const handleEdit = (p: ReadingPassage) => {
    setEditingId(p.id);
    setTitle(p.title);
    setContent(p.content);
    setGenre(p.genre);
    setTopic(p.topic);
    setDifficulty(p.difficulty);
    setLearningStage(p.learningStage || "module_1");
    setStatus(p.status);
    setSaveError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setSaveError("Metin başlığı ve içeriği boş bırakılamaz.");
      return;
    }

    const wordCount = countTurkishWords(content);
    const estimatedReadingTime = Math.round((wordCount / 180) * 60);

    const now = new Date().toISOString();
    const passageData: Omit<ReadingPassage, "id"> = {
      title,
      content,
      wordCount,
      educationLevels: ["middle", "high"],
      ageGroups: ["12-18"],
      difficulty,
      genre,
      learningStage,
      topic: topic || "Genel Kültür",
      targetSkills: ["ana_fikir", "cikarim_yapma"],
      estimatedReadingTime,
      status,
      version: editingId ? 2 : 1,
      createdBy: "editor",
      createdAt: now,
      updatedAt: now,
      ...(status === "published" ? { publishedAt: now } : {}),
    };

    setSaveError(null);
    try {
      const savedId = await saveReadingPassage(passageData, editingId || undefined);
      const passageId = editingId || savedId || "metin-" + Date.now();
      setPassages((prev) =>
        editingId
          ? prev.map((item) =>
              item.id === editingId ? { id: passageId, ...passageData } : item
            )
          : [{ id: passageId, ...passageData }, ...prev]
      );
      setModalOpen(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("İçerik kaydedilemedi:", error);
      setSaveError(
        error instanceof Error ? error.message : "İçerik kaydedilirken beklenmeyen bir hata oluştu."
      );
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-sage-200">
        <div>
          <Badge variant="amber" className="mb-1">Eğitsel İçerik & Sürüm Kontrolü</Badge>
          <h1 className="text-3xl font-extrabold font-serif text-charcoal">İçerik ve Sınav Yönetimi</h1>
          <p className="text-xs sm:text-sm text-charcoal-muted">
            Okuma içeriklerini ve başlangıç sınavlarını tek bir yerden yönetin.
          </p>
        </div>

        {activeTab === "content" && (
          <Button size="sm" variant="amber" onClick={handleOpenNew}>
            <Plus className="mr-1.5 h-4 w-4" /> Yeni İçerik Ekle
          </Button>
        )}
      </div>

      <div role="tablist" aria-label="Yönetilecek içerik türü" className="flex gap-2 border-b border-sage-200">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "content"}
          onClick={() => setActiveTab("content")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "content"
              ? "border-brand-700 text-brand-800"
              : "border-transparent text-charcoal-muted hover:text-charcoal"
          }`}
        >
          <FileText className="h-4 w-4" /> İçerikler
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "exams"}
          onClick={() => setActiveTab("exams")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "exams"
              ? "border-brand-700 text-brand-800"
              : "border-transparent text-charcoal-muted hover:text-charcoal"
          }`}
        >
          <ClipboardCheck className="h-4 w-4" /> Sınavlar
        </button>
      </div>

      {activeTab === "exams" ? (
        <BaslangicSinavlariYonetimPage />
      ) : (
        <>
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>İçerik başarıyla kaydedildi ve yayın durumu güncellendi.</span>
        </div>
      )}

      {/* Metin Listesi */}
      <div className="rounded-2xl border border-sage-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory-warm border-b border-sage-200 text-charcoal font-semibold">
              <tr>
                <th className="p-3.5">Başlık</th>
                <th className="p-3.5">Seviye</th>
                <th className="p-3.5">Tür</th>
                <th className="p-3.5">Zorluk</th>
                <th className="p-3.5">Kelime</th>
                <th className="p-3.5">Sürüm</th>
                <th className="p-3.5">Durum</th>
                <th className="p-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100">
              {passages.map((p) => (
                <tr key={p.id} className="hover:bg-ivory-warm/50 transition-colors">
                  <td className="p-3.5 font-bold text-charcoal">{p.title}</td>
                  <td className="p-3.5 text-charcoal-muted">
                    {learningStages.find((stage) => stage.value === p.learningStage)?.label || "—"}
                  </td>
                  <td className="p-3.5 capitalize text-charcoal-muted">{p.genre}</td>
                  <td className="p-3.5 capitalize">{p.difficulty}</td>
                  <td className="p-3.5 text-charcoal-muted">{p.wordCount || countTurkishWords(p.content)}</td>
                  <td className="p-3.5 font-mono text-brand-900">v{p.version || 1}.0</td>
                  <td className="p-3.5">
                    <Badge variant={p.status === "published" ? "success" : "outline"} className="text-[10px]">
                      {p.status === "published" ? "Yayında" : "Taslak"}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-right">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(p)}>
                      <Edit className="h-3.5 w-3.5 mr-1" /> Düzenle
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metin Ekle / Düzenle Modalı */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Metni Düzenle" : "Yeni Okuma Metni Oluştur"}
        description="Özgün, telif haklarına uygun ve seçilen seviyeye uygun eğitsel içerik girin."
        maxWidth="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              İptal
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Kaydet ve Güncelle
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {saveError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
              {saveError}
            </div>
          )}
          <div>
            <label className="block font-semibold mb-1">Metin Başlığı</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Biyomimikri: Doğadan İlham Alan Mühendislik"
              className="w-full p-2.5 rounded-xl border border-sage-200 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block font-semibold mb-1">Tür</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value as ReadingPassage["genre"])}
                className="w-full p-2 rounded-xl border border-sage-200 bg-white"
              >
                <option value="bilgilendirici">Bilgilendirici</option>
                <option value="aciklayici">Açıklayıcı</option>
                <option value="oykuleyici">Öyküleyici</option>
                <option value="akademik">Akademik</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Seviye</label>
              <select
                value={learningStage}
                onChange={(e) => setLearningStage(e.target.value as LearningStage)}
                className="w-full p-2 rounded-xl border border-sage-200 bg-white"
              >
                {learningStages.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Zorluk Seviyesi</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full p-2 rounded-xl border border-sage-200 bg-white"
              >
                <option value="beginner">Başlangıç</option>
                <option value="intermediate">Orta Düzey</option>
                <option value="advanced">İleri Düzey</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Yayın Durumu</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
                className="w-full p-2 rounded-xl border border-sage-200 bg-white"
              >
                <option value="published">Yayında</option>
                <option value="draft">Taslak</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold">Metin İçeriği (Türkçe Karakter Desteğiyle)</label>
              <span className="text-charcoal-muted font-mono">{countTurkishWords(content)} Kelime</span>
            </div>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Metnin paragraflarını buraya yazın..."
              className="w-full p-3 rounded-xl border border-sage-200 bg-white font-serif text-sm leading-relaxed"
            />
          </div>
        </div>
      </Modal>
        </>
      )}
    </div>
  );
}
