"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import {
  Users,
  FileText,
  Layers,
  Database,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

type DashboardStats = {
  totalUsers: number;
  publishedPassages: number;
  draftPassages: number;
  activeModules: number;
  totalModules: number;
};

const emptyStats: DashboardStats = {
  totalUsers: 0,
  publishedPassages: 0,
  draftPassages: 0,
  activeModules: 0,
  totalModules: 0,
};

export default function YonetimPaneliPage() {
  const { profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!profile || profile.role !== "admin") {
      setStats(null);
      setFirestoreError(null);
      setIsLoading(false);
      return;
    }

    setStats(null);
    setFirestoreError(null);
    setIsLoading(true);

    if (!isFirebaseConfigured) {
      setFirestoreError("Firebase yapılandırması eksik.");
      setIsLoading(false);
      return;
    }

    let isCurrent = true;

    async function loadDashboardStats() {
      try {
        const [usersSnapshot, passagesSnapshot, modulesSnapshot] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "readingPassages")),
          getDocs(collection(db, "learningModules")),
        ]);

        if (!isCurrent) return;

        const passages = passagesSnapshot.docs.map((document) => document.data());
        const modules = modulesSnapshot.docs.map((document) => document.data());
        const publishedPassages = passages.filter((passage) => passage.status === "published").length;
        const draftPassages = passages.filter((passage) => passage.status === "draft").length;

        setStats({
          totalUsers: usersSnapshot.size,
          publishedPassages,
          draftPassages,
          activeModules: modules.filter((module) => module.status === "published").length,
          totalModules: modulesSnapshot.size,
        });
        setFirestoreError(null);
      } catch (error) {
        console.error("Yönetici paneli Firestore verileri yüklenemedi:", error);
        if (isCurrent) {
          setStats(null);
          setFirestoreError(
            "Firestore verileri yüklenemedi. Bağlantıyı ve yönetici erişim kurallarını kontrol edin."
          );
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadDashboardStats();

    return () => {
      isCurrent = false;
    };
  }, [authLoading, profile]);

  const displayedStats = stats ?? emptyStats;
  const systemStats = [
    {
      label: "Toplam Kullanıcı",
      val: isLoading || !stats ? "—" : String(displayedStats.totalUsers),
      change: "Firestore kullanıcı profilleri",
      icon: Users,
    },
    {
      label: "Yayınlanan Metinler",
      val: isLoading || !stats ? "—" : String(displayedStats.publishedPassages),
      change: isLoading || !stats ? "Yayın durumu Firestore’dan alınır" : `${displayedStats.draftPassages} taslak`,
      icon: FileText,
    },
    {
      label: "Aktif Modül",
      val:
        isLoading || !stats
          ? "—"
          : `${displayedStats.activeModules} / ${displayedStats.totalModules}`,
      change: "Yayınlanan / toplam öğrenme modülü",
      icon: Layers,
    },
    {
      label: "Firestore Durumu",
      val: isLoading ? "Kontrol ediliyor" : firestoreError ? "Bağlantı hatası" : "Bağlı",
      change: firestoreError || "Kullanıcı, metin ve modül sorguları başarılı",
      icon: Database,
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-sage-200">
        <div>
          <Badge variant="amber" className="mb-1">Sistem ve Güvenlik</Badge>
          <h1 className="text-3xl font-extrabold font-serif text-charcoal">Yönetici Paneli</h1>
          <p className="text-xs sm:text-sm text-charcoal-muted">
            Platform kullanıcıları, rol atamaları, içerik sürümleri ve güvenlik denetim kayıtları.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/yonetim/icerik">
            <Button size="sm" variant="outline">
              <FileText className="mr-1.5 h-4 w-4" /> İçerik Yönetimi
            </Button>
          </Link>
          <Link href="/yonetim/arastirma">
            <Button size="sm" variant="amber">
              <Database className="mr-1.5 h-4 w-4" /> Araştırma Portalı
            </Button>
          </Link>
        </div>
      </div>

      {!authLoading && profile?.role !== "admin" && !isLoading && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Bu paneldeki verileri görüntülemek için yönetici yetkisi gerekir.
        </div>
      )}

      {/* Firestore'dan yüklenen sistem istatistikleri */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {systemStats.map((st, i) => {
          const Icon = st.icon;
          return (
            <Card key={i} className="border-sage-200">
              <CardContent className="p-5 space-y-1">
                <div className="flex items-center justify-between text-xs text-charcoal-muted">
                  <span>{st.label}</span>
                  <Icon className="h-4 w-4 text-brand-700" />
                </div>
                <div className="text-2xl font-bold font-mono text-charcoal">{st.val}</div>
                <p className={`text-[11px] font-medium ${firestoreError && st.label === "Firestore Durumu" ? "text-red-700" : "text-charcoal-muted"}`}>
                  {st.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {firestoreError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {firestoreError}
        </div>
      )}

      {/* Firestore bağlantı kontrolü */}
      <Card className={`border-sage-200 bg-white ${firestoreError ? "border-red-200" : ""}`}>
        <CardHeader>
          <CardTitle className="text-lg font-bold font-serif flex items-center gap-2">
            {firestoreError ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : (
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            )}
            Firestore Bağlantı Durumu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed text-charcoal-muted">
          <p>
            {isLoading
              ? "Firestore bağlantısı kontrol ediliyor."
              : firestoreError
                ? firestoreError
                : `Firestore bağlantısı başarılı. ${displayedStats.totalUsers} kullanıcı, ${displayedStats.publishedPassages} yayınlanmış metin ve ${displayedStats.activeModules} aktif modül okundu.`}
          </p>
          <p className="text-xs">
            Bu gösterge, yönetici hesabıyla yapılan Firestore okumalarının sonucunu belirtir; güvenlik kurallarının kapsamını değerlendirmez.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
