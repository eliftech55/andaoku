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

interface ChunkRound {
  group: string[];
  choices: string[][];
}

interface PassageMemoryRound {
  passage: string;
  pieces: string[];
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

interface WordMemoryRound {
  words: string[];
}

interface MemoryPalaceRound {
  rows: number;
  columns: number;
  words: string[];
}

interface MatchingCard {
  id: number;
  value: string;
  flipped: boolean;
  matched: boolean;
}

interface SequenceMemoryRound {
  sequence: number[];
  choices: number[];
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

const FLASH_WORD_DURATIONS = [6000, 5500, 5000, 4500, 4000];
const FLASH_WORD_COUNTS = [3, 4, 5, 6, 7];
const WORD_MEMORY_DURATIONS = [10000, 9000, 8500, 8000, 7500];
const WORD_MEMORY_COUNTS = [4, 5, 6, 7, 8];
const EXERCISE_ROUND_COUNT = 5;
const MEMORY_PALACE_LEVELS = [
  { rows: 2, columns: 2, duration: 5 },
  { rows: 2, columns: 3, duration: 5 },
  { rows: 3, columns: 3, duration: 5 },
  { rows: 3, columns: 3, duration: 5 },
  { rows: 3, columns: 3, duration: 5 },
] as const;

export function ExerciseRunner({ activity, onComplete, nextActivityHref }: ExerciseRunnerProps) {
  const kind = activity.type as ExerciseKind;
  const targetSymbol = activity.contentConfig.targetSymbol || (kind === "target_scan" ? "A" : "●");
  const gridSize = Math.min(10, Math.max(3, activity.contentConfig.gridSize || 4));
  const targetCount = Math.min(
    gridSize * gridSize - 1,
    Math.max(3, activity.contentConfig.targetCount || 5)
  );
  const durationLimit = kind === "matching_cards"
    ? 75
    : Math.min(
      180,
      Math.max(kind === "word_memory" ? 75 : 10, activity.contentConfig.timeLimitSeconds || 60)
    );
  const sequenceLength = Math.min(20, Math.max(3, activity.contentConfig.sequenceLength || 4));
  const flashDuration = kind === "flash_words"
    ? FLASH_WORD_DURATIONS[Math.min(5, Math.max(1, activity.level || 1)) - 1]
    : kind === "chunk_reading"
      ? 2500
    : kind === "passage_memory"
      ? 5000
    : Math.min(3000, Math.max(200, activity.contentConfig.flashDurationMs || 1000));
  const wordMemoryDuration = WORD_MEMORY_DURATIONS[Math.min(5, Math.max(1, activity.level || 1)) - 1];
  const memoryPalaceLevel = MEMORY_PALACE_LEVELS[Math.min(5, Math.max(1, activity.level || 1)) - 1];
  const memoryPalaceRoundConfig = Array.from({ length: EXERCISE_ROUND_COUNT }, () => memoryPalaceLevel);
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
  const [chunkRounds, setChunkRounds] = useState<ChunkRound[]>([]);
  const [passageMemoryRounds, setPassageMemoryRounds] = useState<PassageMemoryRound[]>([]);
  const [passageMemoryPlaced, setPassageMemoryPlaced] = useState<(string | null)[]>([]);
  const [passageMemoryDragged, setPassageMemoryDragged] = useState<string | null>(null);
  const [wordMemoryRounds, setWordMemoryRounds] = useState<WordMemoryRound[]>([]);
  const [memoryPalaceRounds, setMemoryPalaceRounds] = useState<MemoryPalaceRound[]>([]);
  const [memoryPalacePlaced, setMemoryPalacePlaced] = useState<(string | null)[]>([]);
  const [memoryPalaceDragged, setMemoryPalaceDragged] = useState<string | null>(null);
  const [matchingCards, setMatchingCards] = useState<MatchingCard[]>([]);
  const [matchingFirst, setMatchingFirst] = useState<number | null>(null);
  const [matchingBusy, setMatchingBusy] = useState(false);
  const [matchingMoves, setMatchingMoves] = useState(0);
  const [matchingPairs, setMatchingPairs] = useState(0);
  const [sequenceMemoryRound, setSequenceMemoryRound] = useState<SequenceMemoryRound | null>(null);
  const [sequenceMemoryInput, setSequenceMemoryInput] = useState<number[]>([]);
  const [sequenceMemoryStage, setSequenceMemoryStage] = useState<"show" | "choose">("show");
  const [sequenceMemoryVisibleCount, setSequenceMemoryVisibleCount] = useState(0);
  const [flashIndex, setFlashIndex] = useState(0);
  const [flashStage, setFlashStage] = useState<"show" | "choose">("show");
  const [flashCountdown, setFlashCountdown] = useState(0);
  const [wordMemoryInputs, setWordMemoryInputs] = useState<string[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [summary, setSummary] = useState<ExerciseResult | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savePending, setSavePending] = useState(false);
  const startedAt = useRef<number>(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const totalRef = useRef(0);
  const flashDeadlineRef = useRef<number | null>(null);
  const matchingMatchesRef = useRef(0);
  const matchingMovesRef = useRef(0);
  const completed = useRef(false);

  const finish = (correct: number, wrong: number, total: number) => {
    if (completed.current) return;
    completed.current = true;
    setPhase("finished");
    const score = kind === "matching_cards"
      ? matchingMovesRef.current > 0
        ? Math.min(100, Math.round((matchingMatchesRef.current / matchingMovesRef.current) * 200))
        : 0
      : total > 0
        ? Math.round((correct / total) * 100)
        : 0;
    const result = {
      score,
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
    totalRef.current =
      kind === "eye_saccade"
        ? sequenceLength
        : ["matching_cards", "point_tracking"].includes(kind)
          ? EXERCISE_ROUND_COUNT
          : kind === "memory_palace"
            ? memoryPalaceRoundConfig.length
            : targetCount;
    flashDeadlineRef.current = null;
    setCorrectAnswers(0);
    setSummary(null);
    setSaveError(null);
    setSavePending(false);
    setSaccadeError(false);
    setWordMemoryInputs([]);
    setFlashIndex(0);
    setChunkRounds([]);
    setPassageMemoryRounds([]);
    setPassageMemoryPlaced([]);
    setPassageMemoryDragged(null);
    setMatchingCards([]);
    setMatchingFirst(null);
    setMatchingBusy(false);
    setMatchingMoves(0);
    setMatchingPairs(0);
    matchingMatchesRef.current = 0;
    matchingMovesRef.current = 0;
    setSequenceMemoryRound(null);
    setSequenceMemoryInput([]);
    setSequenceMemoryStage("show");
    setSequenceMemoryVisibleCount(0);
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
      const positions = shuffled(Array.from({ length: 9 }, (_, index) => index));
      setSequence(positions.slice(0, Math.min(sequenceLength, positions.length)));
      setSequenceIndex(0);
    } else if (kind === "flash_words") {
      const sourceWords = Array.from(new Set(words.length ? words : DISTRACTORS.flash_words));
      const levelIndex = Math.min(5, Math.max(1, activity.level || 1)) - 1;
      const wordCount = FLASH_WORD_COUNTS[levelIndex];
      const rounds = Array.from({ length: EXERCISE_ROUND_COUNT }, () => {
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
    } else if (kind === "word_memory") {
      const sourceWords = words.length ? words : DISTRACTORS.word_memory;
      const levelIndex = Math.min(5, Math.max(1, activity.level || 1)) - 1;
      const wordCount = WORD_MEMORY_COUNTS[levelIndex];
      const rounds = Array.from({ length: EXERCISE_ROUND_COUNT }, () => ({
        words: shuffled(sourceWords).slice(0, wordCount),
      }));
      setWordMemoryRounds(rounds);
      setFlashRounds([]);
      setFlashWordRounds([]);
      setFlashIndex(0);
      setFlashStage("show");
      setFlashCountdown(Math.ceil(wordMemoryDuration / 1000));
      setWordMemoryInputs(Array(rounds[0]?.words.length ?? 0).fill(""));
    } else if (kind === "memory_palace") {
      const sourceWords = Array.from(new Set([
        ...(words.length ? words : DISTRACTORS.memory_palace),
        "kalem", "çiçek", "köprü", "bulut", "nehir", "orman", "kitap", "yıldız", "masa",
      ]));
      const rounds = memoryPalaceRoundConfig.map(({ rows, columns }) => {
        const wordCount = rows * columns;
        return {
          rows,
          columns,
          words: shuffled(sourceWords).slice(0, wordCount),
        };
      });
      setMemoryPalaceRounds(rounds);
      setMemoryPalacePlaced([]);
      setMemoryPalaceDragged(null);
      setFlashRounds([]);
      setFlashWordRounds([]);
      setFlashIndex(0);
      setFlashStage("show");
      setFlashCountdown(memoryPalaceRoundConfig[0].duration);
    } else if (kind === "matching_cards") {
      const levelIndex = Math.min(5, Math.max(1, activity.level || 1)) - 1;
      const pairCount = Math.min(6, 3 + levelIndex);
      const sourceValues = Array.from(new Set([
        ...(words.length ? words : DISTRACTORS.matching_cards),
        "güneş", "ay", "çiçek", "ev",
      ])).slice(0, pairCount);
      const cards = shuffled(sourceValues.flatMap((value, pairIndex) => [
        { id: pairIndex * 2, value, flipped: false, matched: false },
        { id: pairIndex * 2 + 1, value, flipped: false, matched: false },
      ]));
      setMatchingCards(cards);
      setMatchingFirst(null);
      setMatchingMoves(0);
      setMatchingPairs(0);
    } else if (kind === "sequence_memory") {
      const sequenceLength = 1;
      const sequence = shuffled(Array.from({ length: 9 }, (_, index) => index)).slice(0, sequenceLength);
      setSequenceMemoryRound({
        sequence,
        choices: Array.from({ length: 9 }, (_, index) => index),
      });
      setSequenceMemoryInput([]);
      setSequenceMemoryStage("show");
      setSequenceMemoryVisibleCount(0);
      setFlashIndex(0);
    } else if (kind === "point_tracking") {
      setFlashIndex(0);
    } else if (kind === "chunk_reading") {
      const sourceWords = Array.from(new Set([
        ...(words.length ? words : DISTRACTORS.chunk_reading),
        ...DISTRACTORS.chunk_reading,
        "odak",
        "anlam",
      ]));
      const levelIndex = Math.min(5, Math.max(1, activity.level || 1)) - 1;
      const groupSize = levelIndex >= 2 ? 3 : 2;
      const rounds = Array.from({ length: EXERCISE_ROUND_COUNT }, () => {
        const group = shuffled(sourceWords).slice(0, groupSize);
        const correctKey = group.join(" • ");
        const distractorGroups: string[][] = [];
        const usedKeys = new Set([correctKey]);
        let attempts = 0;
        while (distractorGroups.length < 3 && attempts < 30) {
          const candidate = shuffled(sourceWords).slice(0, groupSize);
          const candidateKey = candidate.join(" • ");
          attempts += 1;
          if (candidate.length === groupSize && !usedKeys.has(candidateKey)) {
            usedKeys.add(candidateKey);
            distractorGroups.push(candidate);
          }
        }
        while (distractorGroups.length < 3) {
          const candidate = Array.from({ length: groupSize }, (_, index) =>
            sourceWords[(index + distractorGroups.length + 1) % sourceWords.length]
          );
          const candidateKey = candidate.join(" • ");
          if (!usedKeys.has(candidateKey)) {
            usedKeys.add(candidateKey);
            distractorGroups.push(candidate);
          }
        }
        return {
          group,
          choices: shuffled([group, ...distractorGroups]),
        };
      });
      setChunkRounds(rounds);
      setFlashIndex(0);
      setFlashStage("show");
      setFlashCountdown(Math.ceil(flashDuration / 1000));
    } else if (kind === "passage_memory") {
      const passages = [
        "Düzenli okuma, kelime dağarcığını geliştirir. Yeni kelimeler, metinleri anlamayı kolaylaştırır. Bu alışkanlık bilgiyi daha kolay hatırlamayı sağlar.",
        "Arılar çiçeklerden nektar toplar. Bu sırada bitkilerin tozlaşmasına yardımcı olurlar. Böylece birçok bitkinin üremesine katkı sağlarlar.",
        "Su döngüsünde güneş, suyun buharlaşmasını sağlar. Buhar yükselerek bulutları oluşturur. Yağışla birlikte su yeniden yeryüzüne döner.",
        "Kütüphaneler farklı konularda bilgi edinmek isteyenler için önemli kaynaklardır. Kitaplar düzenli biçimde sınıflandırılır. Sessiz ortam, okuyucuların dikkatini korumasına yardımcı olur.",
        "Bir hedefe ulaşmak için önce plan yapmak gerekir. Küçük adımlarla ilerlemek süreci kolaylaştırır. Düzenli çaba, başarıya ulaşma olasılığını artırır.",
      ];
      const rounds = passages.map((passage) => {
        const sentences = passage.match(/[^.!?]+[.!?]+/g) || [passage];
        return { passage, pieces: sentences.map((sentence) => sentence.trim()) };
      });
      setPassageMemoryRounds(rounds);
      setPassageMemoryPlaced([]);
      setPassageMemoryDragged(null);
      setFlashIndex(0);
      setFlashStage("show");
      setFlashCountdown(Math.ceil(flashDuration / 1000));
    } else if (FLASH_LIKE_KINDS.includes(kind)) {
      const sourceWords = words.length ? words : DISTRACTORS[kind];
      const rounds = Array.from({ length: EXERCISE_ROUND_COUNT }, () => {
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
    if (phase !== "playing" || kind !== "memory_palace" || flashStage !== "show") return;
    const duration = 5000;
    const deadline = Date.now() + duration;
    flashDeadlineRef.current = deadline;
    setFlashCountdown(5);
    const countdownTimer = window.setInterval(() => {
      setFlashCountdown(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 100);
    const finishTimer = window.setTimeout(() => {
      setFlashCountdown(0);
      setMemoryPalacePlaced(Array(memoryPalaceRounds[flashIndex]?.words.length ?? 0).fill(null));
      setFlashStage("choose");
    }, duration);
    return () => {
      window.clearInterval(countdownTimer);
      window.clearTimeout(finishTimer);
      if (flashDeadlineRef.current === deadline) flashDeadlineRef.current = null;
    };
  }, [flashIndex, flashStage, kind, memoryPalaceRounds, phase]);

  useEffect(() => {
    if (phase !== "playing" || !["flash_words", "word_memory", "chunk_reading", "passage_memory"].includes(kind) || flashStage !== "show") return;
    const displayDuration = kind === "word_memory"
      ? wordMemoryDuration
      : flashDuration;
    const deadline = Date.now() + displayDuration;
    flashDeadlineRef.current = deadline;
    const updateCountdown = () => {
      const remaining = Math.max(0, deadline - Date.now());
      setFlashCountdown(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        if (kind === "memory_palace") {
          setMemoryPalacePlaced(Array(memoryPalaceRounds[flashIndex]?.words.length ?? 0).fill(null));
        } else if (kind === "passage_memory") {
          setPassageMemoryPlaced(Array(passageMemoryRounds[flashIndex]?.pieces.length ?? 0).fill(null));
        }
        setFlashStage("choose");
      }
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 100);
    return () => {
      window.clearInterval(timer);
      if (flashDeadlineRef.current === deadline) flashDeadlineRef.current = null;
    };
  }, [flashDuration, flashIndex, flashStage, kind, memoryPalaceRounds, phase, sequenceMemoryStage, wordMemoryDuration]);

  useEffect(() => {
    if (phase !== "playing" || kind !== "sequence_memory" || !sequenceMemoryRound || sequenceMemoryStage !== "show") {
      return;
    }
    setSequenceMemoryVisibleCount(0);
    const timer = window.setInterval(() => {
      setSequenceMemoryVisibleCount((current) => {
        if (current + 1 >= sequenceMemoryRound.sequence.length) {
          window.clearInterval(timer);
          window.setTimeout(() => setSequenceMemoryStage("choose"), 500);
          return sequenceMemoryRound.sequence.length;
        }
        return current + 1;
      });
    }, 700);
    return () => window.clearInterval(timer);
  }, [kind, phase, sequenceMemoryRound, sequenceMemoryStage]);

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
    if (index !== sequence[sequenceIndex]) {
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

  const handleTrackingRoundComplete = () => {
    if (phase !== "playing" || !["infinity_tracking", "point_tracking"].includes(kind)) return;
    correctRef.current += 1;
    setCorrectAnswers(correctRef.current);
    const next = flashIndex + 1;
    if (next >= EXERCISE_ROUND_COUNT) {
      finish(correctRef.current, wrongRef.current, EXERCISE_ROUND_COUNT);
      return;
    }
    setFlashIndex(next);
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

  const handleChunkChoice = (choice: string[]) => {
    if (phase !== "playing" || kind !== "chunk_reading" || flashStage !== "choose") return;
    const round = chunkRounds[flashIndex];
    const isCorrect = Boolean(round) && choice.join(" • ") === round.group.join(" • ");
    if (isCorrect) {
      correctRef.current += 1;
      setCorrectAnswers(correctRef.current);
    } else {
      wrongRef.current += 1;
    }
    const next = flashIndex + 1;
    if (next >= chunkRounds.length) {
      finish(correctRef.current, wrongRef.current, chunkRounds.length);
      return;
    }
    setFlashIndex(next);
    setFlashStage("show");
    setFlashCountdown(Math.ceil(flashDuration / 1000));
  };

  const handlePassageMemoryDrop = (targetIndex: number) => {
    if (
      phase !== "playing" ||
      kind !== "passage_memory" ||
      flashStage !== "choose" ||
      !passageMemoryDragged ||
      passageMemoryPlaced[targetIndex]
    ) return;

    const round = passageMemoryRounds[flashIndex];
    if (!round) return;
    const nextPlaced = [...passageMemoryPlaced];
    nextPlaced[targetIndex] = passageMemoryDragged;
    setPassageMemoryPlaced(nextPlaced);
    setPassageMemoryDragged(null);

    if (nextPlaced.every(Boolean)) {
      const correct = nextPlaced.every((piece, index) => piece === round.pieces[index]);
      if (correct) {
        correctRef.current += 1;
        setCorrectAnswers(correctRef.current);
      } else {
        wrongRef.current += 1;
      }
      const next = flashIndex + 1;
      if (next >= passageMemoryRounds.length) {
        finish(correctRef.current, wrongRef.current, passageMemoryRounds.length);
        return;
      }
      setFlashIndex(next);
      setFlashStage("show");
      setFlashCountdown(Math.ceil(flashDuration / 1000));
    }
  };

  const handleMemoryPalaceDrop = (targetIndex: number) => {
    if (
      phase !== "playing" ||
      kind !== "memory_palace" ||
      flashStage !== "choose" ||
      !memoryPalaceDragged ||
      memoryPalacePlaced[targetIndex]
    ) return;

    const round = memoryPalaceRounds[flashIndex];
    if (!round) return;
    const nextPlaced = [...memoryPalacePlaced];
    nextPlaced[targetIndex] = memoryPalaceDragged;
    setMemoryPalacePlaced(nextPlaced);
    setMemoryPalaceDragged(null);

    if (nextPlaced.every(Boolean)) {
      const correct = nextPlaced.reduce(
        (count, word, index) => count + (word === round.words[index] ? 1 : 0),
        0
      );
      correctRef.current += correct === round.words.length ? 1 : 0;
      wrongRef.current += correct === round.words.length ? 0 : 1;
      setCorrectAnswers(correctRef.current);
      const next = flashIndex + 1;
      if (next >= memoryPalaceRounds.length) {
        finish(correctRef.current, wrongRef.current, memoryPalaceRounds.length);
        return;
      }
      setFlashIndex(next);
      setFlashStage("show");
      setFlashCountdown(memoryPalaceRoundConfig[next].duration);
    }
  };

  const handleMatchingCardClick = (index: number) => {
    if (phase !== "playing" || kind !== "matching_cards" || matchingBusy) return;
    const card = matchingCards[index];
    if (!card || card.flipped || card.matched) return;

    const revealedCards = matchingCards.map((item, cardIndex) =>
      cardIndex === index ? { ...item, flipped: true } : item
    );
    setMatchingCards(revealedCards);

    if (matchingFirst === null) {
      setMatchingFirst(index);
      return;
    }

    setMatchingMoves((current) => current + 1);
    matchingMovesRef.current += 1;
    const firstCard = revealedCards[matchingFirst];
    const isMatch = firstCard?.value === card.value;
    if (isMatch) {
      const matchedCards = revealedCards.map((item, cardIndex) =>
        cardIndex === matchingFirst || cardIndex === index
          ? { ...item, matched: true }
          : item
      );
      const nextPairs = matchingPairs + 1;
      setMatchingCards(matchedCards);
      setMatchingPairs(nextPairs);
      matchingMatchesRef.current += 1;
      setMatchingFirst(null);

      if (nextPairs === matchingCards.length / 2) {
        correctRef.current += 1;
        setCorrectAnswers(correctRef.current);
        const nextRound = flashIndex + 1;
        if (nextRound >= EXERCISE_ROUND_COUNT) {
          finish(correctRef.current, wrongRef.current, totalRef.current);
          return;
        }
        setFlashIndex(nextRound);
        window.setTimeout(() => {
          const pairCount = matchingCards.length / 2;
          const values = shuffled(Array.from(new Set(matchingCards.map((item) => item.value))));
          setMatchingCards(shuffled(values.flatMap((value, pairIndex) => [
            { id: pairIndex * 2, value, flipped: false, matched: false },
            { id: pairIndex * 2 + 1, value, flipped: false, matched: false },
          ])));
          setMatchingPairs(0);
          setMatchingMoves(0);
        }, 500);
      }
      return;
    }

    wrongRef.current += 1;
    setMatchingBusy(true);
    window.setTimeout(() => {
      setMatchingCards((current) => current.map((item, cardIndex) =>
        cardIndex === matchingFirst || cardIndex === index ? { ...item, flipped: false } : item
      ));
      setMatchingFirst(null);
      setMatchingBusy(false);
    }, 700);
  };

  const handleSequenceMemoryClick = (index: number) => {
    if (
      phase !== "playing" ||
      kind !== "sequence_memory" ||
      !sequenceMemoryRound ||
      sequenceMemoryStage !== "choose"
    ) return;

    const nextInput = [...sequenceMemoryInput, index];
    setSequenceMemoryInput(nextInput);
    const expectedIndex = nextInput.length - 1;
    if (index !== sequenceMemoryRound.sequence[expectedIndex]) {
      wrongRef.current += 1;
      finish(correctRef.current, wrongRef.current, EXERCISE_ROUND_COUNT);
      return;
    }

    if (nextInput.length === sequenceMemoryRound.sequence.length) {
      correctRef.current += 1;
      setCorrectAnswers(correctRef.current);
      const nextRound = flashIndex + 1;
      if (nextRound >= EXERCISE_ROUND_COUNT) {
        finish(correctRef.current, wrongRef.current, EXERCISE_ROUND_COUNT);
        return;
      }
      const nextLength = Math.min(9, sequenceMemoryRound.sequence.length + 1);
      const nextSequence = shuffled(Array.from({ length: 9 }, (_, cell) => cell)).slice(0, nextLength);
      setFlashIndex(nextRound);
      setSequenceMemoryRound({ sequence: nextSequence, choices: Array.from({ length: 9 }, (_, cell) => cell) });
      setSequenceMemoryInput([]);
      setSequenceMemoryStage("show");
      setSequenceMemoryVisibleCount(0);
    }
  };

  const handleWordMemorySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phase !== "playing" || kind !== "word_memory" || flashStage !== "choose") return;

    const expected = wordMemoryRounds[flashIndex]?.words ?? [];
    const answer = wordMemoryInputs.map((word) => word.trim().toLocaleLowerCase("tr-TR"));
    const expectedCounts = new Map<string, number>();
    expected.forEach((word) => {
      const normalizedWord = word.toLocaleLowerCase("tr-TR");
      expectedCounts.set(normalizedWord, (expectedCounts.get(normalizedWord) || 0) + 1);
    });
    const isCorrect = answer.length === expected.length && answer.every((word) => {
      const remaining = expectedCounts.get(word) || 0;
      if (remaining === 0) return false;
      expectedCounts.set(word, remaining - 1);
      return true;
    });

    if (isCorrect) {
      correctRef.current += 1;
      setCorrectAnswers(correctRef.current);
    } else {
      wrongRef.current += 1;
    }

    const next = flashIndex + 1;
    if (next >= wordMemoryRounds.length) {
      finish(correctRef.current, wrongRef.current, wordMemoryRounds.length);
      return;
    }
    setFlashIndex(next);
    setFlashStage("show");
    setFlashCountdown(Math.ceil(wordMemoryDuration / 1000));
    setWordMemoryInputs(Array(expected.length).fill(""));
  };

  const title = activity.title;
  const instructions = kind === "eye_saccade"
    ? "3×3 alanda her turda yalnızca sarı noktaya tıklayın. Sarı nokta her doğru tıklamadan sonra başka bir konuma geçer; beyaz noktalara tıklamayın."
    : activity.instructions;
  const progressCount = kind === "eye_saccade" ? sequenceIndex : FLASH_LIKE_KINDS.includes(kind) ? correctAnswers : selectedCells.length;
  const roundNumber = kind === "eye_saccade"
    ? Math.min(sequenceIndex + 1, sequenceLength)
    : kind === "matching_cards"
      ? Math.min(flashIndex + 1, EXERCISE_ROUND_COUNT)
      : kind === "sequence_memory" || kind === "point_tracking"
        ? Math.min(flashIndex + 1, EXERCISE_ROUND_COUNT)
    : FLASH_LIKE_KINDS.includes(kind)
      ? Math.min(flashIndex + 1, EXERCISE_ROUND_COUNT)
      : Math.min(selectedCells.length + 1, EXERCISE_ROUND_COUNT);
  const totalRounds = EXERCISE_ROUND_COUNT;

  return (
    <Card className="mx-auto max-w-2xl border-sage-200">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="amber">{activity.level ? `Seviye ${activity.level} / 5` : "Egzersiz"}</Badge>
        {phase === "playing" && (
          <div className="flex items-center gap-3 text-sm font-mono">
            <span>Tur {roundNumber}/{totalRounds}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{timeLeft} sn</span>
          </div>
        )}
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

        {phase === "playing" && kind === "chunk_reading" && chunkRounds[flashIndex] && (
          <div className="space-y-4 rounded-xl bg-ivory-warm p-6 text-center">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-charcoal">Kelime grubunu okuyup aklınızda tutun.</p>
              <span className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-sm font-bold tabular-nums text-amber-900" aria-live="polite">
                {flashCountdown} sn
              </span>
            </div>
            {flashStage === "show" ? (
              <>
                <div className="flex min-h-36 items-center justify-center rounded-xl border border-amber-200 bg-white px-4 text-2xl font-extrabold text-brand-900">
                  {chunkRounds[flashIndex].group.join(" • ")}
                </div>
                <p className="text-xs text-charcoal-muted">
                  Kelimeleri tek tek değil, tek bir anlam grubu olarak okuyun.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-charcoal">
                  Az önce gördüğünüz kelime grubu hangisiydi?
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {chunkRounds[flashIndex].choices.map((choice) => (
                    <Button key={choice.join("-")} variant="outline" onClick={() => handleChunkChoice(choice)}>
                      {choice.join(" • ")}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {phase === "playing" && kind === "passage_memory" && passageMemoryRounds[flashIndex] && (
          <div className="space-y-4 rounded-xl bg-ivory-warm p-6 text-center">
            <p className="text-xs font-semibold text-charcoal-muted">
              Tur {flashIndex + 1}/{passageMemoryRounds.length}
            </p>
            {flashStage === "show" ? (
              <>
                <p className="text-sm font-semibold text-charcoal">Parçaları ve doğru sıralarını hatırlayın.</p>
                <div className="space-y-2 text-left">
                  {passageMemoryRounds[flashIndex].pieces.map((piece, index) => (
                    <div key={piece} className="rounded-lg border border-amber-200 bg-white p-3 text-sm leading-relaxed text-brand-900">
                      {index + 1}. {piece}
                    </div>
                  ))}
                </div>
                <span className="inline-block rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-sm font-bold tabular-nums text-amber-900" aria-live="polite">
                  {flashCountdown} sn
                </span>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-charcoal">Parçaları doğru sıraya sürükleyin:</p>
                <div className="space-y-2 text-left">
                  {passageMemoryPlaced.map((piece, index) => (
                    <div
                      key={index}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handlePassageMemoryDrop(index)}
                      className="min-h-14 rounded-lg border-2 border-dashed border-sage-300 bg-white p-3 text-sm text-brand-900"
                    >
                      {piece ? `${index + 1}. ${piece}` : `${index + 1}. Buraya bırakın`}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 text-left">
                  {passageMemoryRounds[flashIndex].pieces
                    .filter((piece) => !passageMemoryPlaced.includes(piece))
                    .sort()
                    .map((piece) => (
                      <button
                        key={piece}
                        type="button"
                        draggable
                        onDragStart={() => setPassageMemoryDragged(piece)}
                        onDragEnd={() => setPassageMemoryDragged(null)}
                        className="cursor-grab rounded-lg border border-brand-200 bg-white p-3 text-sm font-semibold text-brand-900 shadow-sm active:cursor-grabbing"
                      >
                        {piece}
                      </button>
                    ))}
                </div>
              </>
            )}
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
                <li>3×3 alanda sarı noktayı bulun.</li>
                <li>Sarı noktaya tıklayın; beyaz noktalara tıklamayın.</li>
                <li>Yeni sarı nokta başka bir yerde görünür. 5 tur tamamlanana kadar tekrarlayın.</li>
              </ol>
              <p className="mt-2 text-xs">Amaç, gözlerinizi farklı konumlara hızlıca taşıyıp doğru hedefi seçmektir. Başınızı sabit tutmaya çalışın.</p>
            </div>
            <div className="flex items-center justify-between text-sm text-charcoal-muted">
              <span>Hedef {sequenceIndex + 1}/{sequence.length}</span>
              <span>{sequenceIndex} doğru · {wrongRef.current} yanlış</span>
            </div>
            {saccadeError && <p role="alert" className="text-sm font-semibold text-rose-700">Bu nokta sıradaki hedef değil. Sarı noktaya tıklayın.</p>}
            <div className="flex items-center justify-center gap-4 text-xs text-charcoal-muted">
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-amber-400" />Tıklanacak hedef</span>
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full border border-sage-300 bg-white" />Tıklanmayacak alan</span>
            </div>
            <div className="grid max-w-sm grid-cols-3 gap-3 mx-auto rounded-xl bg-ivory-warm p-4">
              {Array.from({ length: 9 }, (_, index) => (
                <button key={index} type="button" aria-label={sequence[sequenceIndex] === index ? "Sıradaki sarı hedef" : `Bakış noktası ${index + 1}`} onClick={() => handleSaccadeClick(index)} className={`aspect-square rounded-full border-2 text-2xl transition-colors ${sequence[sequenceIndex] === index ? "border-amber-500 bg-amber-300 text-brand-900 shadow-md" : sequence.slice(0, sequenceIndex).includes(index) ? "border-emerald-400 bg-emerald-100 text-emerald-700" : "border-sage-200 bg-white text-transparent hover:border-amber-300"}`}>
                  {sequence[sequenceIndex] === index ? "●" : sequence.slice(0, sequenceIndex).includes(index) ? "✓" : "●"}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === "playing" && kind === "infinity_tracking" && (
          <div className="space-y-4 rounded-xl bg-ivory-warm p-6 text-center">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">Nasıl yapılır?</p>
              <p className="mt-1">Hareket eden noktayı yalnızca gözlerinizle takip edin. Başınızı sabit tutun ve nokta turunu tamamladığında devam edin.</p>
            </div>
            <svg viewBox="0 0 360 180" className="mx-auto h-52 w-full max-w-lg" role="img" aria-label="Sekiz şekli üzerinde hareket eden nokta">
              <path d="M180 90 C180 20 40 20 40 90 C40 160 180 160 180 90 C180 20 320 20 320 90 C320 160 180 160 180 90" fill="none" stroke="currentColor" strokeWidth="8" className="text-brand-300" />
              <circle r="10" fill="currentColor" className="text-amber-500">
                <animateMotion dur="4s" repeatCount="indefinite" path="M180 90 C180 20 40 20 40 90 C40 160 180 160 180 90 C180 20 320 20 320 90 C320 160 180 160 180 90" />
              </circle>
            </svg>
            <Button type="button" variant="primary" onClick={handleTrackingRoundComplete}>
              Turu tamamladım
            </Button>
          </div>
        )}

        {phase === "playing" && kind === "point_tracking" && (
          <div className="space-y-4 rounded-xl bg-ivory-warm p-6 text-center">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">Nasıl yapılır?</p>
              <p className="mt-1">
                Merkezdeki hareketli noktayı yalnızca gözlerinizle takip edin. Nokta yön değiştirdiğinde
                bakışınızı yumuşak biçimde yeni yöne taşıyın. Başınızı sabit tutun.
              </p>
            </div>
            <svg viewBox="0 0 360 180" className="mx-auto h-52 w-full max-w-lg" role="img" aria-label="Yön değiştirerek hareket eden nokta">
              <path
                d="M40 90 C40 35 120 35 180 90 C240 145 320 145 320 90 C320 35 240 35 180 90 C120 145 40 145 40 90"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeDasharray="8 8"
                className="text-brand-300"
              />
              <circle r="11" fill="currentColor" className="text-amber-500">
                <animateMotion
                  dur="3s"
                  repeatCount="indefinite"
                  path="M40 90 C40 35 120 35 180 90 C240 145 320 145 320 90 C320 35 240 35 180 90 C120 145 40 145 40 90"
                />
              </circle>
            </svg>
            <p className="text-sm text-charcoal-muted">
              Noktanın yön değişimlerine odaklanın. Hazır olduğunuzda turu tamamlayın.
            </p>
            <Button type="button" variant="primary" onClick={handleTrackingRoundComplete}>
              Turu tamamladım
            </Button>
          </div>
        )}

        {phase === "playing" && kind === "flash_words" && flashWordRounds[flashIndex] && (
          <div className="space-y-4 rounded-xl bg-ivory-warm p-6 text-center">
            <p className="text-xs text-charcoal-muted">{flashWordRounds[flashIndex].words.length} kelime</p>
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

        {phase === "playing" && kind === "memory_palace" && memoryPalaceRounds[flashIndex] && (
          <div className="space-y-4 rounded-xl bg-ivory-warm p-6 text-center">
            <p className="text-xs font-semibold text-charcoal-muted">
              Tur {flashIndex + 1}/{memoryPalaceRounds.length} · {memoryPalaceRounds[flashIndex].rows}×{memoryPalaceRounds[flashIndex].columns}
            </p>
            {flashStage === "show" ? (
              <>
                <p className="text-sm font-semibold text-charcoal">Kelimeleri ve tabloda bulundukları yerleri hatırlayın:</p>
                <div
                  className="mx-auto grid max-w-lg gap-2"
                  style={{ gridTemplateColumns: `repeat(${memoryPalaceRounds[flashIndex].columns}, minmax(0, 1fr))` }}
                  aria-label="Hatırlanacak kelime tablosu"
                >
                  {memoryPalaceRounds[flashIndex].words.map((word) => (
                    <div key={word} className="flex min-h-16 items-center justify-center rounded-lg border border-amber-200 bg-white px-2 py-3 text-sm font-bold text-brand-900 sm:text-base">
                      {word}
                    </div>
                  ))}
                </div>
                <span className="inline-block rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-sm font-bold tabular-nums text-amber-900" aria-live="assertive">
                  Kalan süre: {flashCountdown} sn
                </span>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-charcoal">Kelimeleri doğru hücrelere sürükleyin:</p>
                <div
                  className="mx-auto grid max-w-lg gap-2"
                  style={{ gridTemplateColumns: `repeat(${memoryPalaceRounds[flashIndex].columns}, minmax(0, 1fr))` }}
                  aria-label="Kelimelerin bırakılacağı tablo"
                >
                  {memoryPalacePlaced.map((word, index) => (
                    <div
                      key={index}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleMemoryPalaceDrop(index)}
                      className="flex min-h-16 items-center justify-center rounded-lg border-2 border-dashed border-sage-300 bg-white px-2 py-3 text-sm font-bold text-brand-900"
                    >
                      {word || "Buraya bırakın"}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap justify-center gap-2" aria-label="Sürüklenecek kelimeler">
                  {memoryPalaceRounds[flashIndex].words
                    .filter((word) => !memoryPalacePlaced.includes(word))
                    .sort()
                    .map((word) => (
                    <button
                      key={word}
                      type="button"
                      draggable
                      onDragStart={() => setMemoryPalaceDragged(word)}
                      onDragEnd={() => setMemoryPalaceDragged(null)}
                      className="cursor-grab rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm font-semibold text-brand-900 shadow-sm active:cursor-grabbing"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {phase === "playing" && kind === "word_memory" && wordMemoryRounds[flashIndex] && (
          <div className="space-y-4 rounded-xl bg-ivory-warm p-6 text-center">
            <p className="text-xs text-charcoal-muted">{wordMemoryRounds[flashIndex].words.length} kelime</p>
            {flashStage === "show" ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-charcoal">Kelimeleri sırayla aklınızda tutun:</p>
                  <span className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-sm font-bold tabular-nums text-amber-900" aria-live="polite">
                    {flashCountdown} sn
                  </span>
                </div>
                <div aria-live="polite" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {wordMemoryRounds[flashIndex].words.map((word) => (
                    <div key={word} className="rounded-lg border border-amber-200 bg-white px-3 py-3 text-lg font-bold text-brand-900">{word}</div>
                  ))}
                </div>
                <Button type="button" variant="primary" onClick={() => setFlashStage("choose")}>
                  Devam et
                </Button>
              </>
            ) : (
              <form className="space-y-3 text-left" onSubmit={handleWordMemorySubmit}>
                <p className="text-sm font-semibold text-charcoal">
                  Hatırladığınız kelimeleri gösterilen sırayla yazın:
                </p>
                <div className="space-y-2">
                  {wordMemoryRounds[flashIndex].words.map((_, index) => (
                    <input
                      key={index}
                      id={`word-memory-answer-${index}`}
                      type="text"
                      value={wordMemoryInputs[index] || ""}
                      onChange={(event) => {
                        const nextInputs = [...wordMemoryInputs];
                        nextInputs[index] = event.target.value;
                        setWordMemoryInputs(nextInputs);
                      }}
                      placeholder={`${index + 1}. kelime`}
                      autoComplete="off"
                      autoFocus={index === 0}
                      aria-label={`${index + 1}. kelime`}
                      className="w-full rounded-lg border border-sage-300 bg-white px-3 py-3 text-charcoal outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    />
                  ))}
                </div>
                <Button type="submit" variant="primary" disabled={wordMemoryInputs.some((word) => !word.trim())}>
                  Cevabı gönder
                </Button>
              </form>
            )}
          </div>
        )}

        {phase === "playing" && kind === "matching_cards" && matchingCards.length > 0 && (
          <div className="space-y-4 rounded-xl bg-ivory-warm p-6 text-center">
            <div className="flex items-center justify-between text-sm text-charcoal-muted">
              <span>Aynı çiftleri bulun: {matchingPairs}/{matchingCards.length / 2}</span>
              <span>Hamle: {matchingMoves}</span>
            </div>
            <p className="text-sm font-semibold text-charcoal">
              Kartları ikişer açın. Aynı sembol veya kelimeyi bulduğunuzda çift eşleşir.
            </p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {matchingCards.map((card, index) => (
                <button
                  key={card.id}
                  type="button"
                  aria-label={card.flipped || card.matched ? `Kart ${card.value}` : `Kapalı kart ${index + 1}`}
                  onClick={() => handleMatchingCardClick(index)}
                  className={`aspect-square rounded-xl border-2 p-2 text-sm font-bold transition-all ${
                    card.matched
                      ? "border-emerald-400 bg-emerald-100 text-emerald-800"
                      : card.flipped
                        ? "border-amber-400 bg-amber-100 text-brand-900"
                        : "border-sage-200 bg-white text-transparent hover:border-amber-300"
                  }`}
                >
                  {card.flipped || card.matched ? card.value : "?"}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === "playing" && kind === "sequence_memory" && sequenceMemoryRound && (
          <div className="space-y-4 rounded-xl bg-ivory-warm p-6 text-center">
            {sequenceMemoryStage === "show" ? (
              <>
                <p className="text-sm font-semibold text-charcoal">Yanan kutuları bu sırayla aklınızda tutun.</p>
                <div className="grid max-w-sm grid-cols-3 gap-3 mx-auto rounded-xl bg-white p-4">
                  {sequenceMemoryRound.choices.map((cell) => (
                    <div
                      key={cell}
                      className={`aspect-square rounded-lg border-2 ${
                        sequenceMemoryRound.sequence.slice(0, sequenceMemoryVisibleCount).includes(cell)
                          ? "border-amber-400 bg-amber-300"
                          : "border-sage-200 bg-sage-50"
                      }`}
                    />
                  ))}
                </div>
                <span className="inline-block rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-sm font-bold tabular-nums text-amber-900">
                  {flashCountdown} sn
                </span>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-charcoal">
                  Kutuları yanan sırayla seçin. Seçim: {sequenceMemoryInput.length}/{sequenceMemoryRound.sequence.length}
                </p>
                <div className="grid max-w-sm grid-cols-3 gap-3 mx-auto rounded-xl bg-white p-4">
                  {sequenceMemoryRound.choices.map((cell) => (
                    <button
                      key={cell}
                      type="button"
                      onClick={() => handleSequenceMemoryClick(cell)}
                      disabled={sequenceMemoryInput.includes(cell)}
                      className={`aspect-square rounded-lg border-2 transition-colors ${
                        sequenceMemoryInput.includes(cell)
                          ? "border-emerald-400 bg-emerald-100"
                          : "border-sage-200 bg-sage-50 hover:border-amber-400 hover:bg-amber-100"
                      }`}
                      aria-label={`Sıra kutusu ${cell + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {phase === "playing" && !["matching_cards", "flash_words", "word_memory", "chunk_reading", "passage_memory"].includes(kind) && FLASH_LIKE_KINDS.includes(kind) && flashRounds[flashIndex] && (
          <div className="space-y-4 rounded-xl bg-ivory-warm p-6 text-center">
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
