"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchPassages } from "@/lib/services/contentService";
import { ReadingPassage, EducationLevel, DifficultyLevel } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  BookOpen,
  Clock,
  Filter,
  Play,
  ArrowUpDown,
  BookMarked,
  Sparkles,
} from "lucide-react";
import { countTurkishWords } from "@/lib/utils";

export default function KutuphanePage() {
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"title" | "wordCount" | "estimatedReadingTime">("wordCount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    async function load() {
      const list = await fetchPassages();
      setPassages(list);
    }
    load();
  }, []);

  const filtered = passages
    .filter((p) => {
      // Metin araması
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase());

      // Eğitim kademesi
      const matchesLevel =
        selectedLevel === "all" || p.educationLevels.includes(selectedLevel as EducationLevel);

      // Zorluk
      const matchesDifficulty = selectedDifficulty === "all" || p.difficulty === selectedDifficulty;

      // Tür
      const matchesGenre = selectedGenre === "all" || p.genre === selectedGenre;

      return matchesSearch && matchesLevel && matchesDifficulty && matchesGenre;
    })
    .sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl space-y-8">
      {/* Başlık */}
      <div className="space-y-2">
        <Badge variant="amber">Özenle Seçilmiş İçerikler</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-charcoal">
          Okuma Kütüphanesi
        </h1>
        <p className="text-sm text-charcoal-muted max-w-2xl leading-relaxed">
          Yaş grubunuza ve ilgi alanınıza uygun; bilgilendirici, edebi ve analitik metinlerle okuma pratiği yapın.
        </p>
      </div>

      {/* Arama ve Filtreleme Çubuğu */}
      <div className="p-4 rounded-2xl bg-white border border-sage-200 shadow-sm space-y-4">
        {/* Arama Kutusu */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-charcoal-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Metin başlığı, konu veya anahtar kelime arayın..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-sage-200 bg-ivory-warm focus:outline-none focus:ring-2 focus:ring-brand-700"
          />
        </div>

        {/* Filtre Açılır Menüleri */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="font-semibold text-charcoal block mb-1">Eğitim Kademesi</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full p-2 rounded-xl border border-sage-200 bg-white"
            >
              <option value="all">Tüm Kademeler</option>
              <option value="primary">İlkokul</option>
              <option value="middle">Ortaokul</option>
              <option value="high">Lise</option>
              <option value="university">Üniversite</option>
              <option value="adult">Yetişkin</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-charcoal block mb-1">Zorluk Seviyesi</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full p-2 rounded-xl border border-sage-200 bg-white"
            >
              <option value="all">Tüm Zorluklar</option>
              <option value="beginner">Başlangıç</option>
              <option value="intermediate">Orta Düzey</option>
              <option value="advanced">İleri Düzey</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-charcoal block mb-1">Metin Türü</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full p-2 rounded-xl border border-sage-200 bg-white"
            >
              <option value="all">Tüm Türler</option>
              <option value="bilgilendirici">Bilgilendirici</option>
              <option value="aciklayici">Açıklayıcı</option>
              <option value="oykuleyici">Öyküleyici</option>
              <option value="akademik">Akademik</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-charcoal block mb-1">Sıralama</label>
            <div className="flex gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full p-2 rounded-xl border border-sage-200 bg-white text-xs"
              >
                <option value="wordCount">Kelime Sayısı</option>
                <option value="title">Başlık</option>
                <option value="estimatedReadingTime">Okuma Süresi</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="p-2 rounded-xl border border-sage-200 bg-ivory-warm hover:bg-ivory-beige"
                title="Sıralama Yönünü Değiştir"
              >
                <ArrowUpDown className="h-4 w-4 text-charcoal" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* METİN LİSTESİ */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-sage-200 space-y-3">
          <BookMarked className="h-12 w-12 mx-auto text-sage-300" />
          <h3 className="text-lg font-bold font-serif text-charcoal">Eşleşen Metin Bulunamadı</h3>
          <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
            Arama kriterlerinize veya seçili filtrelere uygun metin bulunamadı. Lütfen filtreleri sıfırlamayı deneyin.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setSelectedLevel("all");
              setSelectedDifficulty("all");
              setSelectedGenre("all");
            }}
          >
            Filtreleri Temizle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((passage) => {
            const wordCount = passage.wordCount || countTurkishWords(passage.content);

            return (
              <Card
                key={passage.id}
                className="border-sage-200 flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="secondary" className="capitalize text-[11px]">
                      {passage.genre}
                    </Badge>
                    <Badge
                      variant={
                        passage.difficulty === "beginner"
                          ? "success"
                          : passage.difficulty === "intermediate"
                          ? "amber"
                          : "default"
                      }
                      className="capitalize text-[10px]"
                    >
                      {passage.difficulty === "beginner"
                        ? "Başlangıç"
                        : passage.difficulty === "intermediate"
                        ? "Orta"
                        : "İleri"}
                    </Badge>
                  </div>

                  <CardTitle className="text-lg font-bold font-serif text-charcoal group-hover:text-brand-800 transition-colors line-clamp-2">
                    {passage.title}
                  </CardTitle>
                  <p className="text-xs text-brand-900 font-medium">{passage.topic}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-xs text-charcoal-muted line-clamp-3 leading-relaxed">
                    {passage.content}
                  </p>

                  <div className="pt-3 border-t border-sage-100 flex items-center justify-between text-xs text-charcoal-muted">
                    <div className="flex items-center gap-1.5 font-medium">
                      <BookOpen className="h-3.5 w-3.5 text-brand-700" />
                      <span>{wordCount} Kelime</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      <span>~{passage.estimatedReadingTime} sn</span>
                    </div>
                  </div>

                  <Link href={`/panel/okuma-laboratuvari?passageId=${passage.id}`} className="block pt-1">
                    <Button size="sm" variant="amber" className="w-full font-bold">
                      <Play className="mr-1.5 h-3.5 w-3.5" />
                      Okuma Seansını Başlat
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
