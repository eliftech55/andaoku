"use client";

import React, { useState, useEffect, useRef } from "react";
import { ReadingPassage, Question, UserPreferences } from "@/lib/types";
import { countTurkishWords, calculateWpm, calculateComprehensionScore, evaluateReadingPerformance, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Settings2,
  Clock,
  Gauge,
  BookOpen,
  ArrowRight,
  Sparkles,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { saveModuleReadingScore, saveReadingSession, saveAssessmentResult } from "@/lib/firebase/firestore";

interface ReadingLabProps {
  passage: ReadingPassage;
  questions?: Question[];
  mode?: "standard" | "chunk" | "rsvp";
  moduleId?: string;
  activityId?: string;
  readingPacingWpm?: number;
  chunkSize?: number;
  persistResults?: boolean;
  onComplete?: (result: { wpm: number; comprehensionScore: number; durationSeconds: number }) => void;
}

export function ReadingLab({
  passage,
  questions = [],
  mode: initialMode = "standard",
  moduleId,
  activityId,
  readingPacingWpm = 250,
  chunkSize = 2,
  persistResults = true,
  onComplete,
}: ReadingLabProps) {
  const { user, profile, updatePreferences } = useAuth();

  // Okuma durumları
  const [readingState, setReadingState] = useState<"idle" | "reading" | "paused" | "comprehension" | "result">("idle");
  const [readingMode, setReadingMode] = useState<"standard" | "chunk" | "rsvp">(initialMode);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Okuma tercihleri
  const [fontSize, setFontSize] = useState<number>(profile?.preferences?.fontSize || 18);
  const [lineHeight, setLineHeight] = useState<number>(profile?.preferences?.lineHeight || 1.8);
  const [theme, setTheme] = useState<"light" | "sepia" | "dark">(profile?.preferences?.theme || "light");
  const [fontFamily, setFontFamily] = useState<"serif" | "sans" | "dyslexic">(profile?.preferences?.fontFamily || "serif");
  const [columnWidth, setColumnWidth] = useState<"narrow" | "normal" | "wide">(profile?.preferences?.columnWidth || "normal");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // RSVP / Blok Okuma Durumu
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rsvpPacingWpm, setRsvpPacingWpm] = useState(readingPacingWpm);
  const rsvpTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Soru & Anlama Durumu
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<{
    wpm: number;
    comprehensionScore: number;
    correctCount: number;
    incorrectCount: number;
    unansweredCount: number;
    evaluation: ReturnType<typeof evaluateReadingPerformance>;
  } | null>(null);

  // Kelimeleri böl
  useEffect(() => {
    if (passage?.content) {
      const splitWords = passage.content.trim().split(/[\s\r\n\t]+/).filter((w) => w.length > 0);
      setWords(splitWords);
    }
  }, [passage]);

  // Zamanlayıcı
  useEffect(() => {
    if (readingState === "reading") {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [readingState]);

  // RSVP kelime akışı
  useEffect(() => {
    if (readingState === "reading" && (readingMode === "rsvp" || readingMode === "chunk")) {
      const stepSize = readingMode === "chunk" ? Math.max(2, Math.floor(chunkSize)) : 1;
      const intervalMs = Math.round((60 / rsvpPacingWpm) * 1000 * stepSize);

      rsvpTimerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev + stepSize >= words.length) {
            handleFinishReading();
            return words.length - 1;
          }
          return prev + stepSize;
        });
      }, intervalMs);
    } else {
      if (rsvpTimerRef.current) clearInterval(rsvpTimerRef.current);
    }
    return () => {
      if (rsvpTimerRef.current) clearInterval(rsvpTimerRef.current);
    };
  }, [readingState, readingMode, rsvpPacingWpm, chunkSize, words]);

  const handleStart = () => {
    setReadingState("reading");
  };

  const handlePause = () => {
    setReadingState("paused");
  };

  const handleResume = () => {
    setReadingState("reading");
  };

  const handleReset = () => {
    setReadingState("idle");
    setSecondsElapsed(0);
    setCurrentIndex(0);
    setUserAnswers({});
    setResults(null);
  };

  const handleFinishReading = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (rsvpTimerRef.current) clearInterval(rsvpTimerRef.current);

    if (questions && questions.length > 0) {
      setReadingState("comprehension");
    } else {
      calculateAndSaveResults();
    }
  };

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const calculateAndSaveResults = async () => {
    const wordCount = countTurkishWords(passage.content);
    const wpm = calculateWpm(wordCount, secondsElapsed || 1);

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    questions.forEach((q) => {
      const ans = userAnswers[q.id];
      if (!ans) {
        unansweredCount++;
      } else if (ans === q.correctAnswer) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const comprehensionScore = questions.length > 0
      ? calculateComprehensionScore(correctCount, questions.length)
      : 100;

    const evaluation = evaluateReadingPerformance(wpm, comprehensionScore);

    const calculated = {
      wpm,
      comprehensionScore,
      correctCount,
      incorrectCount,
      unansweredCount,
      evaluation,
    };

    setResults(calculated);
    setReadingState("result");

    const currentUserId = user?.uid || profile?.uid;
    if (persistResults && currentUserId) {
      try {
        await saveReadingSession({
          userId: currentUserId,
          passageId: passage.id,
          passageVersion: passage.version || 1,
          ...(activityId ? { activityId } : {}),
          startedAt: new Date(Date.now() - secondsElapsed * 1000).toISOString(),
          completedAt: new Date().toISOString(),
          durationSeconds: secondsElapsed,
          wordCount,
          wpm,
          status: "completed",
          createdAt: new Date().toISOString(),
        });

        if (questions.length > 0) {
          await saveAssessmentResult({
            userId: currentUserId,
            assessmentType: "practice",
            passageId: passage.id,
            passageVersion: passage.version || 1,
            wordCount,
            durationSeconds: secondsElapsed,
            wpm,
            correctCount,
            incorrectCount,
            unansweredCount,
            gradableQuestionCount: questions.length,
            comprehensionScore,
            userAnswers,
            createdAt: new Date().toISOString(),
          });
        }

      } catch (e) {
        console.warn("Okuma sonuçları Firestore'a kaydedilirken not:", e);
      }
    }

    if (moduleId && currentUserId) {
      try {
        await saveModuleReadingScore(currentUserId, moduleId, comprehensionScore);
      } catch (e) {
        console.warn("Modül okuma puanı kaydedilirken not:", e);
      }
    }

    if (onComplete) {
      onComplete({ wpm, comprehensionScore, durationSeconds: secondsElapsed });
    }
  };

  // Tema sınıfları
  const themeClasses = {
    light: "bg-white text-charcoal border-sage-200",
    sepia: "bg-[#FBF0D9] text-[#433422] border-[#E6D4B9]",
    dark: "bg-[#1E2922] text-[#F3EFE6] border-brand-900",
  }[theme];

  const columnWidthClasses = {
    narrow: "max-w-[520px]",
    normal: "max-w-[680px]",
    wide: "max-w-[850px]",
  }[columnWidth];

  const fontClasses = {
    serif: "font-serif",
    sans: "font-sans",
    dyslexic: "font-dyslexic",
  }[fontFamily];

  return (
    <div className="w-full space-y-6">
      {/* Üst Kontrol Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-sage-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="capitalize text-xs font-semibold">
            {passage.genre || "Bilgilendirici"}
          </Badge>
          <span className="text-xs text-charcoal-muted">
            {countTurkishWords(passage.content)} Kelime
          </span>
          <span className="text-xs text-charcoal-muted hidden sm:inline">|</span>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-brand-800">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span>{formatDuration(secondsElapsed, "digital")}</span>
          </div>
        </div>

        {/* Mod Seçiciler */}
        <div className="flex items-center gap-2">
          <div className="bg-sage-100 p-1 rounded-xl flex gap-1 text-xs">
            <button
              onClick={() => {
                if (readingState === "idle") setReadingMode("standard");
              }}
              disabled={readingState === "reading"}
              className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                readingMode === "standard" ? "bg-white text-brand-900 shadow-sm font-bold" : "text-charcoal-muted"
              }`}
            >
              Standart
            </button>
            <button
              onClick={() => {
                if (readingState === "idle") setReadingMode("chunk");
              }}
              disabled={readingState === "reading"}
              className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                readingMode === "chunk" ? "bg-white text-brand-900 shadow-sm font-bold" : "text-charcoal-muted"
              }`}
            >
              Blok (İkili)
            </button>
            <button
              onClick={() => {
                if (readingState === "idle") setReadingMode("rsvp");
              }}
              disabled={readingState === "reading"}
              className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                readingMode === "rsvp" ? "bg-white text-brand-900 shadow-sm font-bold" : "text-charcoal-muted"
              }`}
            >
              RSVP Flaş
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex items-center gap-1.5"
            title="Okuma Tercihleri"
          >
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Görünüm</span>
          </Button>
        </div>
      </div>

      {/* Tercih Ayarları Paneli */}
      {settingsOpen && (
        <div className="p-4 rounded-2xl bg-ivory-warm border border-sage-200 animate-fade-in grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-semibold text-charcoal block mb-1.5">Yazı Boyutu: {fontSize}px</label>
            <input
              type="range"
              min="14"
              max="28"
              value={fontSize}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFontSize(val);
                updatePreferences({ fontSize: val });
              }}
              className="w-full accent-brand-700"
            />
          </div>
          <div>
            <label className="font-semibold text-charcoal block mb-1.5">Satır Aralığı: {lineHeight}</label>
            <input
              type="range"
              min="1.4"
              max="2.4"
              step="0.1"
              value={lineHeight}
              onChange={(e) => {
                const val = Number(e.target.value);
                setLineHeight(val);
                updatePreferences({ lineHeight: val });
              }}
              className="w-full accent-brand-700"
            />
          </div>
          <div>
            <label className="font-semibold text-charcoal block mb-1.5">Tema</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTheme("light");
                  updatePreferences({ theme: "light" });
                }}
                className={`px-2.5 py-1 rounded border text-xs ${
                  theme === "light" ? "border-brand-700 font-bold bg-white" : "border-sage-200"
                }`}
              >
                Açık
              </button>
              <button
                onClick={() => {
                  setTheme("sepia");
                  updatePreferences({ theme: "sepia" });
                }}
                className={`px-2.5 py-1 rounded border text-xs bg-[#FBF0D9] text-[#433422] ${
                  theme === "sepia" ? "border-amber-700 font-bold" : "border-[#E6D4B9]"
                }`}
              >
                Sepya
              </button>
              <button
                onClick={() => {
                  setTheme("dark");
                  updatePreferences({ theme: "dark" });
                }}
                className={`px-2.5 py-1 rounded border text-xs bg-[#1E2922] text-white ${
                  theme === "dark" ? "border-brand-400 font-bold" : "border-brand-900"
                }`}
              >
                Koyu
              </button>
            </div>
          </div>
          <div>
            <label className="font-semibold text-charcoal block mb-1.5">Yazı Tipi</label>
            <select
              value={fontFamily}
              onChange={(e) => {
                const val = e.target.value as any;
                setFontFamily(val);
                updatePreferences({ fontFamily: val });
              }}
              className="w-full p-1.5 rounded-lg border border-sage-200 bg-white text-xs"
            >
              <option value="serif">Serif (Klasik Kitap)</option>
              <option value="sans">Sans-serif (Modern Düz)</option>
              <option value="dyslexic">Disleksi Dostu</option>
            </select>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* 1. DURUM: BAŞLANGIÇ VEYA OKUMA EKRANI                  */}
      {/* ===================================================== */}
      {(readingState === "idle" || readingState === "reading" || readingState === "paused") && (
        <div className="relative">
          {/* Başlatma / Hazırlık Overlay */}
          {readingState === "idle" && (
            <div className="rounded-3xl border border-sage-200 bg-white/95 p-8 text-center space-y-6 shadow-md backdrop-blur-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <BookOpen className="h-8 w-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-2xl font-bold font-serif text-charcoal">{passage.title}</h3>
                <p className="text-sm text-charcoal-muted">
                  Okuma süreniz 'Okumaya Başla' butonuna bastığınız anda başlayacaktır. Metni kendi olağan hızınızla okuyun;
                  okuma bitiminde anlama soruları yöneltilecektir.
                </p>
              </div>

              {readingMode !== "standard" && (
                <div className="max-w-xs mx-auto p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  Hedef Hız: <strong>{rsvpPacingWpm} WPM</strong>
                  <input
                    type="range"
                    min="120"
                    max="500"
                    step="10"
                    value={rsvpPacingWpm}
                    onChange={(e) => setRsvpPacingWpm(Number(e.target.value))}
                    className="w-full mt-2 accent-amber-600"
                  />
                </div>
              )}

              <Button size="lg" variant="amber" onClick={handleStart} className="px-8 shadow-md">
                <Play className="mr-2 h-5 w-5" />
                Okumaya Başla
              </Button>
            </div>
          )}

          {/* Aktif Okuma Alanı */}
          {(readingState === "reading" || readingState === "paused") && (
            <div
              className={`rounded-3xl border p-6 sm:p-10 shadow-sm transition-colors ${themeClasses} ${columnWidthClasses} mx-auto`}
            >
              <h2 className="text-2xl font-bold mb-6 font-serif tracking-tight border-b pb-4 border-current/20">
                {passage.title}
              </h2>

              {/* STANDART OKUMA GÖRÜNÜMÜ */}
              {readingMode === "standard" && (
                <div
                  className={`leading-relaxed transition-all ${fontClasses}`}
                  style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
                >
                  {passage.content.split("\n\n").map((par, i) => (
                    <p key={i} className="mb-5 text-justify">
                      {par}
                    </p>
                  ))}
                </div>
              )}

              {/* BLOK OKUMA GÖRÜNÜMÜ */}
              {readingMode === "chunk" && (
                <div
                  className={`leading-relaxed transition-all ${fontClasses}`}
                  style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
                >
                  <p className="flex flex-wrap gap-2 text-justify">
                    {words.map((word, idx) => {
                      const isHighlighted = idx === currentIndex || idx === currentIndex + 1;
                      return (
                        <span
                          key={idx}
                          className={`transition-all duration-150 px-1 rounded ${
                            isHighlighted
                              ? "bg-amber-400 text-brand-950 font-bold scale-105"
                              : "opacity-75"
                          }`}
                        >
                          {word}
                        </span>
                      );
                    })}
                  </p>
                </div>
              )}

              {/* RSVP FLAŞ GÖRÜNÜMÜ */}
              {readingMode === "rsvp" && (
                <div className="py-16 text-center">
                  <div className="h-20 flex items-center justify-center font-bold font-sans text-4xl sm:text-5xl tracking-wide text-brand-700">
                    {words[currentIndex] || "..."}
                  </div>
                  <div className="mt-4 text-xs font-mono text-charcoal-muted">
                    {currentIndex + 1} / {words.length} Kelime (%
                    {Math.round(((currentIndex + 1) / words.length) * 100)})
                  </div>
                  <Progress value={((currentIndex + 1) / words.length) * 100} className="mt-3 max-w-xs mx-auto" />
                </div>
              )}

              {/* Duraklatıldı İkazı */}
              {readingState === "paused" && (
                <div className="my-6 p-4 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-center font-medium">
                  Okuma duraklatıldı. Süre ölçümü durduruldu.
                </div>
              )}

              {/* Alt Butonlar */}
              <div className="mt-10 pt-6 border-t border-current/20 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {readingState === "reading" ? (
                    <Button variant="outline" size="sm" onClick={handlePause}>
                      <Pause className="mr-1.5 h-4 w-4" /> Duraklat
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" onClick={handleResume}>
                      <Play className="mr-1.5 h-4 w-4" /> Devam Et
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <RotateCcw className="mr-1.5 h-4 w-4" /> Sıfırla
                  </Button>
                </div>

                <Button size="md" variant="amber" onClick={handleFinishReading} className="px-6 font-semibold">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Okumayı Bitirdim
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================== */}
      {/* 2. DURUM: OKUDUĞUNU ANLAMA SORULARI                   */}
      {/* ===================================================== */}
      {readingState === "comprehension" && (
        <Card className="max-w-2xl mx-auto border-sage-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="amber" className="flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                Okuduğunu Anlama Değerlendirmesi
              </Badge>
              <span className="text-xs font-mono text-charcoal-muted">
                Okuma Süresi: {formatDuration(secondsElapsed)}
              </span>
            </div>
            <CardTitle className="text-xl font-serif text-charcoal mt-2">
              Soruları Metne Göre Yanıtlayın
            </CardTitle>
            <p className="text-xs text-charcoal-muted">
              Okuma süreniz tamamlandı. Şimdi metin hafızanızı ve anlama derinliğinizi değerlendirmek için aşağıdaki soruları yanıtlayın.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-4 rounded-xl border border-sage-200 bg-ivory-warm space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white text-xs font-bold">
                    {idx + 1}
                  </span>
                  <p className="text-sm font-semibold text-charcoal">{q.prompt}</p>
                </div>

                <div className="space-y-2 pl-8">
                  {q.options.map((opt) => {
                    const isSelected = userAnswers[q.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleAnswerSelect(q.id, opt.id)}
                        className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-brand-50 border-brand-700 text-brand-950 font-semibold shadow-sm"
                            : "bg-white border-sage-200 hover:bg-ivory-beige text-charcoal"
                        }`}
                      >
                        <span>{opt.text}</span>
                        {isSelected && <div className="h-2 w-2 rounded-full bg-brand-700" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="pt-4 flex justify-end">
              <Button size="lg" variant="primary" onClick={calculateAndSaveResults} className="px-8 font-semibold">
                Sonuçları Değerlendir ve Kaydet
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===================================================== */}
      {/* 3. DURUM: DEĞERLENDİRME SONUÇ EKRANI                  */}
      {/* ===================================================== */}
      {readingState === "result" && results && (
        <Card className="max-w-2xl mx-auto border-sage-300 shadow-lg animate-fade-in overflow-hidden">
          <div className="bg-brand-700 text-white p-6 sm:p-8 text-center space-y-2">
            <Badge variant="amber" className="mb-2">Ölçüm Tamamlandı</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif">Okuma ve Anlama Raporu</h2>
            <p className="text-xs sm:text-sm text-sage-200 max-w-md mx-auto">
              Ölçümler bilimsel standartlarda WPM ve anlama yüzdesi olarak ayrı ayrı hesaplanmıştır.
            </p>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Metrik Kartları: WPM ve Anlama Puanı */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-ivory-warm border border-sage-200 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs text-charcoal-muted font-medium">
                  <Gauge className="h-4 w-4 text-brand-700" />
                  <span>Okuma Hızı</span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-brand-950">
                  {results.wpm} <span className="text-sm font-sans font-normal text-charcoal-muted">WPM</span>
                </div>
                <p className="text-[11px] text-charcoal-muted">Kelime / Dakika</p>
              </div>

              <div className="p-5 rounded-2xl bg-ivory-warm border border-sage-200 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs text-charcoal-muted font-medium">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span>Okuduğunu Anlama</span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-700">
                  %{results.comprehensionScore}
                </div>
                <p className="text-[11px] text-charcoal-muted">
                  {results.correctCount} Doğru / {questions.length} Soru
                </p>
              </div>
            </div>

            {/* Ayrıntılı Özet Tablosu */}
            <div className="rounded-xl border border-sage-200 bg-white p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-sage-100">
                <span className="text-charcoal-muted">Toplam Okunan Kelime:</span>
                <span className="font-semibold text-charcoal">{countTurkishWords(passage.content)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-sage-100">
                <span className="text-charcoal-muted">Geçen Süre:</span>
                <span className="font-semibold text-charcoal">{formatDuration(secondsElapsed)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-sage-100">
                <span className="text-charcoal-muted">Doğru Yanıt:</span>
                <span className="font-semibold text-emerald-700">{results.correctCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-sage-100">
                <span className="text-charcoal-muted">Yanlış Yanıt:</span>
                <span className="font-semibold text-rose-600">{results.incorrectCount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-charcoal-muted">Yanıtsız Soru:</span>
                <span className="font-semibold text-charcoal">{results.unansweredCount}</span>
              </div>
            </div>

            {/* Pedagojik Geri Bildirim ve Öneri Alanı */}
            <div className="p-4 rounded-xl bg-sage-50 border border-sage-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-900">
                <AlertCircle className="h-4 w-4 text-brand-700" />
                <span>Eğitsel Değerlendirme & Geri Bildirim</span>
              </div>
              <p className="text-xs text-charcoal leading-relaxed">{results.evaluation.feedback}</p>
              <div className="pt-2 border-t border-sage-200/60 text-xs text-charcoal font-medium">
                <span className="font-bold text-brand-800">Önerilen Sonraki Adım:</span> {results.evaluation.recommendation}
              </div>
            </div>

            {/* Aksiyon Butonları */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" size="md" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Tekrar Dene
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.href = "/panel";
                  }
                }}
              >
                Gelişim Paneline Git
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
