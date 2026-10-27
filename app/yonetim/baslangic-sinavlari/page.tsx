"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  PlacementExam,
  PlacementPassage,
  PlacementQuestion,
  EducationLevel,
  DifficultyLevel,
  ContentStatus,
  PlacementQuestionCategory,
} from "@/lib/types";
import {
  getPlacementExamsFromDatabase,
  getPlacementPassageFromDatabase,
  getPlacementQuestionsFromDatabase,
  deletePlacementExamPackageFromDatabase,
  savePlacementExamPackageToDatabase,
} from "@/lib/services/placementExamService";
import { countTurkishWords, formatDuration } from "@/lib/utils/readingMetrics";
import { generatedContentSchema } from "@/lib/validation/generatedContent";
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
  Trash2,
  ArrowRight,
  ShieldCheck,
  BookOpen,
} from "lucide-react";

const difficultyLevels: { value: DifficultyLevel; label: string }[] = [
  { value: "beginner", label: "Kolay" },
  { value: "intermediate", label: "Orta" },
  { value: "advanced", label: "Zor" },
];

const GENERATION_POLL_INTERVAL_MS = 10000;
const MAX_GENERATION_POLL_ATTEMPTS = 60;

function getApiErrorMessage(body: unknown, fallback: string): string {
  return typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
    ? body.error
    : fallback;
}

