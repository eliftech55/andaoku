"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, RotateCcw, Target, Trophy, Clock, CheckCircle, AlertTriangle } from "lucide-react";

interface VisualAttentionGameProps {
  onComplete?: (score: { accuracy: number; totalFound: number; timeSeconds: number }) => void;
  targetSymbol?: string;
  title?: string;
  instructions?: string;
}

const LEVELS = [
  { level: 1, label: "Başlangıç", gridSize: 4, targetCount: 4, seconds: 60, distractorCount: 3 },
  { level: 2, label: "Kolay", gridSize: 5, targetCount: 6, seconds: 50, distractorCount: 4 },
  { level: 3, label: "Orta", gridSize: 6, targetCount: 9, seconds: 40, distractorCount: 5 },
  { level: 4, label: "Zor", gridSize: 7, targetCount: 12, seconds: 35, distractorCount: 6 },
  { level: 5, label: "Uzman", gridSize: 8, targetCount: 16, seconds: 30, distractorCount: 7 },
] as const;

export function VisualAttentionGame({
  onComplete,
  targetSymbol = "★",
  title = "Görsel Dikkat Matrisi",
  instructions,
}: VisualAttentionGameProps) {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const levelConfig = LEVELS[selectedLevel - 1];
  const symbols = ["▲", "●", "◆", "■", "✿", "✦", "✪"].slice(
    0,
    levelConfig.distractorCount
  );
  const { gridSize, targetCount, seconds: gameDuration } = levelConfig;

  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">("idle");
  const [grid, setGrid] = useState<string[]>([]);
  const [clickedIndices, setClickedIndices] = useState<Set<number>>(new Set());
  const [wrongIndices, setWrongIndices] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number>(gameDuration);
  const [totalTargets, setTotalTargets] = useState(0);
  const completionReported = useRef(false);
  const accuracy = totalTargets > 0 ? Math.round((clickedIndices.size / totalTargets) * 100) : 0;

  // Yeni matris üret
  const generateGrid = () => {
    const totalCells = gridSize * gridSize;
    const targetIndices = new Set<number>();
    while (targetIndices.size < targetCount) {
      targetIndices.add(Math.floor(Math.random() * totalCells));
    }
    const distractors = symbols.filter((symbol) => symbol !== targetSymbol);
    const newGrid = Array.from({ length: totalCells }, (_, index) =>
      targetIndices.has(index)
        ? targetSymbol
        : distractors[Math.floor(Math.random() * distractors.length)]
    );
    setGrid(newGrid);
    setTotalTargets(targetIndices.size);
    setClickedIndices(new Set());
    setWrongIndices(new Set());
    setTimeLeft(gameDuration);
  };

  const handleStart = () => {
    generateGrid();
    completionReported.current = false;
    setGameState("playing");
  };

  const handleReset = () => {
    setGameState("idle");
    setClickedIndices(new Set());
    setWrongIndices(new Set());
    setTimeLeft(gameDuration);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === "playing" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState("finished");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (gameState === "finished" && !completionReported.current) {
      completionReported.current = true;
      onComplete?.({
        accuracy,
        totalFound: clickedIndices.size,
        timeSeconds: gameDuration - timeLeft,
      });
    }
  }, [accuracy, clickedIndices.size, gameDuration, gameState, onComplete, timeLeft]);

  const handleCellClick = (index: number) => {
    if (gameState !== "playing") return;
    if (clickedIndices.has(index)) return;

    if (grid[index] === targetSymbol) {
      const nextClicked = new Set(clickedIndices).add(index);
      setClickedIndices(nextClicked);
      if (nextClicked.size === totalTargets) {
        // Tüm hedefler bulundu
        setGameState("finished");
      }
    } else {
      setWrongIndices((prev) => new Set(prev).add(index));
    }
  };

  return (
    <Card className="max-w-xl mx-auto border-sage-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="amber" className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            Görsel Dikkat
          </Badge>
          {gameState === "playing" && (
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              <span>{timeLeft} sn</span>
            </div>
          )}
        </div>
        <CardTitle className="text-xl font-serif text-charcoal mt-1">{title}</CardTitle>
        <p className="text-xs text-charcoal-muted">
          {instructions || <>Gözün tarama hızını ve çevresel görsel dikkatini geliştirin. Tabloda gördüğünüz tüm <strong>{targetSymbol}</strong> sembollerine olabildiğince hızlı tıklayın.</>}
        </p>
        <div className="flex flex-wrap gap-2 pt-2" aria-label="Alıştırma seviyesi">
          {LEVELS.map((level) => (
            <button
              key={level.level}
              type="button"
              disabled={gameState === "playing"}
              aria-pressed={selectedLevel === level.level}
              onClick={() => {
                setSelectedLevel(level.level);
                setGameState("idle");
                setClickedIndices(new Set());
                setWrongIndices(new Set());
                setTimeLeft(level.seconds);
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
          Seviye {levelConfig.level}: {gridSize}×{gridSize} matris, {targetCount} hedef, {gameDuration} saniye
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {gameState === "idle" && (
          <div className="p-8 text-center space-y-4 rounded-2xl bg-ivory-warm border border-sage-200">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-amber-100 text-amber-600 text-3xl">
              {targetSymbol}
            </div>
            <div>
              <h4 className="font-bold text-charcoal text-base">Hedef: {targetSymbol} Yıldız Sembolü</h4>
              <p className="text-xs text-charcoal-muted mt-1 max-w-sm mx-auto">
                {gameDuration} saniyeniz var. Gözünüzü matris üzerinde soldan sağa ve yukarıdan aşağıya akıcı biçimde kaydırın.
              </p>
            </div>
            <Button size="lg" variant="amber" onClick={handleStart} className="px-8 shadow-md">
              <Play className="mr-2 h-4 w-4" /> Alıştırmayı Başlat
            </Button>
          </div>
        )}

        {gameState === "playing" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-charcoal-muted px-1">
              <span>
                Bulunan: <strong>{clickedIndices.size}</strong> / {totalTargets}
              </span>
              <span>Kalan Süre: <strong>{timeLeft}</strong> sn</span>
            </div>
            <Progress value={((gameDuration - timeLeft) / gameDuration) * 100} color="amber" />

            {/* Matris Izgarası */}
            <div className="grid gap-1.5 rounded-2xl border border-sage-200 bg-ivory-warm p-2 sm:gap-2 sm:p-3" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
              {grid.map((symbol, idx) => {
                const isCorrect = clickedIndices.has(idx);
                const isWrong = wrongIndices.has(idx);

                return (
                  <button
                    key={idx}
                    onClick={() => handleCellClick(idx)}
                    className={`h-10 w-full flex items-center justify-center text-lg font-bold rounded-xl transition-all duration-150 select-none sm:h-12 sm:text-xl ${
                      isCorrect
                        ? "bg-emerald-600 text-white shadow-md scale-95"
                        : isWrong
                        ? "bg-rose-100 text-rose-600 border border-rose-300"
                        : "bg-white hover:bg-amber-50 text-charcoal border border-sage-200 shadow-sm active:scale-95"
                    }`}
                  >
                    {symbol}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {gameState === "finished" && (
          <div className="p-6 text-center space-y-4 rounded-2xl bg-white border border-sage-200 shadow-sm animate-fade-in">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Trophy className="h-8 w-8" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-charcoal font-serif">Alıştırma Tamamlandı!</h4>
              <p className="text-xs text-charcoal-muted mt-1">Görsel tarama ve dikkat performansınız:</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-ivory-warm border border-sage-200">
                <span className="text-[10px] text-charcoal-muted block">İsabet Oranı</span>
                <span className="text-2xl font-bold text-brand-900 font-mono">%{accuracy}</span>
              </div>
              <div className="p-3 rounded-xl bg-ivory-warm border border-sage-200">
                <span className="text-[10px] text-charcoal-muted block">Bulunan Hedef</span>
                <span className="text-2xl font-bold text-emerald-700 font-mono">
                  {clickedIndices.size} / {totalTargets}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-ivory-warm border border-sage-200">
                <span className="text-[10px] text-charcoal-muted block">Hatalı Tıklama</span>
                <span className="text-2xl font-bold text-rose-600 font-mono">{wrongIndices.size}</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Button variant="outline" size="md" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" /> Yeniden Oyna
              </Button>
              {selectedLevel < LEVELS.length ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    const nextLevel = LEVELS[selectedLevel];
                    setSelectedLevel(nextLevel.level);
                    setGameState("idle");
                    setClickedIndices(new Set());
                    setWrongIndices(new Set());
                    setTimeLeft(nextLevel.seconds);
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
