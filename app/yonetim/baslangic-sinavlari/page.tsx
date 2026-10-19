"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  PlacementExam,
  PlacementPassage,
  PlacementQuestion,
  EducationLevel,
  ContentStatus,
  PlacementQuestionCategory,
} from "@/lib/types";
import {
  getAllPlacementExams,
  getPlacementPassageById,
  getQuestionsByExamCode,
  savePlacementExam,
  savePlacementPassage,
  savePlacementQuestions,
} from "@/lib/services/placementExamService";
import { countTurkishWords, formatDuration } from "@/lib/utils/readingMetrics";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  Plus,
  Edit,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Copy,
  Archive,
  ArrowRight,
  ShieldCheck,
  BookOpen,
} from "lucide-react";

export default function BaslangicSinavlariYonetimPage() {
  const { profile } = useAuth();

  const [exams, setExams] = useState<PlacementExam[]>([]);
  const [loading, setLoading] = useState(true);

  // Düzenleme / Oluşturma Modalı
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingExamCode, setEditingExamCode] = useState<string | null>(null);

  // Form State
  const [formExamTitle, setFormExamTitle] = useState("");
  const [formExamCode, setFormExamCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formLevel, setFormLevel] = useState<EducationLevel>("middle");
  const [formStatus, setFormStatus] = useState<ContentStatus>("published");

  // Metin State
  const [formPassageTitle, setFormPassageTitle] = useState("");
  const [formPassageContent, setFormPassageContent] = useState("");
  const [formGenre, setFormGenre] = useState("bilgilendirici");
  const [formTopic, setFormTopic] = useState("");

  // 10 Soru State
  const [formQuestions, setFormQuestions] = useState<PlacementQuestion[]>([]);
  const [activeQuestionTab, setActiveQuestionTab] = useState(0);

  // Doğrulama Hataları
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Ön İzleme Modalı
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewExam, setPreviewExam] = useState<PlacementExam | null>(null);
  const [previewPassage, setPreviewPassage] = useState<PlacementPassage | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<PlacementQuestion[]>([]);

  useEffect(() => {
    loadAllExams();
  }, []);

  async function loadAllExams() {
    setLoading(true);
    try {
      const list = await getAllPlacementExams();
      setExams(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Yeni Sınav Formunu Aç
  const handleOpenNew = () => {
    setEditingExamCode(null);
    setFormExamTitle("");
    const newCode = "sinav-" + Date.now();
    setFormExamCode(newCode);
    setFormDescription("Yeni başlangıç okuma ve anlama seviye tespit sınavı.");
    setFormLevel("middle");
    setFormStatus("draft");

    setFormPassageTitle("");
    setFormPassageContent("");
    setFormGenre("bilgilendirici");
    setFormTopic("");

    // 10 adet boş soru taslağı oluştur
    const initial10: PlacementQuestion[] = Array.from({ length: 10 }).map((_, idx) => ({
      id: `q-${Date.now()}-${idx + 1}`,
      examId: newCode,
      examVersion: 1,
      passageVersion: 1,
      questionText: "",
      questionType: "acik_bilgi",
      options: [
        { id: "A", text: "" },
        { id: "B", text: "" },
        { id: "C", text: "" },
        { id: "D", text: "" },
      ],
      correctOptionId: "A",
      explanation: "",
      points: 10,
      order: idx + 1,
      status: "published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setFormQuestions(initial10);
    setActiveQuestionTab(0);
    setValidationErrors([]);
    setEditorModalOpen(true);
  };

  // Mevcut Sınavı Düzenleme Modunda Aç
  const handleEditExam = async (exam: PlacementExam) => {
    setEditingExamCode(exam.code);
    setFormExamTitle(exam.title);
    setFormExamCode(exam.code);
    setFormDescription(exam.description);
    setFormLevel(exam.educationLevels[0] || "middle");
    setFormStatus(exam.status);

    const passage = await getPlacementPassageById(exam.passageId);
    if (passage) {
      setFormPassageTitle(passage.title);
      setFormPassageContent(passage.content);
      setFormGenre(passage.genre);
      setFormTopic(passage.topic);
    }

    const qList = await getQuestionsByExamCode(exam.code);
    if (qList.length === 10) {
      setFormQuestions(qList);
    } else {
      // 10'a tamamla
      const filled: PlacementQuestion[] = Array.from({ length: 10 }).map((_, idx) => {
        if (qList[idx]) return qList[idx];
        return {
          id: `q-${exam.code}-${idx + 1}`,
          examId: exam.code,
          examVersion: 1,
          passageVersion: 1,
          questionText: "",
          questionType: "acik_bilgi",
          options: [
            { id: "A", text: "" },
            { id: "B", text: "" },
            { id: "C", text: "" },
            { id: "D", text: "" },
          ],
          correctOptionId: "A",
          explanation: "",
          points: 10,
          order: idx + 1,
          status: "published",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
      setFormQuestions(filled);
    }

    setActiveQuestionTab(0);
    setValidationErrors([]);
    setEditorModalOpen(true);
  };

  // Ön İzleme Aç
  const handleOpenPreview = async (exam: PlacementExam) => {
    const passage = await getPlacementPassageById(exam.passageId);
    const qList = await getQuestionsByExamCode(exam.code);
    setPreviewExam(exam);
    setPreviewPassage(passage);
    setPreviewQuestions(qList);
    setPreviewModalOpen(true);
  };

  // Soru Güncelleme
  const updateCurrentQuestion = (field: string, val: any) => {
    setFormQuestions((prev) => {
      const copy = [...prev];
      copy[activeQuestionTab] = {
        ...copy[activeQuestionTab],
        [field]: val,
      };
      return copy;
    });
  };

  const updateOptionText = (optionId: string, text: string) => {
    setFormQuestions((prev) => {
      const copy = [...prev];
      const q = copy[activeQuestionTab];
      const updatedOpts = q.options.map((opt) => (opt.id === optionId ? { ...opt, text } : opt));
      copy[activeQuestionTab] = { ...q, options: updatedOpts };
      return copy;
    });
  };

  // 9.4. Doğrulama Kuralları
  const validateBeforeSave = (): boolean => {
    const errors: string[] = [];

    if (!formExamTitle.trim()) errors.push("Sınav başlığı boş olamaz.");
    if (!formPassageTitle.trim()) errors.push("Metin başlığı boş olamaz.");
    if (!formPassageContent.trim()) errors.push("Metin içeriği boş olamaz.");

    if (formQuestions.length !== 10) {
      errors.push(`Sınavda tam olarak 10 soru bulunmalıdır. Mevcut: ${formQuestions.length}`);
    }

    formQuestions.forEach((q, idx) => {
      if (!q.questionText.trim()) {
        errors.push(`Soru ${idx + 1}: Soru metni doldurulmalıdır.`);
      }
      q.options.forEach((opt) => {
        if (!opt.text.trim()) {
          errors.push(`Soru ${idx + 1}: ${opt.id} seçeneği boş bırakılamaz.`);
        }
      });
      if (!["A", "B", "C", "D"].includes(q.correctOptionId)) {
        errors.push(`Soru ${idx + 1}: Geçerli bir doğru cevap (A, B, C veya D) seçilmelidir.`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Kaydetme İşlemi
  const handleSaveExam = async () => {
    if (!validateBeforeSave()) return;

    const passageId = editingExamCode ? `pass-${editingExamCode}` : `pass-${formExamCode}`;
    const wordCount = countTurkishWords(formPassageContent);
    const estimatedReadingSeconds = Math.round((wordCount / 180) * 60);

    const passageObj: PlacementPassage = {
      id: passageId,
      title: formPassageTitle,
      content: formPassageContent,
      wordCount,
      educationLevels: [formLevel],
      ageGroups: ["all"],
      difficulty: formLevel === "primary" ? "beginner" : formLevel === "middle" ? "intermediate" : "advanced",
      genre: formGenre,
      topic: formTopic || "Genel Kültür",
      version: 1,
      status: formStatus,
      createdBy: profile?.uid || "admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const examObj: PlacementExam = {
      id: formExamCode,
      code: formExamCode,
      title: formExamTitle,
      description: formDescription,
      educationLevels: [formLevel],
      ageGroups: ["all"],
      targetSkills: ["ana_fikir", "cikarim_yapma", "acik_bilgi"],
      passageId,
      passageVersion: 1,
      questionCount: 10,
      estimatedReadingSeconds,
      targetReadingSeconds: estimatedReadingSeconds + 15,
      readingTimeLimitEnabled: false,
      questionTimeLimitEnabled: false,
      status: formStatus,
      version: 1,
      createdBy: profile?.uid || "admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: formStatus === "published" ? new Date().toISOString() : undefined,
    };

    await savePlacementPassage(passageObj);
    await savePlacementExam(examObj);
    await savePlacementQuestions(formExamCode, formQuestions);

    setEditorModalOpen(false);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 4000);
    loadAllExams();
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl space-y-8">
      {/* Üst Başlık ve Eylemler */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-sage-200">
        <div>
          <Badge variant="amber" className="mb-1">İçerik Yönetim Modülü</Badge>
          <h1 className="text-3xl font-extrabold font-serif text-charcoal">
            Başlangıç Sınavı Yönetimi
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted">
            5 eğitim kademesi için seviye belirleme metinlerini ve 10 soruluk test paketlerini yönetin.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/panel/baslangic-sinavi">
            <Button size="sm" variant="outline">
              <Eye className="mr-1.5 h-4 w-4" /> Öğrenci Sınavını Başlat
            </Button>
          </Link>
          <Button size="sm" variant="amber" onClick={handleOpenNew}>
            <Plus className="mr-1.5 h-4 w-4" /> Yeni Sınav Paketi Ekle
          </Button>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Sınav paketi, metin ve 10 soru başarıyla doğrulandı ve kaydedildi.</span>
        </div>
      )}

      {/* Sınav Listesi Tablosu */}
      <div className="rounded-2xl border border-sage-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory-warm border-b border-sage-200 text-charcoal font-semibold">
              <tr>
                <th className="p-3.5">Sınav Adı</th>
                <th className="p-3.5">Kod</th>
                <th className="p-3.5">Kademe</th>
                <th className="p-3.5">Soru Sayısı</th>
                <th className="p-3.5">Tahmini Süre</th>
                <th className="p-3.5">Yayın Durumu</th>
                <th className="p-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100">
              {exams.map((ex) => (
                <tr key={ex.code} className="hover:bg-ivory-warm/50 transition-colors">
                  <td className="p-3.5 font-bold text-charcoal">{ex.title}</td>
                  <td className="p-3.5 font-mono text-[11px] text-charcoal-muted">{ex.code}</td>
                  <td className="p-3.5 capitalize">
                    <Badge variant="secondary" className="text-[10px]">
                      {ex.educationLevels.join(", ")}
                    </Badge>
                  </td>
                  <td className="p-3.5 font-mono font-semibold text-brand-900">
                    {ex.questionCount || 10} Soru
                  </td>
                  <td className="p-3.5 text-charcoal-muted">{ex.estimatedReadingSeconds} sn</td>
                  <td className="p-3.5">
                    <Badge variant={ex.status === "published" ? "success" : "outline"} className="text-[10px]">
                      {ex.status === "published" ? "Yayında" : "Taslak"}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => handleOpenPreview(ex)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Ön İzle
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEditExam(ex)}>
                      <Edit className="h-3.5 w-3.5 mr-1" /> Düzenle
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================== */}
      {/* SINAV VE 10 SORU DÜZENLEME MODALI                    */}
      {/* ===================================================== */}
      <Modal
        isOpen={editorModalOpen}
        onClose={() => setEditorModalOpen(false)}
        title={editingExamCode ? "Sınav Paketini Düzenle" : "Yeni Başlangıç Sınavı Oluştur"}
        description="Özgün metin ve tam olarak 10 çoktan seçmeli soru (A, B, C, D) yapılandırın."
        maxWidth="xl"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditorModalOpen(false)}>
              Vazgeç
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveExam}>
              Doğrula ve Kaydet
            </Button>
          </div>
        }
      >
        <div className="space-y-6 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {/* Doğrulama Hata Mesajları */}
          {validationErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                Lütfen aşağıdaki eksikleri tamamlayın:
              </span>
              <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Bölüm 1: Sınav Genel Bilgileri */}
          <div className="p-4 rounded-2xl bg-ivory-warm border border-sage-200 space-y-3">
            <h4 className="font-bold text-charcoal text-sm flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-brand-700" /> Sınav Genel Ayarları
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="font-semibold block mb-1">Sınav Adı</label>
                <input
                  type="text"
                  value={formExamTitle}
                  onChange={(e) => setFormExamTitle(e.target.value)}
                  placeholder="Örn: Ortaokul Başlangıç Seviye Tespit Sınavı"
                  className="w-full p-2.5 rounded-xl border border-sage-200 bg-white"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Sınav Kodu (Benzersiz)</label>
                <input
                  type="text"
                  value={formExamCode}
                  onChange={(e) => setFormExamCode(e.target.value)}
                  disabled={!!editingExamCode}
                  className="w-full p-2.5 rounded-xl border border-sage-200 bg-white font-mono"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Hedef Eğitim Kademesi</label>
                <select
                  value={formLevel}
                  onChange={(e) => setFormLevel(e.target.value as EducationLevel)}
                  className="w-full p-2 rounded-xl border border-sage-200 bg-white"
                >
                  <option value="primary">İlkokul</option>
                  <option value="middle">Ortaokul</option>
                  <option value="high">Lise</option>
                  <option value="university">Üniversite</option>
                  <option value="adult">Yetişkin</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Yayın Durumu</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as ContentStatus)}
                  className="w-full p-2 rounded-xl border border-sage-200 bg-white"
                >
                  <option value="published">Yayında</option>
                  <option value="draft">Taslak</option>
                  <option value="archived">Arşivlendi</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Konu</label>
                <input
                  type="text"
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  placeholder="Çevre, Doğa, Bilim vb."
                  className="w-full p-2.5 rounded-xl border border-sage-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Bölüm 2: Okuma Metni */}
          <div className="p-4 rounded-2xl bg-ivory-warm border border-sage-200 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-charcoal text-sm flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-brand-700" /> Okuma Metni
              </h4>
              <span className="font-mono text-charcoal-muted">
                Otomatik Kelime Sayısı: <strong>{countTurkishWords(formPassageContent)}</strong>
              </span>
            </div>
            <div>
              <label className="font-semibold block mb-1">Metin Başlığı</label>
              <input
                type="text"
                value={formPassageTitle}
                onChange={(e) => setFormPassageTitle(e.target.value)}
                placeholder="Metin Başlığı"
                className="w-full p-2.5 rounded-xl border border-sage-200 bg-white"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Metin İçeriği (Türkçe Karakter Destekli)</label>
              <textarea
                rows={6}
                value={formPassageContent}
                onChange={(e) => setFormPassageContent(e.target.value)}
                placeholder="Paragrafları buraya girin..."
                className="w-full p-3 rounded-xl border border-sage-200 bg-white font-serif leading-relaxed"
              />
            </div>
          </div>

          {/* Bölüm 3: 10 Soru Yönetimi */}
          <div className="p-4 rounded-2xl bg-ivory-warm border border-sage-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-charcoal text-sm flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-amber-600" /> Soru Bankası (Tam 10 Soru)
              </h4>
              <span className="text-xs text-charcoal-muted">
                Her soruda 4 seçenek (A, B, C, D) ve 1 doğru cevap zorunludur.
              </span>
            </div>

            {/* Soru Seçme Sekmeleri */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {formQuestions.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveQuestionTab(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    activeQuestionTab === i
                      ? "bg-brand-700 text-white shadow-sm"
                      : "bg-white text-charcoal hover:bg-sage-100 border border-sage-200"
                  }`}
                >
                  Soru {i + 1}
                </button>
              ))}
            </div>

            {/* Seçili Soru Alanları */}
            {formQuestions[activeQuestionTab] && (
              <div className="space-y-4 bg-white p-4 rounded-xl border border-sage-200">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="font-semibold block mb-1">Soru {activeQuestionTab + 1} Metni</label>
                    <input
                      type="text"
                      value={formQuestions[activeQuestionTab].questionText}
                      onChange={(e) => updateCurrentQuestion("questionText", e.target.value)}
                      placeholder="Soru kökünü buraya yazın..."
                      className="w-full p-2.5 rounded-xl border border-sage-200"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Soru Türü</label>
                    <select
                      value={formQuestions[activeQuestionTab].questionType}
                      onChange={(e) => updateCurrentQuestion("questionType", e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-sage-200 bg-white"
                    >
                      <option value="acik_bilgi">Açık Bilgi Bulma</option>
                      <option value="ana_fikir">Ana Fikir / Yardımcı Düşünce</option>
                      <option value="cikarim">Çıkarım / Neden-Sonuç</option>
                      <option value="kelime_anlami">Kelime / Bağlam Anlamı</option>
                      <option value="siralama">Sıralama / Karşılaştırma</option>
                      <option value="yazar_amaci">Yazarın Amacı / Bütüncül Yorum</option>
                    </select>
                  </div>
                </div>

                {/* 4 Seçenek (A, B, C, D) ve Doğru Cevap Radio */}
                <div className="space-y-2">
                  <label className="font-semibold block text-xs">
                    Seçenekler ve Doğru Cevap (Doğru seçeneği işaretleyin):
                  </label>
                  {formQuestions[activeQuestionTab].options.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <label className="flex items-center gap-1 font-bold text-xs shrink-0 cursor-pointer">
                        <input
                          type="radio"
                          name={`correct_${activeQuestionTab}`}
                          checked={formQuestions[activeQuestionTab].correctOptionId === opt.id}
                          onChange={() => updateCurrentQuestion("correctOptionId", opt.id)}
                          className="accent-brand-700"
                        />
                        <span className="w-5 text-center">{opt.id}:</span>
                      </label>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => updateOptionText(opt.id, e.target.value)}
                        placeholder={`${opt.id} seçeneği metni...`}
                        className={`w-full p-2 text-xs rounded-xl border ${
                          formQuestions[activeQuestionTab].correctOptionId === opt.id
                            ? "border-emerald-500 bg-emerald-50/40 font-medium"
                            : "border-sage-200"
                        }`}
                      />
                    </div>
                  ))}
                </div>

                {/* Açıklama / Gerekçe */}
                <div>
                  <label className="font-semibold block mb-1">Doğru Cevap Gerekçesi / Açıklaması</label>
                  <input
                    type="text"
                    value={formQuestions[activeQuestionTab].explanation}
                    onChange={(e) => updateCurrentQuestion("explanation", e.target.value)}
                    placeholder="Sınav bitiminde öğrenciye veya incelemede gösterilecek açıklama..."
                    className="w-full p-2.5 rounded-xl border border-sage-200 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ===================================================== */}
      {/* 9.5. ÖN İZLEME MODALI (Gerçek Kullanıcı Verisine Karışmaz) */}
      {/* ===================================================== */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={`Sınav Ön İzlemesi: ${previewExam?.title || ""}`}
        description="Öğrencinin başlangıç sınavı ekranındaki görünüm simülasyonudur."
        maxWidth="lg"
        footer={
          <Button variant="outline" size="sm" onClick={() => setPreviewModalOpen(false)}>
            Ön İzlemeyi Kapat
          </Button>
        }
      >
        <div className="space-y-6 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {previewPassage && (
            <div className="p-6 rounded-2xl bg-white border border-sage-200 space-y-3">
              <h3 className="text-xl font-bold font-serif text-charcoal">{previewPassage.title}</h3>
              <div className="text-charcoal-muted leading-relaxed font-serif text-sm">
                {previewPassage.content.split("\n\n").map((par, i) => (
                  <p key={i} className="mb-3 text-justify">
                    {par}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-bold text-charcoal text-sm">Sınav Soruları (Toplam 10 Soru):</h4>
            {previewQuestions.map((q, idx) => (
              <div key={q.id} className="p-4 rounded-xl bg-ivory-warm border border-sage-200 space-y-2">
                <span className="font-bold text-charcoal">
                  Soru {idx + 1}: {q.questionText}
                </span>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                        opt.id === q.correctOptionId
                          ? "bg-emerald-50 border-emerald-400 font-bold text-emerald-900"
                          : "bg-white border-sage-200 text-charcoal"
                      }`}
                    >
                      <span className="font-bold">{opt.id})</span>
                      <span>{opt.text}</span>
                      {opt.id === q.correctOptionId && (
                        <span className="text-[10px] text-emerald-700 ml-auto">(Doğru Cevap)</span>
                      )}
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <p className="text-[11px] text-charcoal-muted italic pt-1">
                    Gerekçe: {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
