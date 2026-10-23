"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, Clock, Play, RotateCcw, Target, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type EyeMovementExerciseType = "tracking" | "saccade";

interface EyeMovementExerciseProps {
  type: EyeMovementExerciseType;
  onComplete?: (score: { accuracy: number; totalFound: number; timeSeconds: number }) => void;
}

const TRACKING_LEVELS = [
  { level: 1, label: "Başlangıç", targets: 5, seconds: 60, movementMs: 1400 },
  { level: 2, label: "Kolay", targets: 7, seconds: 55, movementMs: 1100 },
  { level: 3, label: "Orta", targets: 9, seconds: 50, movementMs: 800 },
  { level: 4, label: "Zor", targets: 11, seconds: 45, movementMs: 550 },
  { level: 5, label: "Uzman", targets: 13, seconds: 40, movementMs: 350 },
] as const;

const SACCADE_LEVELS = [
  { level: 1, label: "Başlangıç", targets: 6, seconds: 60 },
  { level: 2, label: "Kolay", targets: 8, seconds: 55 },
  { level: 3, label: "Orta", targets: 10, seconds: 50 },
  { level: 4, label: "Zor", targets: 12, seconds: 45 },
  { level: 5, label: "Uzman", targets: 14, seconds: 40 },
] as const;

const POSITIONS = [
  "left-0 top-0",
  "left-1/2 top-0 -translate-x-1/2",
  "right-0 top-0",
  "left-0 top-1/2 -translate-y-1/2",
  "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
  "right-0 top-1/2 -translate-y-1/2",
  "left-0 bottom-0",
  "left-1/2 bottom-0 -translate-x-1/2",
  "right-0 bottom-0",
] as const;

const randomSide = (): "left" | "right" => (Math.random() < 0.5 ? "left" : "right");

