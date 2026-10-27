"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Activity, ExerciseKind } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, RotateCcw, Trophy } from "lucide-react";

export interface ExerciseResult {
  score: number;
  correctCount: number;
  totalCount: number;
  durationSeconds: number;
}

interface ExerciseRunnerProps {
  activity: Activity;
  onComplete: (result: ExerciseResult) => Promise<void>;
  nextActivityHref?: string;
}

interface FlashRound {
  word: string;
  choices: string[];
}

interface FlashWordRound {
  words: string[];
  choices: string[];
  oddOneOut: string;
}

const DISTRACTORS: Record<ExerciseKind, string[]> = {
  peripheral_vision: ["▲", "■", "◆", "✦", "●", "○"],
  target_scan: ["R", "H", "K", "4", "Λ", "A"],
  eye_saccade: ["●"],
  flash_words: [
    "okuma", "dikkat", "bilgi", "anlam", "kitap", "öğrenme", "tarama", "odak",
    "merak", "çözüm", "kaynak", "fikir", "yöntem", "hafıza", "cümle", "metin",
    "başarı", "alışkanlık", "keşif", "düşünce",
  ],
  point_tracking: ["●"],
  infinity_tracking: ["●"],
  chunk_reading: ["hızlı okuma", "bilgi", "dikkatli düşünme", "anlam kurma", "göz hareketi"],
  pacer_reading: ["Kısa metinleri düzenli hızda okuyun.", "Bakışınızı satır boyunca akıcı biçimde ilerletin.", "Anlamı koruyarak gereksiz duraklamaları azaltın."],
  schulte_table: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  regression_prevention: ["okuma", "anlama", "odak", "metin", "ilerleme"],
  digit_memory: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  word_memory: ["kitap", "nehir", "merdiven", "ışık", "kalem", "orman", "soru", "yol"],
  matching_cards: ["daire", "kare", "üçgen", "yıldız", "elma", "bulut"],
  sequence_memory: ["kırmızı", "mavi", "yeşil", "sarı", "mor", "turuncu"],
  passage_memory: ["bilim", "tarih", "doğa", "günlük yaşam", "keşif", "öğrenme"],
  memory_palace: ["salon", "mutfak", "bahçe", "masa", "saat", "kitaplık"],
  n_back: ["A", "B", "C", "D", "E", "F", "G", "H"],
  visual_change: ["●", "■", "▲", "★", "◆", "⬟"],
};

function shuffled<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

const FLASH_LIKE_KINDS: ExerciseKind[] = [
  "flash_words",
  "chunk_reading",
  "pacer_reading",
  "regression_prevention",
  "digit_memory",
  "word_memory",
  "matching_cards",
  "sequence_memory",
  "passage_memory",
  "memory_palace",
  "n_back",
  "visual_change",
];

const FLASH_WORD_DURATIONS = [6000, 6000, 5000, 5000, 4000];
const FLASH_WORD_COUNTS = [3, 4, 3, 4, 3];

