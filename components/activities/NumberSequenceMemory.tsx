import React, { useState, KeyboardEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DIGITS = Array.from({ length: 10 }, (_, i) => i);

export default function NumberSequenceMemory() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [input, setInput] = useState<string>("");

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key >= "0" && e.key <= "9") {
      addNumber(parseInt(e.key, 10));
      e.preventDefault();
    } else if (e.key === "Backspace") {
      removeLast();
      e.preventDefault();
    }
  };

  const addNumber = (n: number) => setSequence((s) => [...s, n]);
  const removeAt = (idx: number) => setSequence((s) => s.filter((_, i) => i !== idx));
  const removeLast = () => setSequence((s) => s.slice(0, -1));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "");
    setInput(cleaned);
  };
  const commitTyped = () => {
    if (input) {
      const nums = input.split("").map((c) => parseInt(c, 10));
      setSequence((s) => [...s, ...nums]);
      setInput("");
    }
  };

  return (
    <Card className="max-w-xl mx-auto" tabIndex={0} onKeyDown={handleKeyDown}>
      <CardHeader>
        <CardTitle>Rakam Dizisi Hafızası</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-5 gap-2">
          {DIGITS.map((d) => (
            <Button key={d} variant="outline" onClick={() => addNumber(d)}>
              {d}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Klavye ile sayı yaz"
            value={input}
            onChange={handleChange}
            className="border rounded px-2 py-1 flex-1"
          />
          <Button onClick={commitTyped}>Ekle</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {sequence.map((num, idx) => (
            <div
              key={idx}
              className="flex items-center bg-gray-100 border rounded px-3 py-1"
            >
              <span className="font-mono">{num}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeAt(idx)}
                className="ml-1 h-5 w-5"
              >
                ✕
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button onClick={removeLast}>Sonu Sil</Button>
          <Button variant="destructive" onClick={() => setSequence([])}>
            Tümünü Temizle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

