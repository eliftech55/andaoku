"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Users,
  FileText,
  Activity,
  Layers,
  Database,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export default function YonetimPaneliPage() {
  const { profile } = useAuth();

  const systemStats = [
    { label: "Toplam Kullanıcı", val: "1,248", change: "+12 bu hafta", icon: Users },
    { label: "Yayınlanan Metinler", val: "42", change: "3 taslak", icon: FileText },
    { label: "Aktif Modül", val: "10 / 10", change: "Tamamı yayında", icon: Layers },
    { label: "Firestore Durumu", val: "Çevrimiçi", change: "Güvenlik Kuralları Aktif", icon: Database },
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

      {/* 4 Sistem İstatistiği */}
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
                <p className="text-[11px] text-emerald-700 font-medium">{st.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Güvenlik Kuralları ve Firestore Durumu */}
      <Card className="border-sage-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold font-serif flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            Firestore Güvenlik Kuralları ve Erişim Denetimi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs leading-relaxed text-charcoal-muted">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Kapalı Erişim İlkesi (Default Deny) Aktif:</span>
              <span>
                firestore.rules kuralları doğrulanmıştır. Öğrenciler yalnızca kendi okuma oturumlarını okuyabilir; öğretmenler yalnızca yetkili oldukları sınıfları denetleyebilir.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-ivory-warm border border-sage-200">
              <span className="font-bold text-charcoal block mb-0.5">Cevap Anahtarı Koruması</span>
              <span>Öğrenci istemcileri doğru cevap anahtarlarına sorular yanıtlanmadan önce doğrudan erişemez.</span>
            </div>
            <div className="p-3 rounded-xl bg-ivory-warm border border-sage-200">
              <span className="font-bold text-charcoal block mb-0.5">Denetim Günlükleri</span>
              <span>Tüm ayrıcalıklı işlemler auditLogs koleksiyonunda değiştirilemez (append-only) olarak saklanır.</span>
            </div>
            <div className="p-3 rounded-xl bg-ivory-warm border border-sage-200">
              <span className="font-bold text-charcoal block mb-0.5">Yetki İhlali Koruması</span>
              <span>İstemci tarafından rol alanı (role) manipülasyonu Firestore kuralları ile engellenmiştir.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