export function ExerciseRunner({ activity, onComplete, nextActivityHref }: ExerciseRunnerProps) {
  const kind = activity.type as ExerciseKind;
  const targetSymbol = activity.contentConfig.targetSymbol || (kind === "target_scan" ? "A" : "●");
  const gridSize = Math.min(10, Math.max(3, activity.contentConfig.gridSize || 4));
  const targetCount = Math.min(
    gridSize * gridSize - 1,
    Math.max(3, activity.contentConfig.targetCount || 5)
  );
  const durationLimit = Math.min(180, Math.max(10, activity.contentConfig.timeLimitSeconds || 60));
  const sequenceLength = Math.min(20, Math.max(3, activity.contentConfig.sequenceLength || 4));
  const flashDuration = kind === "flash_words"
    ? FLASH_WORD_DURATIONS[Math.min(5, Math.max(1, activity.level || 1)) - 1]
    : Math.min(3000, Math.max(200, activity.contentConfig.flashDurationMs || 1000));
  const words = activity.contentConfig.wordList?.length
    ? activity.contentConfig.wordList
    : DISTRACTORS[kind];

  const [phase, setPhase] = useState<"idle" | "playing" | "finished">("idle");
  const [timeLeft, setTimeLeft] = useState(durationLimit);
  const [grid, setGrid] = useState<string[]>([]);
  const [targets, setTargets] = useState<number[]>([]);
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [wrongCells, setWrongCells] = useState<number[]>([]);
  const [sequence, setSequence] = useState<number[]>([]);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [saccadeError, setSaccadeError] = useState(false);
  const [flashRounds, setFlashRounds] = useState<FlashRound[]>([]);
  const [flashWordRounds, setFlashWordRounds] = useState<FlashWordRound[]>([]);
  const [flashIndex, setFlashIndex] = useState(0);
  const [flashStage, setFlashStage] = useState<"show" | "choose">("show");
  const [flashCountdown, setFlashCountdown] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [summary, setSummary] = useState<ExerciseResult | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savePending, setSavePending] = useState(false);
  const startedAt = useRef<number>(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const totalRef = useRef(0);
  const completed = useRef(false);

  const finish = (correct: number, wrong: number, total: number) => {
    if (completed.current) return;
    completed.current = true;
    setPhase("finished");
    const result = {
      score: total + wrong > 0 ? Math.round((correct / (total + wrong)) * 100) : 0,
      correctCount: correct,
      totalCount: total,
      durationSeconds: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
    };
    setSummary(result);
    setSaveError(null);
    setSavePending(true);
    void onComplete(result).catch((error: unknown) => {
      console.error("Egzersiz puanı kaydedilemedi:", error);
      setSaveError("Puan kaydedilemedi veya modül ilerlemesi güncellenemedi. Bağlantıyı kontrol edip yeniden deneyin.");
    }).finally(() => setSavePending(false));
  };

  const begin = () => {
    completed.current = false;
    correctRef.current = 0;
    wrongRef.current = 0;
    totalRef.current = kind === "eye_saccade" ? sequenceLength : targetCount;
    setCorrectAnswers(0);
    setSummary(null);
    setSaveError(null);
    setSavePending(false);
    setSaccadeError(false);
    setTimeLeft(durationLimit);
    startedAt.current = Date.now();

    if (kind === "peripheral_vision" || kind === "target_scan") {
      const symbols = DISTRACTORS[kind].filter((symbol) => symbol !== targetSymbol);
      const cells = Array.from({ length: gridSize * gridSize }, () =>
        symbols[Math.floor(Math.random() * symbols.length)]
      );
      const centerIndex = Math.floor(cells.length / 2);
      const availableIndices = cells
        .map((_, index) => index)
        .filter((index) => kind !== "peripheral_vision" || index !== centerIndex);
      const targetIndices = shuffled(availableIndices).slice(0, targetCount);
      targetIndices.forEach((index) => {
        cells[index] = targetSymbol;
      });
      setGrid(cells);
      setTargets(targetIndices);
      setSelectedCells([]);
      setWrongCells([]);
    } else if (kind === "eye_saccade") {
      setSequence(Array.from({ length: sequenceLength }, () => Math.floor(Math.random() * 9)));
      setSequenceIndex(0);
    } else if (kind === "flash_words") {
      const sourceWords = Array.from(new Set(words.length ? words : DISTRACTORS.flash_words));
      const levelIndex = Math.min(5, Math.max(1, activity.level || 1)) - 1;
      const wordCount = FLASH_WORD_COUNTS[levelIndex];
      const rounds = Array.from({ length: targetCount }, () => {
        const roundWords = shuffled(sourceWords).slice(0, wordCount);
        const usedWords = new Set(roundWords);
        const oddOneOut = shuffled(sourceWords.filter((word) => !usedWords.has(word)))[0] || "çalışma";
        return {
          words: roundWords,
          choices: shuffled([...roundWords, oddOneOut]),
          oddOneOut,
        };
      });
      setFlashWordRounds(rounds);
      setFlashRounds([]);
      setFlashIndex(0);
      setFlashStage("show");
      setFlashCountdown(Math.ceil(flashDuration / 1000));
    } else if (FLASH_LIKE_KINDS.includes(kind)) {
      const sourceWords = words.length ? words : DISTRACTORS[kind];
      const rounds = Array.from({ length: targetCount }, () => {
        const word = sourceWords[Math.floor(Math.random() * sourceWords.length)];
        const options = shuffled([word, ...shuffled(sourceWords.filter((item) => item !== word)).slice(0, 3)]);
        return { word, choices: options };
      });
      setFlashRounds(rounds);
      setFlashIndex(0);
      setFlashStage("show");
      setFlashCountdown(Math.ceil(flashDuration / 1000));
    }
    setPhase("playing");
  };

  useEffect(() => {
    if (phase !== "playing" || kind !== "flash_words" || flashStage !== "show") return;
    setFlashCountdown(Math.ceil(flashDuration / 1000));
    const timer = window.setInterval(() => {
      setFlashCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setFlashStage("choose");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [flashDuration, flashIndex, flashStage, kind, phase]);

  useEffect(() => {
    if (phase !== "playing" || timeLeft <= 0) return;
    const timer = window.setTimeout(() => {
      if (timeLeft === 1) {
        finish(correctRef.current, wrongRef.current, totalRef.current);
        setTimeLeft(0);
      } else {
        setTimeLeft((current) => current - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [phase, timeLeft]);

  const handleGridClick = (index: number) => {
    if (phase !== "playing" || selectedCells.includes(index) || wrongCells.includes(index)) return;
    if (targets.includes(index)) {
      const nextSelected = [...selectedCells, index];
      setSelectedCells(nextSelected);
      correctRef.current = nextSelected.length;
      setCorrectAnswers(nextSelected.length);
      if (nextSelected.length === targets.length) finish(nextSelected.length, wrongRef.current, targets.length);
    } else {
      const nextWrong = [...wrongCells, index];
      setWrongCells(nextWrong);
      wrongRef.current = nextWrong.length;
    }
  };

  const handleSaccadeClick = (index: number) => {
    if (phase !== "playing") return;
    if (sequence[index] !== sequence[sequenceIndex]) {
      wrongRef.current += 1;
      setSaccadeError(true);
      return;
    }
    setSaccadeError(false);
    const next = sequenceIndex + 1;
    setSequenceIndex(next);
    correctRef.current = next;
    setCorrectAnswers(next);
    if (next === sequence.length) finish(next, wrongRef.current, sequence.length);
  };

  const handleFlashChoice = (choice: string) => {
    if (phase !== "playing" || flashStage !== "choose") return;
    const isCorrect = kind === "flash_words"
      ? choice === flashWordRounds[flashIndex]?.oddOneOut
      : choice === flashRounds[flashIndex]?.word;
    if (isCorrect) {
      correctRef.current += 1;
      setCorrectAnswers(correctRef.current);
    } else {
      wrongRef.current += 1;
    }
    const next = flashIndex + 1;
    const roundCount = kind === "flash_words" ? flashWordRounds.length : flashRounds.length;
    if (next >= roundCount) {
      finish(correctRef.current, wrongRef.current, roundCount);
      return;
    }
    setFlashIndex(next);
    setFlashStage("show");
  };

  const title = activity.title;
  const instructions = kind === "eye_saccade"
    ? "Sarı noktayı gözlerinizle bulun, o noktaya tıklayın ve bir sonraki sarı noktaya geçin. Noktalar rastgele sıradadır; başınızı sabit tutup yalnızca gözlerinizi hızlı ve kontrollü biçimde hareket ettirin."
    : activity.instructions;
  const progressCount = kind === "eye_saccade" ? sequenceIndex : FLASH_LIKE_KINDS.includes(kind) ? correctAnswers : selectedCells.length;

  return (
    <Card className="mx-auto max-w-2xl border-sage-200">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="amber">{activity.level ? `Seviye ${activity.level} / 5` : "Egzersiz"}</Badge>
          {phase === "playing" && <span className="flex items-center gap-1 text-sm font-mono"><Clock className="h-4 w-4" />{timeLeft} sn</span>}
        </div>
        <CardTitle className="font-serif">{title}</CardTitle>
        <p className="text-sm text-charcoal-muted">{instructions}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {phase === "idle" && (
          <div className="rounded-2xl border border-sage-200 bg-ivory-warm p-8 text-center">
            <p className="mb-5 text-sm text-charcoal-muted">
              Beş seviyeli ilerleme sisteminde sonraki seviye, bu seviyeden en az %70 puan aldığınızda açılır.
            </p>
            <Button variant="amber" size="lg" onClick={begin}><Play className="mr-2 h-4 w-4" />Egzersizi başlat</Button>
          </div>
        )}

        {phase === "playing" && (kind === "peripheral_vision" || kind === "target_scan") && (
          <div className="space-y-3">
            <p className="text-sm text-charcoal-muted">Hedef: <strong className="text-lg">{targetSymbol}</strong> · Bulunan {selectedCells.length}/{targets.length}</p>
            {kind === "peripheral_vision" && <div className="text-center text-xs text-charcoal-muted">Bakışınızı sabit merkez işaretinde tutun; çevredeki hedeflere tıklayın.</div>}
            <div className="grid gap-2 rounded-xl bg-ivory-warm p-3" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
              {grid.map((symbol, index) => (
                <button key={index} type="button" aria-label={`Izgara hücresi ${index + 1}`} onClick={() => handleGridClick(index)} className={`aspect-square rounded-lg border text-xl font-bold ${selectedCells.includes(index) ? "border-emerald-500 bg-emerald-100 text-emerald-800" : wrongCells.includes(index) ? "border-rose-300 bg-rose-100 text-rose-700" : kind === "peripheral_vision" && index === Math.floor(grid.length / 2) ? "border-amber-400 bg-amber-100 text-brand-900" : "border-sage-200 bg-white text-charcoal hover:bg-amber-50"}`}>
                  {kind === "peripheral_vision" && index === Math.floor(grid.length / 2) ? "◎" : symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === "playing" && kind === "eye_saccade" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">Nasıl yapılır?</p>
              <ol className="mt-1 list-inside list-decimal space-y-1">
                <li>Sarı noktayı gözlerinizle bulun.</li>
                <li>Bakışınızı sarı noktaya taşıdıktan sonra o noktaya tıklayın.</li>
                <li>Yeni sarı nokta yanınca aynı işlemi tekrarlayın.</li>
              </ol>
              <p className="mt-2 text-xs">Başınızı sabit tutun; yalnızca gözlerinizi hızlı ve kontrollü hareket ettirin.</p>
            </div>
            <div className="flex items-center justify-between text-sm text-charcoal-muted">
              <span>Hedef {sequenceIndex + 1}/{sequence.length}</span>
              <span>{sequenceIndex} doğru · {wrongRef.current} yanlış</span>
            </div>
            {saccadeError && <p role="alert" className="text-sm font-semibold text-rose-700">Bu nokta sıradaki hedef değil. Sarı noktaya tıklayın.</p>}
            <div className="grid max-w-sm grid-cols-3 gap-3 mx-auto rounded-xl bg-ivory-warm p-4">
              {Array.from({ length: 9 }, (_, index) => (
                <button key={index} type="button" aria-label={sequence[sequenceIndex] === index ? "Sıradaki sarı hedef" : `Bakış noktası ${index + 1}`} onClick={() => handleSaccadeClick(index)} className={`aspect-square rounded-full border-2 text-2xl transition-colors ${sequence[sequenceIndex] === index ? "border-amber-500 bg-amber-300 text-brand-900 shadow-md" : sequence.slice(0, sequenceIndex).includes(index) ? "border-emerald-400 bg-emerald-100 text-emerald-700" : "border-sage-200 bg-white text-transparent hover:border-amber-300"}`}>
                  {sequence[sequenceIndex] === index ? "●" : sequence.slice(0, sequenceIndex).includes(index) ? "✓" : "●"}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === "playing" && kind === "flash_words" && flashWordRounds[flashIndex] && (
          <div className="space-y-4 rounded-xl bg-ivory-warm p-6 text-center">
            <p className="text-xs text-charcoal-muted">Tur {flashIndex + 1}/{flashWordRounds.length} · {flashWordRounds[flashIndex].words.length} kelime</p>
            {flashStage === "show" ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-charcoal">Bu kelimeleri aklınızda tutun:</p>
                  <span className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-sm font-bold tabular-nums text-amber-900" aria-live="polite">
                    {flashCountdown} sn
                  </span>
                </div>
                <div aria-live="polite" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {flashWordRounds[flashIndex].words.map((word) => (
                    <div key={word} className="rounded-lg border border-amber-200 bg-white px-3 py-3 text-lg font-bold text-brand-900">{word}</div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-charcoal">Az önceki listede hangisi yoktu?</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {flashWordRounds[flashIndex].choices.map((choice) => <Button key={choice} variant="outline" onClick={() => handleFlashChoice(choice)}>{choice}</Button>)}
                </div>
              </>
            )}
          </div>
        )}

        {phase === "playing" && kind !== "flash_words" && FLASH_LIKE_KINDS.includes(kind) && flashRounds[flashIndex] && (
          <div className="space-y-4 rounded-xl bg-ivory-warm p-6 text-center">
            <p className="text-xs text-charcoal-muted">Kelime {flashIndex + 1}/{flashRounds.length}</p>
            {flashStage === "show" ? (
              <div aria-live="polite" className="flex min-h-36 items-center justify-center text-3xl font-extrabold text-brand-900">{flashRounds[flashIndex].word}</div>
            ) : (
              <>
                <p className="text-sm text-charcoal-muted">Az önce gördüğünüz kelime hangisiydi?</p>
                <div className="grid grid-cols-2 gap-3">
                  {flashRounds[flashIndex].choices.map((choice) => <Button key={choice} variant="outline" onClick={() => handleFlashChoice(choice)}>{choice}</Button>)}
                </div>
              </>
            )}
          </div>
        )}

        {phase === "finished" && summary && (
          <div className="space-y-4 rounded-2xl border border-sage-200 bg-ivory-warm p-6 text-center">
            <Trophy className="mx-auto h-9 w-9 text-amber-600" />
            <h3 className="text-xl font-bold font-serif text-charcoal">Deneme tamamlandı</h3>
            <div className="text-4xl font-extrabold font-mono text-brand-900">%{summary.score}</div>
            <p className="text-sm text-charcoal-muted">{summary.correctCount}/{summary.totalCount} doğru · {summary.durationSeconds} saniye</p>
            {summary.score >= 70 ? (
              <p className="text-sm font-semibold text-emerald-700">
                {savePending ? "Başarılı puanınız kaydediliyor..." : saveError ? "Puanınız başarılı; sonraki seviye için kaydın tamamlanması gerekir." : "Başarılı! Sonraki seviye açıldı."}
              </p>
            ) : <p className="text-sm font-semibold text-amber-800">Sonraki seviyeyi açmak için %70’e ulaşın.</p>}
            {saveError && <p role="alert" className="text-sm text-red-800">{saveError}</p>}
            {!savePending && !saveError && nextActivityHref && (
              <Link href={nextActivityHref}>
                <Button variant="primary">
                  Sonraki egzersize geç
                </Button>
              </Link>
            )}
            <Button variant="outline" onClick={begin} disabled={savePending}><RotateCcw className="mr-2 h-4 w-4" />Yeniden dene</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
