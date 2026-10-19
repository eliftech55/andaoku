"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { BookOpen, UserPlus, Lock, Mail, User, AlertCircle, ShieldCheck } from "lucide-react";
import { EducationLevel, UserRole } from "@/lib/types";

export default function KayitPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [educationLevel, setEducationLevel] = useState<EducationLevel>("middle");
  const [role, setRole] = useState<UserRole>("learner");
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [parentConsent, setParentConsent] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName || !lastName || !email || !password) {
      setErrorMessage("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage("Parolalar birbiriyle uyuşmuyor.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Parola en az 6 karakterden oluşmalıdır.");
      return;
    }

    if (!kvkkAccepted) {
      setErrorMessage("Lütfen KVKK Aydınlatma Metnini ve Kullanım Koşullarını onaylayın.");
      return;
    }

    if (educationLevel === "primary" && !parentConsent) {
      setErrorMessage("İlkokul kademesindeki öğrenciler için veli / vasinin bilgilendirildiğine dair onay gereklidir.");
      return;
    }

    setIsLoading(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const { success, error } = await signup(email, password, fullName, educationLevel, role);
    setIsLoading(false);

    if (success) {
      router.push("/panel");
    } else {
      setErrorMessage(error || "Kayıt işlemi gerçekleştirilemedi.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[85vh]">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-700 text-amber-400">
              <BookOpen className="h-6 w-6" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold font-serif text-charcoal">AndaOku'ya Kayıt Ol</h1>
          <p className="text-xs text-charcoal-muted">
            Kişiselleştirilmiş okuma ve anlama platformuna ücretsiz katılın.
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
              {/* Ad Soyad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1.5">Adınız</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-charcoal-muted" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Elif"
                      required
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-sage-200 focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1.5">Soyadınız</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Yılmaz"
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-sage-200 focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
                  />
                </div>
              </div>

              {/* E-posta */}
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

              {/* Eğitim Kademesi & Rol */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1.5">Eğitim Kademesi</label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
                    className="w-full p-2 text-sm rounded-xl border border-sage-200 focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
                  >
                    <option value="primary">İlkokul (3-4. Sınıf)</option>
                    <option value="middle">Ortaokul (5-8. Sınıf)</option>
                    <option value="high">Lise (9-12. Sınıf)</option>
                    <option value="university">Üniversite</option>
                    <option value="adult">Yetişkin / Profesyonel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1.5">Hesap Türü</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full p-2 text-sm rounded-xl border border-sage-200 focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
                  >
                    <option value="learner">Öğrenci / Bireysel Okur</option>
                    <option value="teacher">Öğretmen / Eğitmen</option>
                  </select>
                </div>
              </div>

              {/* Parola & Parola Doğrulama */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1.5">Parola</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-charcoal-muted" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-sage-200 focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1.5">Parola Tekrar</label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-sage-200 focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
                  />
                </div>
              </div>

              {/* İlkokul Veli Bilgilendirme Kutusu */}
              {educationLevel === "primary" && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="h-4 w-4 text-amber-700" />
                    <span>Veli Bilgilendirmesi</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    İlkokul yaş grubundaki kullanıcıların okuma gelişim verileri yalnızca eğitsel amaçla işlenir.
                  </p>
                  <label className="flex items-center gap-2 pt-1 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={parentConsent}
                      onChange={(e) => setParentConsent(e.target.checked)}
                      className="rounded border-amber-400 text-brand-700 focus:ring-brand-700"
                    />
                    <span>Velim / Vasim bu eğitsel üyeliği onayladı.</span>
                  </label>
                </div>
              )}

              {/* KVKK ve Kullanım Koşulları */}
              <div className="pt-2 text-xs text-charcoal-muted space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={kvkkAccepted}
                    onChange={(e) => setKvkkAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-sage-300 text-brand-700 focus:ring-brand-700"
                  />
                  <span>
                    <Link href="/gizlilik" target="_blank" className="text-brand-800 underline font-semibold">
                      KVKK Aydınlatma Metnini
                    </Link>{" "}
                    ve{" "}
                    <Link href="/kullanim-kosullari" target="_blank" className="text-brand-800 underline font-semibold">
                      Kullanım Koşullarını
                    </Link>{" "}
                    okudum, kabul ediyorum.
                  </span>
                </label>
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full font-bold mt-2" isLoading={isLoading}>
                <UserPlus className="mr-2 h-4 w-4" />
                Hesap Oluştur ve Başla
              </Button>
            </CardContent>

            <CardFooter className="flex flex-col border-t border-sage-100 p-4 text-center text-xs text-charcoal-muted">
              <p>
                Zaten hesabınız var mı?{" "}
                <Link href="/giris" className="text-brand-800 font-bold hover:underline">
                  Giriş Yapın
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
