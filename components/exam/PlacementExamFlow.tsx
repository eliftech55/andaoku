"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  PlacementExam,
  PlacementPassage,
  PlacementQuestion,
  PlacementAttempt,
} from "@/lib/types";
import {
  getPlacementExamByLevel,
  getStudentPlacementQuestions,
  evaluatePlacementAttempt,
  getUserPlacementAttempts,
} from "@/lib/services/placementExamService";
import { formatDuration, countTurkishWords } from "@/lib/utils/readingMetrics";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Clock,
  Play,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Settings2,
  Target,
  Sparkles,
  HelpCircle,
  AlertCircle,
  RotateCcw,
  Award,
  Layers,
  FileText,
} from "lucide-react";

export function PlacementExamFlow() {
  const { user, profile } = useAuth();

  // Akış Durumları: 'intro' | 'reading' | 'questions' | 'results'
  const [currentStep, setCurrentStep] = useState<"intro" | "reading" | "questions" | "results">("intro");

  // Sınav Verileri
  const [exam, setExam] = useState<PlacementExam | null>(null);
  const [passage, setPassage] = useState<PlacementPassage | null>(null);
  const [questions, setQuestions] = useState<Omit<PlacementQuestion, "correctOptionId">[]>([]);
  const [previousAttempts, setPreviousAttempts] = useState<PlacementAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Süre Takibi (Okuma ve Soru süreleri BİRBİRİNDEN AYRIDIR)
  const [readingSeconds, setReadingSeconds] = useState(0);
  const [questionSeconds, setQuestionSeconds] = useState(0);
  const readingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Okuma Tercihleri
  const [fontSize, setFontSize] = useState<number>(profile?.preferences?.fontSize || 18);
  const [lineHeight, setLineHeight] = useState<number>(profile?.preferences?.lineHeight || 1.8);
  const [theme, setTheme] = useState<"light" | "sepia" | "dark">("light");

  // Soru Ekranı Durumu
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({}); // questionId -> optionId ("A", "B", "C", "D")

  // Sonuç Durumu
  const [evaluationResult, setEvaluationResult] = useState<{
    attempt: PlacementAttempt;
    recommendations: {
      status: string;
      feedback: string;
      suggestedAction: string;
      recommendedModuleIds: string[];
    };
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadExam() {
      const level = profile?.educationLevel || "middle";
      const uid = user?.uid || profile?.uid || "demo-learner-123";

      try {
        const examData = await getPlacementExamByLevel(level);
        if (examData) {
          setExam(examData.exam);
          setPassage(examData.passage);
          const sanitizedQuestions = await getStudentPlacementQuestions(examData.exam.code);
          setQuestions(sanitizedQuestions);
        }

        const prev = await getUserPlacementAttempts(uid);
        setPreviousAttempts(prev);
      } catch (e) {
        console.error("Sınav yüklenirken hata:", e);
      } finally {
        setLoading(false);
      }
    }
    loadExam();
  }, [user, profile]);

  // Okuma Zamanlayıcısı
  useEffect(() => {
    if (currentStep === "reading") {
      readingTimerRef.current = setInterval(() => {
        setReadingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (readingTimerRef.current) clearInterval(readingTimerRef.current);
    }
    return () => {
      if (readingTimerRef.current) clearInterval(readingTimerRef.current);
    };
  }, [currentStep]);

  // Soru Çözme Zamanlayıcısı
  useEffect(() => {
    if (currentStep === "questions") {
      questionTimerRef.current = setInterval(() => {
        setQuestionSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    }
    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [currentStep]);

  const handleStartReading = () => {
    setReadingSeconds(0);
    setCurrentStep("reading");
  };

  const handleFinishReading = () => {
    if (readingTimerRef.current) clearInterval(readingTimerRef.current);
    setQuestionSeconds(0);
    setCurrentStep("questions");
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmitExam = async () => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    setIsSubmitting(true);

    const uid = user?.uid || profile?.uid || "demo-learner-123";

    try {
      const evalRes = await evaluatePlacementAttempt({
        userId: uid,
        examCode: exam?.code || "ortaokul-baslangic-01",
        passageId: passage?.id || "pass-mid-01",
        readingDurationSeconds: readingSeconds || 1,
        questionDurationSeconds: questionSeconds || 1,
        userAnswers,
      });

      setEvaluationResult(evalRes);
      setCurrentStep("results");
    } catch (e) {
      console.error("Sınav değerlendirme hatası:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-charcoal-muted flex flex-col items-center justify-center space-y-3">
        <div className="h-8 w-8 rounded-full border-2 border-brand-700 border-t-transparent animate-spin" />
        <span className="text-xs">Başlangıç sınavı içerikleri hazırlanıyor...</span>
      </div>
    );
  }

  if (!exam || !passage) {
    return (
      <div className="p-8 text-center rounded-2xl bg-white border border-sage-200 space-y-3">
        <AlertCircle className="h-10 w-10 text-amber-600 mx-auto" />
        <h3 className="text-base font-bold text-charcoal">Uygun Sınav Metni Bulunamadı</h3>
        <p className="text-xs text-charcoal-muted max-w-md mx-auto">
          Eğitim kademeniz ({profile?.educationLevel || "ortaokul"}) için yayımlanmış başlangıç sınavı bulunamadı. Lütfen yönetim panelinden sınavın yayında olduğunu kontrol edin.
        </p>
      </div>
    );
  }

  const themeClasses = {
    light: "bg-white text-charcoal border-sage-200",
    sepia: "bg-[#FBF0D9] text-[#433422] border-[#E6D4B9]",
    dark: "bg-[#1E2922] text-[#F3EFE6] border-brand-900",
  }[theme];

  return (
    <div className="w-full space-y-6">
      {/* ===================================================== */}
      {/* ADIM 1 & 3: YÖNERGE VE BAŞLANGIÇ EKRANI                */}
      {/* ===================================================== */}
      {currentStep === "intro" && (
        <Card className="max-w-2xl mx-auto border-sage-200 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-brand-900 to-brand-800 text-white p-6 sm:p-8 space-y-2">
            <Badge variant="amber" className="mb-2">Ölçme & Değerlendirme</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif">
              {exam.title}
            </h2>
            <p className="text-xs sm:text-sm text-sage-200 leading-relaxed">
              Kişisel öğrenme yolunuzun belirlenmesi için okuma hızı ve okuduğunu anlama düzeyinizi ölçen 2 aşamalı başlangıç testi.
            </p>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-ivory-warm border border-sage-200 space-y-3">
              <h4 className="font-bold text-charcoal text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-brand-700" />
                Sınav Kuralları ve Bilimsel Ayrım
              </h4>
              <ul className="space-y-2 text-charcoal-muted text-xs leading-relaxed">
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-700 mt-1.5 shrink-0" />
                  <span>
                    <strong>1. Aşama (Okuma Süresi):</strong> 'Okumaya Başla' butonuna bastığınızda metin açılır ve okuma süreniz ölçülür. Metni bitirdiğinizde 'Okumayı Bitirdim' butonuna basmalısınız.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-700 mt-1.5 shrink-0" />
                  <span>
                    <strong>2. Aşama (Soru Çözme Süresi):</strong>                     Okuma bitiminde metin gizlenir ve metinle ilgili <strong>{questions.length} çoktan seçmeli soru</strong> yöneltilir.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                  <span>
                    <strong>Süre Bağımsızlığı:</strong> Soru çözme süresi, okuma hızınıza (WPM) kesinlikle dâhil edilmez. Okuma hızı ve anlama puanı bağımsız raporlanır.
                  </span>
                </li>
              </ul>
            </div>

            {previousAttempts.length > 0 && (
              <div className="p-3.5 rounded-xl bg-sage-50 border border-sage-200 text-xs text-brand-900 flex items-center justify-between">
                <span>Daha önce bu kademede <strong>{previousAttempts.length}</strong> sınav tamamladınız.</span>
                <span className="font-mono font-bold">
                  Son Hız: {previousAttempts[0].rawWpm} WPM | %{previousAttempts[0].comprehensionPercentage}
                </span>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-charcoal-muted">
                Metin: <strong>{countTurkishWords(passage.content)} Kelime</strong> | Soru: <strong>10 Adet (A, B, C, D)</strong>
              </div>
              <Button size="lg" variant="amber" onClick={handleStartReading} className="w-full sm:w-auto font-bold px-8 shadow-md">
                <Play className="mr-2 h-4 w-4" /> Okumaya Başla
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===================================================== */}
      {/* ADIM 4: OKUMA EKRANI (Metin Açık, Süre Ölçülüyor)     */}
      {/* ===================================================== */}
      {currentStep === "reading" && (
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Üst Süre ve Tercih Barı */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-sage-200 shadow-sm text-xs">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="capitalize text-xs font-semibold">
                {passage.genre || "Bilgilendirici"}
              </Badge>
              <div className="flex items-center gap-1.5 font-mono font-bold text-brand-900 text-sm">
                <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
                <span>{formatDuration(readingSeconds, "digital")}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <button
                  onClick={() => setTheme("light")}
                  className={`px-2 py-1 rounded border text-[11px] ${theme === "light" ? "bg-white font-bold border-brand-700" : "border-sage-200"}`}
                >
                  Açık
                </button>
                <button
                  onClick={() => setTheme("sepia")}
                  className={`px-2 py-1 rounded border text-[11px] bg-[#FBF0D9] text-[#433422] ${theme === "sepia" ? "border-amber-700 font-bold" : "border-[#E6D4B9]"}`}
                >
                  Sepya
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`px-2 py-1 rounded border text-[11px] bg-[#1E2922] text-white ${theme === "dark" ? "border-brand-400 font-bold" : "border-brand-900"}`}
                >
                  Koyu
                </button>
              </div>
              <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-sage-200">
                <span className="text-charcoal-muted">Yazı:</span>
                <input
                  type="range"
                  min="15"
                  max="26"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-20 accent-brand-700"
                />
              </div>
            </div>
          </div>

          {/* Okuma Metni Alanı */}
          <div className={`rounded-3xl border p-8 sm:p-12 shadow-sm transition-colors ${themeClasses}`}>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif mb-6 pb-4 border-b border-current/20 leading-tight">
              {passage.title}
            </h2>

            <div
              className="leading-relaxed font-serif transition-all"
              style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
            >
              {passage.content.split("\n\n").map((par, i) => (
                <p key={i} className="mb-5 text-justify">
                  {par}
                </p>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-current/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-charcoal-muted">
                Metni tam olarak anladığınızda butona tıklayın. Sorular başlayacaktır.
              </span>
              <Button size="lg" variant="amber" onClick={handleFinishReading} className="px-8 font-bold shadow-md">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Okumayı Tamamladım
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* ADIM 5: 10 ÇOKTAN SEÇMELİ SORU EKRANI                 */}
      {/* ===================================================== */}
      {currentStep === "questions" && questions.length > 0 && (
        <Card className="max-w-2xl mx-auto border-sage-200 shadow-md">
          <CardHeader className="pb-3 border-b border-sage-100">
            <div className="flex items-center justify-between">
              <Badge variant="amber">
                Soru {currentQuestionIndex + 1} / {questions.length}
              </Badge>
              <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-charcoal-muted">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>Soru Süresi: {formatDuration(questionSeconds, "digital")}</span>
              </div>
            </div>

            {/* Soru Gösterge Noktaları */}
            <div className="flex gap-1.5 pt-3">
              {questions.map((_, idx) => {
                const isAnswered = !!userAnswers[questions[idx].id];
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-2 flex-1 rounded-full transition-all ${
                      isCurrent
                        ? "bg-brand-700 ring-2 ring-brand-700/30"
                        : isAnswered
                        ? "bg-emerald-500"
                        : "bg-sage-200"
                    }`}
                    title={`Soru ${idx + 1} ${isAnswered ? "(Yanıtlandı)" : "(Boş)"}`}
                  />
                );
              })}
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Mevcut Soru Metni */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-800">
                Kategori: {questions[currentQuestionIndex].questionType.replace("_", " ")}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-charcoal leading-snug">
                {questions[currentQuestionIndex].questionText}
              </h3>
            </div>

            {/* 4 Seçenek (A, B, C, D) */}
            <div className="space-y-2.5">
              {questions[currentQuestionIndex].options.map((opt) => {
                const isSelected = userAnswers[questions[currentQuestionIndex].id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(questions[currentQuestionIndex].id, opt.id)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-brand-50 border-brand-700 text-brand-950 font-semibold shadow-sm"
                        : "bg-white border-sage-200 hover:bg-ivory-warm text-charcoal"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                          isSelected ? "bg-brand-700 text-white" : "bg-sage-100 text-brand-900"
                        }`}
                      >
                        {opt.id}
                      </span>
                      <span>{opt.text}</span>
                    </div>
                    {isSelected && <div className="h-2 w-2 rounded-full bg-brand-700 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Gezinme ve Bitirme Butonları */}
            <div className="pt-4 border-t border-sage-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Önceki
              </Button>

              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                >
                  Sonraki <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="amber"
                  size="md"
                  onClick={handleSubmitExam}
                  isLoading={isSubmitting}
                  className="font-bold px-6 shadow-md"
                >
                  Sınavı Tamamla ve Sonuçları Gör
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===================================================== */}
      {/* ADIM 6: SONUÇ VE SEVİYE RAPOR EKRANI                  */}
      {/* ===================================================== */}
      {currentStep === "results" && evaluationResult && (
        <Card className="max-w-2xl mx-auto border-sage-300 shadow-xl overflow-hidden animate-fade-in">
          <div className="bg-brand-800 text-white p-6 sm:p-8 text-center space-y-2">
            <Badge variant="amber" className="mb-2">Başlangıç Seviye Raporu</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif">
              Değerlendirme Tamamlandı
            </h2>
            <p className="text-xs sm:text-sm text-sage-200 max-w-md mx-auto">
              Okuma hızınız ve anlama düzeyiniz bilimsel kriterlerle ayrı ayrı hesaplanmıştır.
            </p>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Metrik Kartları */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-ivory-warm border border-sage-200 text-center space-y-1">
                <span className="text-xs text-charcoal-muted font-medium block">Ham Okuma Hızı</span>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-brand-950">
                  {evaluationResult.attempt.rawWpm}{" "}
                  <span className="text-xs font-sans text-charcoal-muted font-normal">WPM</span>
                </div>
                <p className="text-[11px] text-charcoal-muted">
                  Okuma Süresi: {formatDuration(evaluationResult.attempt.readingDurationSeconds)}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-ivory-warm border border-sage-200 text-center space-y-1">
                <span className="text-xs text-charcoal-muted font-medium block">Okuduğunu Anlama</span>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-600">
                  %{evaluationResult.attempt.comprehensionPercentage}
                </div>
                <p className="text-[11px] text-charcoal-muted">
                  {evaluationResult.attempt.correctCount} / 10 Doğru Cevap
                </p>
              </div>
            </div>

            {/* Süre Ayrımı ve Soru Dağılımı Tablosu */}
            <div className="rounded-xl border border-sage-200 bg-white p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-sage-100">
                <span className="text-charcoal-muted">Kullanılan Metin:</span>
                <span className="font-semibold text-charcoal">{passage.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-sage-100">
                <span className="text-charcoal-muted">Metin Kelime Sayısı:</span>
                <span className="font-semibold text-charcoal">{evaluationResult.attempt.wordCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-sage-100">
                <span className="text-charcoal-muted">Net Okuma Süresi:</span>
                <span className="font-semibold text-brand-900">
                  {formatDuration(evaluationResult.attempt.readingDurationSeconds)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-sage-100">
                <span className="text-charcoal-muted">Soru Çözme Süresi:</span>
                <span className="font-semibold text-charcoal">
                  {formatDuration(evaluationResult.attempt.questionDurationSeconds)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-charcoal-muted">Doğru / Yanlış / Boş:</span>
                <span className="font-semibold text-charcoal">
                  <span className="text-emerald-700">{evaluationResult.attempt.correctCount} Doğru</span>,{" "}
                  <span className="text-rose-600">{evaluationResult.attempt.incorrectCount} Yanlış</span>,{" "}
                  <span>{evaluationResult.attempt.unansweredCount} Boş</span>
                </span>
              </div>
            </div>

            {/* Pedagojik Geri Bildirim */}
            <div className="p-4 rounded-xl bg-sage-50 border border-sage-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-900">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>Pedagojik Değerlendirme & Sonraki Adım</span>
              </div>
              <p className="text-xs text-charcoal leading-relaxed">
                {evaluationResult.recommendations.feedback}
              </p>
              <div className="pt-2 border-t border-sage-200/60 text-xs text-brand-950 font-medium">
                <span className="font-bold text-brand-800">Öneri:</span> {evaluationResult.recommendations.suggestedAction}
              </div>
            </div>

            {/* Bilimsel Sınırlılık İkazı */}
            <div className="p-3 rounded-xl bg-ivory-beige text-[11px] text-charcoal-muted leading-tight border border-sage-200">
              <span className="font-bold text-charcoal">Bilimsel Hatırlatma:</span> Tek bir başlangıç sınavı kalıcı bir okuma yetkinliği veya klinik tanı olarak kabul edilemez. Bu sonuç, kişisel öğrenme yolunuzun başlangıç rotasını çizmek için referans alınmıştır.
            </div>

            {/* Aksiyon Butonları */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setCurrentStep("intro");
                  setUserAnswers({});
                  setEvaluationResult(null);
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Sınavı Tekrarla
              </Button>

              <Link href="/panel/ogrenme-yolu">
                <Button variant="primary" size="md" className="font-bold">
                  Öğrenme Yoluma Git
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
