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
  gridSize?: number;
  timeLimitSeconds?: number;
  title?: string;
  instructions?: string;
}

export function VisualAttentionGame({
  onComplete,
  targetSymbol = "★",
  gridSize: requestedGridSize = 6,
  timeLimitSeconds = 25,
  title = "Hedef Sembolü Bulma Matrisi",
  instructions,
}: VisualAttentionGameProps) {
  const symbols = ["★", "▲", "●", "◆", "■", "✿", "✦", "✪"];
  const gridSize = Math.min(8, Math.max(3, Math.floor(requestedGridSize)));
  const gameDuration = Math.min(120, Math.max(10, Math.floor(timeLimitSeconds)));

  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">("idle");
  const [grid, setGrid] = useState<string[]>([]);
  const [clickedIndices, setClickedIndices] = useState<Set<number>>(new Set());
  const [wrongIndices, setWrongIndices] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(gameDuration);
  const [totalTargets, setTotalTargets] = useState(0);
  const completionReported = useRef(false);
  const accuracy = totalTargets > 0 ? Math.round((clickedIndices.size / totalTargets) * 100) : 0;

  // Yeni matris üret
  const generateGrid = () => {
    const newGrid: string[] = [];
    let targetCount = 0;
    for (let i = 0; i < gridSize * gridSize; i++) {
      // %25 ihtimalle hedef sembol
      if (Math.random() < 0.28) {
        newGrid.push(targetSymbol);
        targetCount++;
      } else {
        const distractors = symbols.filter((s) => s !== targetSymbol);
        const randomDistractor = distractors[Math.floor(Math.random() * distractors.length)];
        newGrid.push(randomDistractor);
      }
    }
    // En az 4 hedef olduğundan emin ol
    if (targetCount < Math.min(4, gridSize * gridSize)) {
      const minimumTargets = Math.min(4, gridSize * gridSize);
      for (let index = 0; index < minimumTargets; index++) {
        newGrid[index] = targetSymbol;
      }
      targetCount = minimumTargets;
    }
    setGrid(newGrid);
    setTotalTargets(targetCount);
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
            Modül 2: Görsel Tarama & Odaklanma
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
            <div className="grid gap-2 rounded-2xl border border-sage-200 bg-ivory-warm p-3" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
              {grid.map((symbol, idx) => {
                const isCorrect = clickedIndices.has(idx);
                const isWrong = wrongIndices.has(idx);

                return (
                  <button
                    key={idx}
                    onClick={() => handleCellClick(idx)}
                    className={`h-12 w-full flex items-center justify-center text-xl font-bold rounded-xl transition-all duration-150 select-none ${
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
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  if (onComplete) {
                    onComplete({
                      accuracy,
                      totalFound: clickedIndices.size,
                      timeSeconds: gameDuration - timeLeft,
                    });
                  }
                  if (typeof window !== "undefined") {
                    window.location.href = "/panel/ogrenme-yolu";
                  }
                }}
              >
                Öğrenme Yoluna Devam Et
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
