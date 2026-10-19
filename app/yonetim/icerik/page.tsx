"use client";

import React, { useState, useEffect } from "react";
import { fetchPassages } from "@/lib/services/contentService";
import { saveReadingPassage } from "@/lib/firebase/firestore";
import { ReadingPassage, DifficultyLevel, ContentStatus } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { countTurkishWords } from "@/lib/utils";
import { Plus, Edit, FileText, CheckCircle2, Eye, ShieldAlert } from "lucide-react";

export default function IcerikYonetimiPage() {
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form alanları
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [genre, setGenre] = useState<any>("bilgilendirici");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("intermediate");
  const [status, setStatus] = useState<ContentStatus>("published");
  const [saveSuccess, setSaveSuccess] = useState(false);

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
    setStatus("published");
    setModalOpen(true);
  };

  const handleEdit = (p: ReadingPassage) => {
    setEditingId(p.id);
    setTitle(p.title);
    setContent(p.content);
    setGenre(p.genre);
    setTopic(p.topic);
    setDifficulty(p.difficulty);
    setStatus(p.status);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!title || !content) return;

    const wordCount = countTurkishWords(content);
    const estimatedReadingTime = Math.round((wordCount / 180) * 60);

    const passageData = {
      title,
      content,
      wordCount,
      educationLevels: ["middle", "high"] as any,
      ageGroups: ["12-18"],
      difficulty,
      genre,
      topic: topic || "Genel Kültür",
      targetSkills: ["ana_fikir", "cikarim_yapma"],
      estimatedReadingTime,
      status,
      version: editingId ? 2 : 1,
      createdBy: "editor",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: status === "published" ? new Date().toISOString() : undefined,
    };

    if (editingId) {
      setPassages((prev) =>
        prev.map((item) => (item.id === editingId ? { id: editingId, ...passageData } : item))
      );
    } else {
      const newId = "metin-" + Date.now();
      setPassages((prev) => [{ id: newId, ...passageData }, ...prev]);
    }

    setModalOpen(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);

    try {
      await saveReadingPassage(passageData, editingId || undefined);
    } catch (e) {}
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-sage-200">
        <div>
          <Badge variant="amber" className="mb-1">Eğitsel İçerik & Sürüm Kontrolü</Badge>
          <h1 className="text-3xl font-extrabold font-serif text-charcoal">İçerik Yönetim Paneli</h1>
          <p className="text-xs sm:text-sm text-charcoal-muted">
            Okuma metinleri, anlama soruları, zorluk dereceleri ve yayın durumlarını yapılandırın.
          </p>
        </div>

        <Button size="sm" variant="amber" onClick={handleOpenNew}>
          <Plus className="mr-1.5 h-4 w-4" /> Yeni Okuma Metni Ekle
        </Button>
      </div>

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
        description="Özgün, telif haklarına uygun ve hedef yaş grubuna hitap eden eğitsel içerik girin."
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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Tür</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full p-2 rounded-xl border border-sage-200 bg-white"
              >
                <option value="bilgilendirici">Bilgilendirici</option>
                <option value="aciklayici">Açıklayıcı</option>
                <option value="oykuleyici">Öyküleyici</option>
                <option value="akademik">Akademik</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Zorluk Seviyesi</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
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
                onChange={(e) => setStatus(e.target.value as any)}
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
    </div>
  );
}
