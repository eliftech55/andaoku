"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { User, Settings, Shield, Bell, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { EducationLevel } from "@/lib/types";

export default function ProfilPage() {
  const { profile, updatePreferences, logout } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(profile?.educationLevel || "middle");
  const [fontSize, setFontSize] = useState(profile?.preferences?.fontSize || 18);
  const [theme, setTheme] = useState(profile?.preferences?.theme || "light");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Hesap silme modalı
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteRequested, setDeleteRequested] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePreferences({
      fontSize,
      theme,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDeleteRequest = () => {
    setDeleteRequested(true);
    setDeleteModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-4xl space-y-8">
      <div className="space-y-1">
        <Badge variant="amber">Hesap ve Tercihler</Badge>
        <h1 className="text-3xl font-extrabold font-serif text-charcoal">Profil ve Ayarlar</h1>
        <p className="text-xs sm:text-sm text-charcoal-muted">
          Kişisel bilgilerinizi, okuma ekranı tercihlerinizi ve veri gizliliği ayarlarınızı yönetin.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Profil ve okuma tercihleriniz başarıyla güncellendi.</span>
        </div>
      )}

      {deleteRequested && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>Hesap silme talebiniz alındı. KVKK kapsamında 30 gün içinde tüm kişisel kayıtlarınız sistemden temizlenecektir.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Temel Bilgiler */}
        <Card className="border-sage-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold font-serif flex items-center gap-2">
              <User className="h-5 w-5 text-brand-700" />
              Kullanıcı Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-charcoal block mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-sage-200 bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-charcoal block mb-1">E-posta</label>
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full p-2.5 rounded-xl border border-sage-200 bg-ivory-warm text-charcoal-muted"
                />
              </div>
              <div>
                <label className="font-semibold text-charcoal block mb-1">Eğitim Kademesi</label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
                  className="w-full p-2.5 rounded-xl border border-sage-200 bg-white"
                >
                  <option value="primary">İlkokul</option>
                  <option value="middle">Ortaokul</option>
                  <option value="high">Lise</option>
                  <option value="university">Üniversite</option>
                  <option value="adult">Yetişkin</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-charcoal block mb-1">Kullanıcı Rolü</label>
                <input
                  type="text"
                  value={profile?.role || "learner"}
                  disabled
                  className="w-full p-2.5 rounded-xl border border-sage-200 bg-ivory-warm text-charcoal-muted capitalize"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Varsayılan Okuma Laboratuvarı Tercihleri */}
        <Card className="border-sage-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold font-serif flex items-center gap-2">
              <Settings className="h-5 w-5 text-amber-600" />
              Varsayılan Okuma Laboratuvarı Tercihleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-charcoal block mb-1">Varsayılan Yazı Boyutu: {fontSize}px</label>
                <input
                  type="range"
                  min="14"
                  max="28"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-brand-700"
                />
              </div>
              <div>
                <label className="font-semibold text-charcoal block mb-1">Varsayılan Tema</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-sage-200 bg-white"
                >
                  <option value="light">Açık (Kırık Beyaz)</option>
                  <option value="sepia">Sepya (Göz Dinlendirici)</option>
                  <option value="dark">Koyu (Gece Modu)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            Hesabımı Sil
          </Button>

          <Button type="submit" variant="primary" size="md" className="px-8 font-bold">
            Değişiklikleri Kaydet
          </Button>
        </div>
      </form>

      {/* Hesap Silme Onay Modalı */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Hesap Silme Onayı"
        description="Bu işlem geri alınamaz. Hesabınız ve tüm okuma geçmişiniz silinmek üzere işaretlenecektir."
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Vazgeç
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteRequest}>
              Evet, Hesabımı Sil
            </Button>
          </div>
        }
      >
        <p className="text-xs text-charcoal-muted leading-relaxed">
          Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca, hesabınızı silme talebiniz sonrasında ölçüm kayıtlarınız anonimleştirilir ve kişisel tanımlayıcılarınız kalıcı olarak kaldırılır.
        </p>
      </Modal>
    </div>
  );
}
