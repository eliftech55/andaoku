"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, Clock, Eye, Play, RotateCcw, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type MemoryGameType = "sequence" | "pairs";

interface MemoryGameProps {
  type: MemoryGameType;
  onComplete?: (score: { accuracy: number; totalFound: number; timeSeconds: number }) => void;
}

const SEQUENCE_LEVELS = [
  { level: 1, label: "Başlangıç", length: 3, seconds: 60 },
  { level: 2, label: "Kolay", length: 4, seconds: 55 },
  { level: 3, label: "Orta", length: 5, seconds: 50 },
  { level: 4, label: "Zor", length: 6, seconds: 45 },
  { level: 5, label: "Uzman", length: 7, seconds: 40 },
] as const;

const PAIRS_LEVELS = [
  { level: 1, label: "Başlangıç", pairs: 3, seconds: 60, columns: 3 },
  { level: 2, label: "Kolay", pairs: 4, seconds: 70, columns: 4 },
  { level: 3, label: "Orta", pairs: 6, seconds: 80, columns: 4 },
  { level: 4, label: "Zor", pairs: 8, seconds: 90, columns: 4 },
  { level: 5, label: "Uzman", pairs: 10, seconds: 100, columns: 5 },
] as const;

const TILES = ["🍎", "🚀", "🌙", "🐬", "🌻", "🎈", "🍀", "⭐", "🦋", "🎵"];
const SEQUENCE_TILES = ["●", "◆", "▲", "■", "★", "✿", "✦", "⬟", "♥"];

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function MemoryGame({ type, onComplete }: MemoryGameProps) {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const levels = type === "sequence" ? SEQUENCE_LEVELS : PAIRS_LEVELS;
  const level = levels[selectedLevel - 1];
  const isSequence = type === "sequence";
  const [phase, setPhase] = useState<"idle" | "showing" | "playing" | "finished">("idle");
  const [timeLeft, setTimeLeft] = useState<number>(level.seconds);
  const [sequence, setSequence] = useState<number[]>([]);
  const [showIndex, setShowIndex] = useState(-1);
  const [inputIndex, setInputIndex] = useState(0);
  const [cards, setCards] = useState<{ id: number; symbol: string }[]>([]);
  const [revealedIds, setRevealedIds] = useState<number[]>([]);
  const [matchedIds, setMatchedIds] = useState<number[]>([]);
  const [found, setFound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [locked, setLocked] = useState(false);
  const completionReported = useRef(false);
const timeoutRef = useRef<NodeJS.Timeout | number | null>(null);
  const title = isSequence ? "Sembol Sırasını Hatırla" : "Hafıza Kartı Eşleştirme";
  const instruction = isSequence
    ? "Sembollerin aydınlanma sırasını aklınızda tutun, sonra aynı sırayla seçin."
    : "Kartları sırayla açın ve aynı sembolleri bulup eşleştirin.";
  const goal = isSequence ? SEQUENCE_LEVELS[selectedLevel - 1].length : PAIRS_LEVELS[selectedLevel - 1].pairs;
  const accuracy =
    found + mistakes > 0 ? Math.round((found / (found + mistakes)) * 100) : 0;
  const boardColumns = isSequence ? 3 : PAIRS_LEVELS[selectedLevel - 1].columns;

  useEffect(() => {
    if (phase !== "showing") return;
    const timer = window.setTimeout(() => {
      if (showIndex + 1 >= sequence.length) {
        setShowIndex(-1);
        setPhase("playing");
      } else {
        setShowIndex((index) => index + 1);
      }
    }, showIndex < 0 ? 500 : 650);
    return () => window.clearTimeout(timer);
  }, [phase, sequence.length, showIndex]);

  useEffect(() => {
    if (phase !== "showing" && phase !== "playing") return;
    if (timeLeft <= 0) {
      setPhase("finished");
      return;
    }
    const timer = window.setTimeout(() => setTimeLeft((remaining) => remaining - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase === "playing" && !isSequence && matchedIds.length === goal * 2) {
      setPhase("finished");
    }
  }, [goal, isSequence, matchedIds.length, phase]);

  useEffect(() => {
    if (phase !== "finished" || completionReported.current) return;
    completionReported.current = true;
    onComplete?.({
      accuracy,
      totalFound: found,
      timeSeconds: level.seconds - timeLeft,
    });
  }, [accuracy, found, level.seconds, onComplete, phase, timeLeft]);

  useEffect(
    () => () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    },
    []
  );

  const startGame = () => {
    setFound(0);
    setMistakes(0);
    setTimeLeft(level.seconds);
    setInputIndex(0);
    setShowIndex(-1);
    setRevealedIds([]);
    setMatchedIds([]);
    setLocked(false);
    completionReported.current = false;
    if (isSequence) {
      setSequence(
        Array.from({ length: goal }, () => Math.floor(Math.random() * SEQUENCE_TILES.length))
      );
      setPhase("showing");
      return;
    }

    const symbols = shuffle(TILES).slice(0, goal);
    setCards(
      shuffle([...symbols, ...symbols]).map((symbol, id) => ({ id, symbol }))
    );
    setPhase("playing");
  };

  const resetGame = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setPhase("idle");
    setFound(0);
    setMistakes(0);
    setRevealedIds([]);
    setMatchedIds([]);
    setTimeLeft(level.seconds);
    setLocked(false);
  };

  const handleSequenceChoice = (tileIndex: number) => {
    if (phase !== "playing") return;
    if (sequence[inputIndex] !== tileIndex) {
      setMistakes((count) => count + 1);
      setInputIndex(0);
      return;
    }

    const nextInputIndex = inputIndex + 1;
    setInputIndex(nextInputIndex);
    setFound(nextInputIndex);
    if (nextInputIndex === sequence.length) setPhase("finished");
  };

  const handleCardChoice = (cardId: number) => {
    if (phase !== "playing" || locked || matchedIds.includes(cardId) || revealedIds.includes(cardId)) {
      return;
    }

    if (revealedIds.length === 0) {
      setRevealedIds([cardId]);
      return;
    }

    const firstCard = cards.find((card) => card.id === revealedIds[0]);
    const nextCard = cards.find((card) => card.id === cardId);
    if (!firstCard || !nextCard) return;
    setRevealedIds([revealedIds[0], cardId]);
    setLocked(true);

    if (firstCard.symbol === nextCard.symbol) {
      setMatchedIds((current) => [...current, revealedIds[0], cardId]);
      setFound((count) => count + 1);
      setRevealedIds([]);
      setLocked(false);
      return;
    }

    setMistakes((count) => count + 1);
    timeoutRef.current = window.setTimeout(() => {
      setRevealedIds([]);
      setLocked(false);
      timeoutRef.current = null;
    }, 800);
  };

  return (
    <Card className="mx-auto max-w-2xl border-sage-200">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="amber" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Hafıza Egzersizi
          </Badge>
          {(phase === "playing" || phase === "showing") && (
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              <span>{timeLeft} sn</span>
            </div>
          )}
        </div>
        <CardTitle className="font-serif text-xl text-charcoal">{title}</CardTitle>
        <p className="text-xs text-charcoal-muted">{instruction}</p>
        <div className="flex flex-wrap gap-2 pt-1" aria-label={`${title} seviyesi`}>
          {levels.map((item) => (
            <button
              key={item.level}
              type="button"
              disabled={phase === "playing" || phase === "showing"}
              aria-pressed={selectedLevel === item.level}
              onClick={() => {
                setSelectedLevel(item.level);
                setTimeLeft(item.seconds);
                setPhase("idle");
                setFound(0);
                setMistakes(0);
                setMatchedIds([]);
                setRevealedIds([]);
              }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                selectedLevel === item.level
                  ? "border-brand-800 bg-brand-700 text-white"
                  : "border-sage-200 bg-white text-charcoal hover:bg-ivory-beige"
              }`}
            >
              {item.level}. Seviye · {item.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-charcoal-muted">
          Seviye {level.level}: {goal} {isSequence ? "sembol" : "çift"}, {level.seconds} saniye
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {phase === "idle" && (
          <div className="space-y-4 rounded-2xl border border-sage-200 bg-ivory-warm p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl text-amber-600">
              {isSequence ? "◆" : "🧠"}
            </div>
            <p className="text-sm text-charcoal-muted">{instruction}</p>
            <Button size="lg" variant="amber" onClick={startGame} className="px-8 shadow-md">
              <Play className="mr-2 h-4 w-4" />
              Oyunu Başlat
            </Button>
          </div>
        )}

        {(phase === "showing" || phase === "playing") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1 text-xs text-charcoal-muted">
              <span>
                {isSequence ? "Sıra" : "Bulunan çift"}: <strong>{found}</strong> / {goal}
              </span>
              <span>Hata: <strong>{mistakes}</strong></span>
            </div>
            <Progress value={(found / goal) * 100} color="amber" />
            {isSequence ? (
              <div className="space-y-3">
                <p className="text-center text-sm font-semibold text-brand-800" aria-live="polite">
                  {phase === "showing" ? "Sırayı izleyin..." : "Şimdi aynı sırayla seçin."}
                </p>
                <div className="mx-auto grid max-w-sm grid-cols-3 gap-3">
                  {SEQUENCE_TILES.map((tile, index) => (
                    <button
                      key={tile}
                      type="button"
                      disabled={phase !== "playing"}
                      onClick={() => handleSequenceChoice(index)}
                      aria-label={`Sembol ${tile}`}
                      className={`flex aspect-square items-center justify-center rounded-2xl border text-3xl font-bold transition-colors disabled:cursor-default ${
                        phase === "showing" && sequence[showIndex] === index
                          ? "scale-105 border-amber-500 bg-amber-400 text-white shadow-lg"
                          : "border-sage-200 bg-white text-charcoal hover:bg-amber-50 disabled:opacity-70"
                      }`}
                    >
                      {tile}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="mx-auto grid max-w-xl gap-3"
                style={{ gridTemplateColumns: `repeat(${boardColumns}, minmax(0, 1fr))` }}
              >
                {cards.map((card) => {
                  const isVisible = revealedIds.includes(card.id) || matchedIds.includes(card.id);
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleCardChoice(card.id)}
                      aria-label={isVisible ? `Açık kart ${card.symbol}` : "Kapalı hafıza kartı"}
                      aria-pressed={isVisible}
                      className={`flex aspect-square min-h-12 items-center justify-center rounded-xl border text-2xl transition-colors sm:text-3xl ${
                        matchedIds.includes(card.id)
                          ? "border-emerald-300 bg-emerald-100"
                          : isVisible
                            ? "border-amber-300 bg-amber-100"
                            : "border-sage-200 bg-white text-brand-700 hover:bg-ivory-warm"
                      }`}
                    >
                      {isVisible ? card.symbol : "?"}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {phase === "finished" && (
          <div className="space-y-4 rounded-2xl border border-sage-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              {found === goal ? <Trophy className="h-8 w-8" /> : <CheckCircle className="h-8 w-8" />}
            </div>
            <h4 className="font-serif text-xl font-bold text-charcoal">
              {found === goal ? "Seviye tamamlandı!" : "Süre doldu"}
            </h4>
            <p className="text-sm text-charcoal-muted">
              İsabet oranı %{accuracy} · {found}/{goal} tamamlandı
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button variant="outline" size="md" onClick={resetGame}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Yeniden Oyna
              </Button>
              {selectedLevel < levels.length ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    const nextLevel = levels[selectedLevel];
                    setSelectedLevel(nextLevel.level);
                    setTimeLeft(nextLevel.seconds);
                    setFound(0);
                    setMistakes(0);
                    setMatchedIds([]);
                    setRevealedIds([]);
                    setPhase("idle");
                  }}
                >
                  Diğer Seviye ile Devam Et
                </Button>
              ) : (
                <p className="self-center text-sm font-semibold text-emerald-700">
                  Tüm seviyeleri tamamladınız!
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