export function EyeMovementExercise({ type, onComplete }: EyeMovementExerciseProps) {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const levels = type === "tracking" ? TRACKING_LEVELS : SACCADE_LEVELS;
  const levelConfig = levels[selectedLevel - 1];
  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">("idle");
  const [timeLeft, setTimeLeft] = useState<number>(levelConfig.seconds);
  const [targetIndex, setTargetIndex] = useState(0);
  const [targetSequence, setTargetSequence] = useState<number[]>([]);
  const [targetSide, setTargetSide] = useState<"left" | "right">("left");
  const [found, setFound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const completionReported = useRef(false);
  const title = type === "tracking" ? "Hareketli Hedefi İzle" : "Sakkadik Sağ-Sol Bakış";
  const instructions =
    type === "tracking"
      ? "Hedefin ekrandaki konumunu gözlerinizle takip edin ve her durduğunda bulunduğu noktaya dokunun."
      : "Yıldız hangi tarafta görünüyorsa hedefe dokunun. Bakışınızı iki taraf arasında hızlıca değiştirin.";
  const accuracy =
    found + mistakes > 0 ? Math.round((found / (found + mistakes)) * 100) : 0;

  useEffect(() => {
    if (gameState !== "playing" || timeLeft <= 0) return;
    const timer = window.setTimeout(() => setTimeLeft((remaining) => remaining - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (type !== "tracking" || gameState !== "playing" || targetSequence.length < 2) return;
    const movementTimer = window.setInterval(
      () => setTargetIndex((index) => (index + 1) % targetSequence.length),
      TRACKING_LEVELS[selectedLevel - 1].movementMs
    );
    return () => window.clearInterval(movementTimer);
  }, [gameState, selectedLevel, targetSequence.length, type]);

  useEffect(() => {
    if (gameState === "playing" && (timeLeft === 0 || found >= levelConfig.targets)) {
      setGameState("finished");
    }
  }, [found, gameState, levelConfig.targets, timeLeft]);

  useEffect(() => {
    if (gameState !== "finished" || completionReported.current) return;
    completionReported.current = true;
    onComplete?.({
      accuracy,
      totalFound: found,
      timeSeconds: levelConfig.seconds - timeLeft,
    });
  }, [accuracy, found, gameState, levelConfig.seconds, onComplete, timeLeft]);

  const startGame = () => {
    setFound(0);
    setMistakes(0);
    setTimeLeft(levelConfig.seconds);
    setTargetIndex(0);
    const sequence: number[] = [];
    while (sequence.length < levelConfig.targets) {
      const nextPosition = Math.floor(Math.random() * POSITIONS.length);
      if (sequence[sequence.length - 1] !== nextPosition) sequence.push(nextPosition);
    }
    setTargetSequence(sequence);
    setTargetSide(randomSide());
    completionReported.current = false;
    setGameState("playing");
  };

  const handleTargetClick = (side?: "left" | "right") => {
    if (gameState !== "playing") return;
    if (type === "saccade" && side !== targetSide) {
      setMistakes((count) => count + 1);
      setTargetSide(randomSide());
      return;
    }

    const nextFound = found + 1;
    setFound(nextFound);
    if (nextFound < levelConfig.targets) {
      if (type === "tracking") {
        setTargetIndex((index) => (index + 1) % targetSequence.length);
      } else {
        setTargetSide(randomSide());
      }
    }
  };

  const resetGame = () => {
    setGameState("idle");
    setTimeLeft(levelConfig.seconds);
    setFound(0);
    setMistakes(0);
  };

  return (
    <Card className="mx-auto max-w-2xl border-sage-200">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="amber" className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            Göz Egzersizi
          </Badge>
          {gameState === "playing" && (
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              <span>{timeLeft} sn</span>
            </div>
          )}
        </div>
        <CardTitle className="font-serif text-xl text-charcoal">{title}</CardTitle>
        <p className="text-xs text-charcoal-muted">{instructions}</p>
        <div className="flex flex-wrap gap-2 pt-1" aria-label={`${title} seviyesi`}>
          {levels.map((level) => (
            <button
              key={level.level}
              type="button"
              disabled={gameState === "playing"}
              aria-pressed={selectedLevel === level.level}
              onClick={() => {
                setSelectedLevel(level.level);
                setTimeLeft(level.seconds);
                setGameState("idle");
                setFound(0);
                setMistakes(0);
              }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                selectedLevel === level.level
                  ? "border-brand-800 bg-brand-700 text-white"
                  : "border-sage-200 bg-white text-charcoal hover:bg-ivory-beige"
              }`}
            >
              {level.level}. Seviye · {level.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-charcoal-muted">
          Seviye {levelConfig.level}: {levelConfig.targets} hedef, {levelConfig.seconds} saniye
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {gameState === "idle" && (
          <div className="space-y-4 rounded-2xl border border-sage-200 bg-ivory-warm p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl text-amber-600">
              {type === "tracking" ? "●" : "★"}
            </div>
            <p className="text-sm text-charcoal-muted">{instructions}</p>
            <Button size="lg" variant="amber" onClick={startGame} className="px-8 shadow-md">
              <Play className="mr-2 h-4 w-4" />
              Egzersizi Başlat
            </Button>
          </div>
        )}

        {gameState === "playing" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1 text-xs text-charcoal-muted">
              <span>
                Doğru: <strong>{found}</strong> / {levelConfig.targets}
              </span>
              <span>Hatalı: <strong>{mistakes}</strong></span>
            </div>
            <Progress value={(found / levelConfig.targets) * 100} color="amber" />
            {type === "tracking" ? (
              <div
                className="relative mx-auto h-64 max-w-xl touch-manipulation rounded-2xl border border-sage-200 bg-ivory-warm p-5"
                onPointerDown={(event) => {
                  if (
                    !(event.target instanceof Element) ||
                    !event.target.closest("[data-tracking-target]")
                  ) {
                    setMistakes((count) => count + 1);
                  }
                }}
                aria-label="Hedefi gözünüzle izleyin; hedef dışındaki her tıklama hata sayılır."
              >
                <button
                  type="button"
                  data-tracking-target
                  aria-label="Hareketli hedef"
                  onClick={() => handleTargetClick()}
                  className={`absolute flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-2xl text-white shadow-lg transition-all ease-linear ${POSITIONS[targetSequence[targetIndex] ?? 0]}`}
                  style={{
                    transitionDuration: `${TRACKING_LEVELS[selectedLevel - 1].movementMs}ms`,
                  }}
                >
                  ●
                </button>
              </div>
            ) : (
              <div className="flex min-h-56 items-center justify-between gap-4 rounded-2xl border border-sage-200 bg-ivory-warm p-5">
                {(["left", "right"] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => handleTargetClick(side)}
                    aria-label={side === "left" ? "Sol hedef" : "Sağ hedef"}
                    className={`flex h-32 w-32 items-center justify-center rounded-2xl border-2 text-5xl shadow-sm transition-colors sm:h-40 sm:w-40 ${
                      side === targetSide
                        ? "border-amber-400 bg-amber-100 text-amber-700"
                        : "border-sage-200 bg-white text-sage-300"
                    }`}
                  >
                    {side === targetSide ? "★" : "○"}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {gameState === "finished" && (
          <div className="space-y-4 rounded-2xl border border-sage-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              {found === levelConfig.targets ? (
                <Trophy className="h-8 w-8" />
              ) : (
                <CheckCircle className="h-8 w-8" />
              )}
            </div>
            <h4 className="font-serif text-xl font-bold text-charcoal">
              {found === levelConfig.targets ? "Seviye tamamlandı!" : "Süre doldu"}
            </h4>
            <p className="text-sm text-charcoal-muted">
              İsabet oranı %{accuracy} · {found}/{levelConfig.targets} doğru hedef
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
                    setGameState("idle");
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
