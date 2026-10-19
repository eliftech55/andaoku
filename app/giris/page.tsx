"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { BookOpen, LogIn, Lock, Mail, AlertCircle, Sparkles } from "lucide-react";
import { resetPassword } from "@/lib/firebase/auth";
import { UserRole } from "@/lib/types";

export default function GirisPage() {
  const router = useRouter();
  const { login, switchDemoRole } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parola Sıfırlama Modalı
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage("Lütfen e-posta adresinizi ve parolanızı girin.");
      return;
    }

    setIsLoading(true);
    const { success, error } = await login(email, password);
    setIsLoading(false);

    if (success) {
      router.push("/panel/profil");
    } else {
      setErrorMessage(error || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setResetStatus({ success: false, message: "Lütfen e-posta adresinizi girin." });
      return;
    }
    const res = await resetPassword(resetEmail);
    if (res.success) {
      setResetStatus({
        success: true,
        message: "Parola sıfırlama bağlantısı e-posta adresinize gönderildi.",
      });
    } else {
      setResetStatus({
        success: false,
        message: res.error || "Sıfırlama bağlantısı gönderilemedi.",
      });
    }
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    switchDemoRole(role);
    if (role === "teacher") {
      router.push("/ogretmen");
    } else if (role === "admin" || role === "content_manager") {
      router.push("/yonetim");
    } else if (role === "researcher") {
      router.push("/yonetim/arastirma");
    } else {
      router.push("/panel");
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-700 text-amber-400">
              <BookOpen className="h-6 w-6" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold font-serif text-charcoal">AndaOku'ya Giriş Yap</h1>
          <p className="text-xs text-charcoal-muted">
            Öğrenme yolunuza devam etmek için hesabınıza giriş yapın.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Card className="border-sage-200 shadow-md">
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1.5">E-posta Adresi</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-charcoal-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@andaoku.edu.tr"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-sage-200 focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-charcoal">Parola</label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetModalOpen(true);
                      setResetStatus(null);
                      setResetEmail(email);
                    }}
                    className="text-xs text-brand-700 hover:underline"
                  >
                    Parolamı Unuttum
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-charcoal-muted" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-sage-200 focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full font-bold" isLoading={isLoading}>
                <LogIn className="mr-2 h-4 w-4" />
                Giriş Yap
              </Button>
            </CardContent>

            <CardFooter className="flex flex-col border-t border-sage-100 p-4 text-center text-xs text-charcoal-muted">
              <p>
                Hesabınız yok mu?{" "}
                <Link href="/kayit" className="text-brand-800 font-bold hover:underline">
                  Hemen Kayıt Olun
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* HIZLI TEST / İNCELEME GİRİŞİ */}
        <div className="p-4 rounded-2xl bg-ivory-warm border border-sage-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              Hızlı Rol İnceleme (Demo Modu)
            </span>
            <Badge variant="secondary" className="text-[10px]">Geliştirici & Jüri</Badge>
          </div>
          <p className="text-[11px] text-charcoal-muted leading-tight">
            Firebase Console yapılandırması öncesinde platformdaki farklı kullanıcı yetkilerini test etmek için tek tıkla oturum açabilirsiniz:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Button size="sm" variant="outline" onClick={() => handleQuickDemoLogin("learner")} className="text-xs justify-start">
              🎓 Öğrenci Girişi
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleQuickDemoLogin("teacher")} className="text-xs justify-start">
              👨‍🏫 Öğretmen Girişi
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleQuickDemoLogin("content_manager")} className="text-xs justify-start">
              ✍️ İçerik Editörü
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleQuickDemoLogin("admin")} className="text-xs justify-start">
              🛡️ Yönetici Girişi
            </Button>
          </div>
        </div>
      </div>

      {/* Parola Sıfırlama Modalı */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Parola Sıfırlama"
        description="Hesabınıza bağlı e-posta adresinize şifre yenileme bağlantısı gönderilecektir."
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setResetModalOpen(false)}>
              Vazgeç
            </Button>
            <Button variant="primary" size="sm" onClick={handleResetPassword}>
              Bağlantı Gönder
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {resetStatus && (
            <div
              className={`p-3 rounded-xl border ${
                resetStatus.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {resetStatus.message}
            </div>
          )}
          <div>
            <label className="block font-semibold mb-1">E-posta Adresi</label>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="ornek@andaoku.edu.tr"
              className="w-full p-2.5 rounded-xl border border-sage-200 bg-white"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
