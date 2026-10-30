"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ---- Sample passages (replace with your real source) ----
const SAMPLE_PASSAGES: string[] = [
  // 200‑500 chars each
  "Bir zamanlar, dağların eteğinde yaşayan bir köylü varmış. Her sabah köyün çocuğu ... (devamı)",
  "Güneş yavaşça ufukta yükselirken, denizin dalgaları kıyıya vurur. ... (devamı)",
];

function randomPassage(): string {
  const eligible = SAMPLE_PASSAGES.filter(p => p.length >= 200 && p.length <= 500);
  return eligible[Math.floor(Math.random() * eligible.length)];
}

function RSVP({
  words,
  wpm,
  onComplete,
}: {
  words: string[];
  wpm: number;
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const msPerWord = Math.max(200, Math.round(60_000 / wpm));

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setIndex(i => {
        if (i + 1 >= words.length) {
          clearInterval(intervalRef.current!);
          onComplete();
          return i;
        }
        return i + 1;
      });
    }, msPerWord);
    return () => clearInterval(intervalRef.current!);
  }, [words, msPerWord, onComplete]);

  return (
    <div className="text-2xl font-mono text-center py-8">
      {words[index]}
    </div>
  );
}

export default function GuidedLineTracking() {
  const [level, setLevel] = useState(1);
  const [passage, setPassage] = useState<string>("");
  const [phase, setPhase] = useState<"idle" | "presenting" | "exam">("idle");
  const [score, setScore] = useState<number | null>(null);

  const wpm = 200 + level * 100;

  const startExercise = () => {
    setPassage(randomPassage());
    setPhase("presenting");
  };

  const handlePresentationDone = () => setPhase("exam");

  const [quizIndexes, setQuizIndexes] = useState<number[]>([]);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const words = passage.split(/\s+/);

  const startExam = () => {
    const indexes = Array.from({ length: words.length }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);
    setQuizIndexes(indexes);
    setAnswers(Array(10).fill(false));
    setCurrentQuestion(0);
    setPhase("exam");
  };

  const submitAnswer = (correct: boolean) => {
    setAnswers(a => {
      const copy = [...a];
      copy[currentQuestion] = correct;
      return copy;
    });
    if (currentQuestion + 1 >= quizIndexes.length) {
      const correctCount = answers.filter(Boolean).length + (correct ? 1 : 0);
      const percent = (correctCount / quizIndexes.length) * 100;
      setScore(percent);
      if (percent >= 70) setLevel(l => l + 1);
    } else {
      setCurrentQuestion(c => c + 1);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Rehberli Satır Takibi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {phase === "idle" && (
          <Button onClick={startExercise}>Alıştırmaya Başla</Button>
        )}
        {phase === "presenting" && passage && (
          <RSVP words={passage.split(/\s+/)} wpm={wpm} onComplete={handlePresentationDone} />
        )}
        {phase === "exam" && score === null && (
          <>
            <div className="font-medium">Soru {currentQuestion + 1} / {quizIndexes.length}</div>
            <div className="text-lg">“{words[quizIndexes[currentQuestion]]}” kelimesi pasajda mı?</div>
            <div className="flex gap-4">
              <Button onClick={() => submitAnswer(true)}>Evet</Button>
              <Button variant="outline" onClick={() => submitAnswer(false)}>Hayır</Button>
            </div>
          </>
        )}
        {score !== null && (
          <div className="text-center">
            <p>Puanınız: <strong>{score.toFixed(1)} %</strong></p>
            {score >= 70 ? (
              <p className="text-green-600">Tebrikler! Seviyeyi geçtiniz. (Yeni seviye: {level})</p>
            ) : (
              <p className="text-red-600">%70’in altında. Tekrar deneyin.</p>
            )}
            <Button className="mt-4" onClick={() => { setScore(null); setPhase("idle"); }}>
              Yeniden Başlat
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