export default function BaslangicSinavlariYonetimPage() {
  const { profile, user } = useAuth();

  const [exams, setExams] = useState<PlacementExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingExamCode, setDeletingExamCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false);

  // Düzenleme / Oluşturma Modalı
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingExamCode, setEditingExamCode] = useState<string | null>(null);

  // Form State
  const [formExamTitle, setFormExamTitle] = useState("");
  const [formExamCode, setFormExamCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDifficulty, setFormDifficulty] = useState<DifficultyLevel>("beginner");
  const [formEducationLevels, setFormEducationLevels] = useState<EducationLevel[]>(["middle"]);
  const [formStatus, setFormStatus] = useState<ContentStatus>("published");

  // Metin State
  const [formPassageTitle, setFormPassageTitle] = useState("");
  const [formPassageContent, setFormPassageContent] = useState("");
  const [formGenre, setFormGenre] = useState("bilgilendirici");
  const [formTopic, setFormTopic] = useState("");

  // En fazla 10 soru
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

  const createEmptyQuestion = (examCode: string, order: number): PlacementQuestion => ({
    id: `q-${examCode}-${Date.now()}-${order}`,
    examId: examCode,
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
    order,
    status: "published",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  useEffect(() => {
    loadAllExams();
  }, []);

  async function loadAllExams() {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await getPlacementExamsFromDatabase();
      setExams(list);
    } catch (e) {
      console.error(e);
      setLoadError(
        e instanceof Error
          ? e.message
          : "Başlangıç sınavları veritabanından yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteExam = async (exam: PlacementExam) => {
    if (deletingExamCode) return;
    const confirmed = window.confirm(
      `"${exam.title}" içerik paketini silmek istediğinize emin misiniz? Bu işlem pakete ait metin ve soruları da siler. Öğrenci sınav sonuçları korunur.`
    );
    if (!confirmed) return;

    setDeletingExamCode(exam.code);
    setLoadError(null);
    try {
      await deletePlacementExamPackageFromDatabase(exam);
      setExams((currentExams) => currentExams.filter((item) => item.code !== exam.code));
    } catch (error) {
      console.error("İçerik paketi silinemedi:", error);
      setLoadError(
        error instanceof Error ? error.message : "İçerik paketi silinirken beklenmeyen bir hata oluştu."
      );
    } finally {
      setDeletingExamCode(null);
    }
  };

  // Yeni içerik paketini aç
  const handleOpenNew = () => {
    setEditingExamCode(null);
    setFormExamTitle("");
    const newCode = "sinav-" + Date.now();
    setFormExamCode(newCode);
    setFormDescription("Yeni okuma ve anlama içerik paketi.");
    setFormDifficulty("beginner");
    setFormEducationLevels(["middle"]);
    setFormStatus("draft");

    setFormPassageTitle("");
    setFormPassageContent("");
    setFormGenre("bilgilendirici");
    setFormTopic("");

    setFormQuestions([createEmptyQuestion(newCode, 1)]);
    setActiveQuestionTab(0);
    setValidationErrors([]);
    setGenerationError(null);
    setHasGeneratedContent(false);
    setEditorModalOpen(true);
  };

  const handleGenerateContent = async () => {
    if (isGenerating) return;
    if (!user) {
      setGenerationError("Yapay zekâ kullanımı için yönetici hesabıyla oturum açın.");
      return;
    }
    if (formTopic.trim().length < 2) {
      setGenerationError("Önce konu alanına en az 2 karakterlik bir konu yazın.");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/admin/generate-content", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: formTopic.trim(),
          targetDifficulty: formDifficulty,
          educationLevels: formEducationLevels,
        }),
      });
      const responseBody: unknown = await response.json();
      if (!response.ok) {
        throw new Error(getApiErrorMessage(responseBody, "Yapay zekâ içerik üretemedi."));
      }
      if (
        typeof responseBody !== "object" ||
        responseBody === null ||
        !("interactionId" in responseBody) ||
        typeof responseBody.interactionId !== "string"
      ) {
        throw new Error("Gemini içerik üretim görevi başlatılamadı.");
      }

      let generatedResponse: unknown;
      let cleanupWarning = false;
      for (let attempt = 0; attempt < MAX_GENERATION_POLL_ATTEMPTS; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, GENERATION_POLL_INTERVAL_MS));
        const statusResponse = await fetch(
          `/api/admin/generate-content?interactionId=${encodeURIComponent(responseBody.interactionId)}`,
          {
            headers: { Authorization: `Bearer ${idToken}` },
            cache: "no-store",
          }
        );
        if (statusResponse.status === 202) continue;

        const statusBody: unknown = await statusResponse.json();
        if (!statusResponse.ok) {
          throw new Error(getApiErrorMessage(statusBody, "Gemini içerik üretemedi."));
        }
        generatedResponse = statusBody;
        cleanupWarning = statusResponse.headers.get("X-Gemini-Interaction-Cleanup") === "failed";
        break;
      }
      if (generatedResponse === undefined) {
        throw new Error("Gemini üretimi beklenenden uzun sürüyor. Lütfen daha sonra tekrar deneyin.");
      }
      const result = generatedContentSchema.parse(generatedResponse);
      if (cleanupWarning) {
        setGenerationError(
          "İçerik oluşturuldu ancak Google’daki geçici kayıt otomatik silinemedi. Lütfen destek ekibiyle iletişime geçin."
        );
      }

      const generatedExamCode = editingExamCode || formExamCode;
      const now = new Date().toISOString();
      const generatedQuestions: PlacementQuestion[] = result.questions.map((question, index) => ({
          id: `q-${generatedExamCode}-${Date.now()}-${index + 1}`,
          examId: generatedExamCode,
          examVersion: 1,
          passageVersion: 1,
          questionText: question.questionText,
          questionType: question.questionType,
          options: question.options,
          correctOptionId: question.correctOptionId,
          explanation: question.explanation,
          points: 10,
          order: index + 1,
          status: "draft",
          createdAt: now,
          updatedAt: now,
        }));

      setFormExamTitle(result.title);
      setFormDescription(result.description);
      setFormPassageTitle(result.passageTitle);
      setFormPassageContent(result.passageContent);
      setFormGenre(result.genre);
      setFormTopic(result.topic);
      setFormDifficulty(result.difficulty);
      setFormQuestions(generatedQuestions);
      setActiveQuestionTab(0);
      setFormStatus("draft");
      setHasGeneratedContent(true);
      setValidationErrors([]);
    } catch (error) {
      console.error("Yapay zekâ içerik oluşturma isteği başarısız:", error);
      setGenerationError(
        error instanceof Error ? error.message : "İçerik oluşturulurken beklenmeyen bir hata oluştu."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Mevcut Sınavı Düzenleme Modunda Aç
  const handleEditExam = async (exam: PlacementExam) => {
    setEditingExamCode(exam.code);
    setFormExamTitle(exam.title);
    setFormExamCode(exam.code);
    setFormDescription(exam.description);
    setFormDifficulty(exam.difficulty || "beginner");
    setFormEducationLevels(exam.educationLevels?.length ? exam.educationLevels : ["middle"]);
    setFormStatus(exam.status);
    setGenerationError(null);
    setHasGeneratedContent(false);

    setLoadError(null);
    try {
      const [passage, qList] = await Promise.all([
        getPlacementPassageFromDatabase(exam.passageId),
        getPlacementQuestionsFromDatabase(exam.code),
      ]);
      if (!passage) {
        throw new Error("Bu sınava bağlı okuma metni veritabanında bulunamadı.");
      }
      if (qList.length < 1 || qList.length > 10) {
        throw new Error(`Bu sınav için veritabanında 1-10 arasında soru bekleniyor; ${qList.length} soru bulundu.`);
      }

      setFormPassageTitle(passage.title);
      setFormPassageContent(passage.content);
      setFormGenre(passage.genre);
      setFormTopic(passage.topic);
      setFormQuestions(qList);
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : "Sınav paketi veritabanından yüklenemedi."
      );
      return;
    }

    setActiveQuestionTab(0);
    setValidationErrors([]);
    setEditorModalOpen(true);
  };

  // Ön İzleme Aç
  const handleOpenPreview = async (exam: PlacementExam) => {
    setLoadError(null);
    try {
      const [passage, qList] = await Promise.all([
        getPlacementPassageFromDatabase(exam.passageId),
        getPlacementQuestionsFromDatabase(exam.code),
      ]);
      if (!passage) {
        throw new Error("Bu sınava bağlı okuma metni veritabanında bulunamadı.");
      }
      setPreviewExam(exam);
      setPreviewPassage(passage);
      setPreviewQuestions(qList);
      setPreviewModalOpen(true);
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : "Sınav ön izlemesi veritabanından yüklenemedi."
      );
    }
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

    if (formQuestions.length < 1 || formQuestions.length > 10) {
      errors.push(`Sınavda 1 ile 10 arasında soru bulunmalıdır. Mevcut: ${formQuestions.length}`);
    }
    if (hasGeneratedContent && formQuestions.length !== 10) {
      errors.push("Yapay zekâ taslağı onaylanmadan önce 10 sorunun tamamı bulunmalıdır.");
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

  const addQuestion = () => {
    if (formQuestions.length >= 10) return;
    setFormQuestions((questions) => [
      ...questions,
      createEmptyQuestion(formExamCode, questions.length + 1),
    ]);
    setActiveQuestionTab(formQuestions.length);
  };

  const removeCurrentQuestion = () => {
    if (formQuestions.length <= 1) return;
    const nextQuestions = formQuestions
      .filter((_, index) => index !== activeQuestionTab)
      .map((question, index) => ({ ...question, order: index + 1 }));
    setFormQuestions(nextQuestions);
    setActiveQuestionTab(Math.min(activeQuestionTab, nextQuestions.length - 1));
  };

  // Kaydetme İşlemi
  const handleSaveExam = async () => {
    if (isSaving || !validateBeforeSave()) return;
    setIsSaving(true);
    setSaveError(null);

    const passageId = editingExamCode ? `pass-${editingExamCode}` : `pass-${formExamCode}`;
    const wordCount = countTurkishWords(formPassageContent);
    const estimatedReadingSeconds = Math.round((wordCount / 180) * 60);

    const passageObj: PlacementPassage = {
      id: passageId,
      title: formPassageTitle,
      content: formPassageContent,
      wordCount,
      educationLevels: formEducationLevels,
      difficulty: formDifficulty,
      ageGroups: ["all"],
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
      educationLevels: formEducationLevels,
      difficulty: formDifficulty,
      ageGroups: ["all"],
      targetSkills: ["ana_fikir", "cikarim_yapma", "acik_bilgi"],
      passageId,
      passageVersion: 1,
      questionCount: formQuestions.length,
      estimatedReadingSeconds,
      targetReadingSeconds: estimatedReadingSeconds + 15,
      readingTimeLimitEnabled: false,
      questionTimeLimitEnabled: false,
      status: formStatus,
      version: 1,
      createdBy: profile?.uid || "admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(formStatus === "published" ? { publishedAt: new Date().toISOString() } : {}),
    };

    try {
      await savePlacementExamPackageToDatabase({
        exam: examObj,
        passage: passageObj,
        questions: formQuestions.map((question) => ({
          ...question,
          status: formStatus,
          updatedAt: new Date().toISOString(),
        })),
      });
      setEditorModalOpen(false);
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 4000);
      await loadAllExams();
    } catch (e) {
      console.error(e);
      setSaveError(
        e instanceof Error
          ? e.message
          : "Sınav paketi veritabanına kaydedilemedi."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl space-y-8">
      {/* Üst Başlık ve Eylemler */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-sage-200">
        <div>
          <Badge variant="amber" className="mb-1">İçerik Yönetimi</Badge>
          <h1 className="text-3xl font-extrabold font-serif text-charcoal">
            İçerik Yönetimi
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted">
            İçerikleri metin ve soru paketi olarak ekleyin; başlangıç sınavı, alıştırmalar veya modül seviyesini seçin.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/panel/baslangic-sinavi">
            <Button size="sm" variant="outline">
              <Eye className="mr-1.5 h-4 w-4" /> Öğrenci Sınavını Başlat
            </Button>
          </Link>
          <Button size="sm" variant="amber" onClick={handleOpenNew}>
            <Plus className="mr-1.5 h-4 w-4" /> İçerik Ekle
          </Button>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>İçerik paketi, metin ve {formQuestions.length} soru başarıyla doğrulandı ve kaydedildi.</span>
        </div>
      )}

      {loadError && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          İçerik işlemi tamamlanamadı: {loadError}
        </div>
      )}

      {saveError && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          İçerik paketi kaydedilemedi: {saveError}
        </div>
      )}

      {/* Sınav Listesi Tablosu */}
      <div className="rounded-2xl border border-sage-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory-warm border-b border-sage-200 text-charcoal font-semibold">
              <tr>
                <th className="p-3.5">İçerik Adı</th>
                <th className="p-3.5">Kod</th>
                <th className="p-3.5">Seviye</th>
                <th className="p-3.5">Soru Sayısı</th>
                <th className="p-3.5">Tahmini Süre</th>
                <th className="p-3.5">Yayın Durumu</th>
                <th className="p-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-charcoal-muted">
                    İçerikler veritabanından yükleniyor...
                  </td>
                </tr>
              ) : exams.length === 0 && !loadError ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-charcoal-muted">
                    Henüz içerik paketi bulunmuyor. Yeni içerik ekleyerek başlayın.
                  </td>
                </tr>
              ) : exams.map((ex) => (
                <tr key={ex.code} className="hover:bg-ivory-warm/50 transition-colors">
                  <td className="p-3.5 font-bold text-charcoal">{ex.title}</td>
                  <td className="p-3.5 font-mono text-[11px] text-charcoal-muted">{ex.code}</td>
                  <td className="p-3.5 capitalize">
                    <Badge variant="secondary" className="text-[10px]">
                      {difficultyLevels.find((level) => level.value === (ex.difficulty || "beginner"))?.label}
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
                  <td className="p-3.5 text-right">
                    <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleOpenPreview(ex)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Ön İzle
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEditExam(ex)}>
                      <Edit className="h-3.5 w-3.5 mr-1" /> Düzenle
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => void handleDeleteExam(ex)}
                      disabled={deletingExamCode !== null}
                      aria-label={`${ex.title} içeriğini sil`}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      {deletingExamCode === ex.code ? "Siliniyor..." : "Sil"}
                    </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================== */}
      {/* SINAV VE SORU DÜZENLEME MODALI                       */}
      {/* ===================================================== */}
      <Modal
        isOpen={editorModalOpen}
        onClose={() => setEditorModalOpen(false)}
        title={editingExamCode ? "İçerik Paketini Düzenle" : "Yeni İçerik Paketi Oluştur"}
        description="Metni ve 1-10 arasında çoktan seçmeli soruyu (A, B, C, D) birlikte yapılandırın."
        maxWidth="xl"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditorModalOpen(false)}>
              Vazgeç
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveExam} isLoading={isSaving}>
              {isSaving
                ? "Kaydediliyor..."
                : hasGeneratedContent
                  ? "İnceledim, Onayla ve Kaydet"
                  : "Doğrula ve Kaydet"}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {saveError && (
            <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
              {saveError}
            </div>
          )}

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

          {/* Bölüm 1: İçerik Genel Bilgileri */}
          <div className="p-4 rounded-2xl bg-ivory-warm border border-sage-200 space-y-3">
            <h4 className="font-bold text-charcoal text-sm flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-brand-700" /> İçerik Genel Ayarları
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="font-semibold block mb-1">İçerik Adı</label>
                <input
                  type="text"
                  value={formExamTitle}
                  onChange={(e) => setFormExamTitle(e.target.value)}
                  placeholder="Örn: Okuma ve Anlama Paketi"
                  className="w-full p-2.5 rounded-xl border border-sage-200 bg-white"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">İçerik Kodu (Benzersiz)</label>
                <input
                  type="text"
                  value={formExamCode}
                  onChange={(e) => setFormExamCode(e.target.value)}
                  disabled={!!editingExamCode}
                  className="w-full p-2.5 rounded-xl border border-sage-200 bg-white font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-semibold block mb-1">Açıklama</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  maxLength={300}
                  className="w-full p-2.5 rounded-xl border border-sage-200 bg-white"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Seviye</label>
                <select
                  value={formDifficulty}
                  onChange={(e) => setFormDifficulty(e.target.value as DifficultyLevel)}
                  className="w-full p-2 rounded-xl border border-sage-200 bg-white"
                >
                  {difficultyLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
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

          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 space-y-3">
            <div>
              <h4 className="font-bold text-charcoal text-sm">Yapay zekâ ile içerik oluştur</h4>
              <p className="mt-1 text-charcoal-muted">
                Konu ve seviyeye göre özgün okuma metni ile 10 soru taslak olarak hazırlanır.
                Veritabanına yalnızca inceleyip onayladıktan sonra eklenir.
                Bu işlem için yönetici yetkisi gerekir.
              </p>
            </div>
            {generationError && (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">
                {generationError}
              </div>
            )}
            {hasGeneratedContent && (
              <p role="status" className="text-emerald-800 font-semibold">
                Taslak hazır. Metni ve 10 sorunun tamamını inceleyip düzenleyin; onay vermeden kaydedilmez.
              </p>
            )}
            <Button
              type="button"
              variant="amber"
              size="sm"
              onClick={() => void handleGenerateContent()}
              isLoading={isGenerating}
              disabled={isSaving}
            >
              {isGenerating ? "Gemini içerik üzerinde çalışıyor..." : "Metni ve 10 Soruyu Oluştur"}
            </Button>
            {isGenerating && (
              <p role="status" className="text-xs text-charcoal-muted">
                Üretim arka planda sürüyor; lütfen bu sayfayı açık tutun.
              </p>
            )}
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

          {/* Bölüm 3: Soru Yönetimi */}
          <div className="p-4 rounded-2xl bg-ivory-warm border border-sage-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-charcoal text-sm flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-amber-600" /> Soru Bankası ({formQuestions.length}/10)
              </h4>
              <span className="text-xs text-charcoal-muted">
                1-10 soru ekleyin. Her soruda 4 seçenek (A, B, C, D) ve 1 doğru cevap zorunludur.
              </span>
            </div>

            {/* Soru Seçme Sekmeleri */}
            <div className="flex flex-wrap items-center gap-1.5">
              {formQuestions.map((_, i) => (
                <button
                  key={formQuestions[i].id}
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
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addQuestion}
                disabled={formQuestions.length >= 10}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Soru Ekle
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={removeCurrentQuestion}
                disabled={formQuestions.length <= 1}
              >
                Soruyu Sil
              </Button>
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
            <h4 className="font-bold text-charcoal text-sm">
              Sınav Soruları (Toplam {previewQuestions.length} Soru):
            </h4>
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
