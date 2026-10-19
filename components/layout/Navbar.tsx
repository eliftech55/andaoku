"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Menu,
  X,
  Compass,
  BarChart3,
  GraduationCap,
  Settings,
  Shield,
  LogOut,
  UserCheck,
} from "lucide-react";
import { UserRole } from "@/lib/types";

export function Navbar() {
  const pathname = usePathname();
  const { profile, logout, switchDemoRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const roles: { role: UserRole; label: string }[] = [
    { role: "learner", label: "Öğrenci / Okur" },
    { role: "teacher", label: "Öğretmen" },
    { role: "content_manager", label: "İçerik Yöneticisi" },
    { role: "admin", label: "Yönetici" },
    { role: "researcher", label: "Araştırmacı" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sage-200/80 bg-ivory/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-amber-400 shadow-sm transition-transform group-hover:scale-105">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-brand-950 font-serif">
              Anda<span className="text-amber-600">Oku</span>
            </span>
            <span className="text-[10px] text-charcoal-muted tracking-wide font-sans">
              Daha bilinçli oku, daha iyi anla
            </span>
          </div>
        </Link>

        {/* Masaüstü Navigasyon */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className={`transition-colors hover:text-brand-700 ${
              isActive("/") ? "text-brand-800 font-semibold" : "text-charcoal-muted"
            }`}
          >
            Ana Sayfa
          </Link>
          <Link
            href="/nasil-calisir"
            className={`transition-colors hover:text-brand-700 ${
              isActive("/nasil-calisir") ? "text-brand-800 font-semibold" : "text-charcoal-muted"
            }`}
          >
            Nasıl Çalışır?
          </Link>
          <Link
            href="/ozellikler"
            className={`transition-colors hover:text-brand-700 ${
              isActive("/ozellikler") ? "text-brand-800 font-semibold" : "text-charcoal-muted"
            }`}
          >
            Özellikler
          </Link>
          <Link
            href="/panel/kutuphane"
            className={`transition-colors hover:text-brand-700 ${
              isActive("/panel/kutuphane") ? "text-brand-800 font-semibold" : "text-charcoal-muted"
            }`}
          >
            Kütüphane
          </Link>

          {profile && (
            <>
              <Link
                href="/panel"
                className={`transition-colors hover:text-brand-700 ${
                  isActive("/panel") ? "text-brand-800 font-semibold" : "text-charcoal-muted"
                }`}
              >
                Panelim
              </Link>
              <Link
                href="/panel/okuma-laboratuvari"
                className={`transition-colors hover:text-brand-700 ${
                  isActive("/panel/okuma-laboratuvari") ? "text-brand-800 font-semibold" : "text-charcoal-muted"
                }`}
              >
                Laboratuvar
              </Link>
              <Link
                href="/panel/baslangic-sinavi"
                className={`transition-colors hover:text-brand-700 flex items-center gap-1 font-semibold ${
                  isActive("/panel/baslangic-sinavi") ? "text-amber-700" : "text-amber-800"
                }`}
              >
                <span>Başlangıç Sınavı</span>
                <Badge variant="amber" className="text-[9px] px-1.5 py-0">Seviye Tespit</Badge>
              </Link>
            </>
          )}

          {profile?.role === "teacher" && (
            <Link
              href="/ogretmen"
              className={`transition-colors hover:text-brand-700 font-semibold flex items-center gap-1.5 ${
                isActive("/ogretmen") ? "text-brand-800" : "text-emerald-700"
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              Öğretmen Paneli
            </Link>
          )}

          {(profile?.role === "admin" || profile?.role === "content_manager") && (
            <div className="flex items-center gap-4">
              <Link
                href="/yonetim"
                className={`transition-colors hover:text-brand-700 font-semibold flex items-center gap-1.5 ${
                  isActive("/yonetim") ? "text-brand-800" : "text-brand-700"
                }`}
              >
                <Shield className="h-4 w-4" />
                Yönetim
              </Link>
              <Link
                href="/yonetim/baslangic-sinavlari"
                className={`transition-colors hover:text-brand-700 font-semibold flex items-center gap-1.5 ${
                  isActive("/yonetim/baslangic-sinavlari") ? "text-brand-800" : "text-brand-700"
                }`}
              >
                Sınav Yönetimi
              </Link>
            </div>
          )}
        </nav>

        {/* Sağ Alan: Hızlı Rol Değiştirici ve Kullanıcı / Giriş Butonları */}
        <div className="hidden md:flex items-center gap-3">
          {/* Hızlı Rol Seçici (İnceleme ve test için) */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-sage-200 bg-ivory-warm text-charcoal hover:bg-ivory-beige transition-colors"
              title="Rolü Değiştir (Test & İnceleme)"
            >
              <UserCheck className="h-3.5 w-3.5 text-brand-700" />
              <span className="font-semibold capitalize">
                {profile ? profile.role : "Rol Seç"}
              </span>
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white p-2 shadow-xl border border-sage-200 z-50 animate-fade-in">
                <div className="px-2 py-1 text-[11px] font-semibold text-charcoal-muted border-b border-sage-100 mb-1">
                  ROL SEÇİCİ (TEST MODU)
                </div>
                {roles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchDemoRole(r.role);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${
                      profile?.role === r.role
                        ? "bg-brand-50 text-brand-800 font-bold"
                        : "hover:bg-ivory-beige text-charcoal"
                    }`}
                  >
                    <span>{r.label}</span>
                    {profile?.role === r.role && <Badge variant="secondary" className="text-[9px]">Aktif</Badge>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {profile ? (
            <div className="flex items-center gap-2">
              <Link href="/panel/profil">
                <Button size="sm" variant="secondary" className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Profil</span>
                </Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={() => logout()} title="Çıkış Yap">
                <LogOut className="h-4 w-4 text-charcoal-muted hover:text-rose-600" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/giris">
                <Button variant="ghost" size="sm">
                  Giriş Yap
                </Button>
              </Link>
              <Link href="/kayit">
                <Button variant="primary" size="sm">
                  Hemen Başla
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobil Hamburger Butonu */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-charcoal hover:bg-ivory-beige rounded-lg"
            aria-label="Menüyü Aç"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobil Menü */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-sage-200 bg-ivory-warm p-4 space-y-3 animate-fade-in">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-charcoal hover:bg-ivory-beige"
          >
            Ana Sayfa
          </Link>
          <Link
            href="/nasil-calisir"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-charcoal hover:bg-ivory-beige"
          >
            Nasıl Çalışır?
          </Link>
          <Link
            href="/ozellikler"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-charcoal hover:bg-ivory-beige"
          >
            Özellikler
          </Link>
          <Link
            href="/panel/kutuphane"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-charcoal hover:bg-ivory-beige"
          >
            Kütüphane
          </Link>
          <Link
            href="/panel"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-brand-800 font-semibold hover:bg-ivory-beige"
          >
            Öğrenci Paneli
          </Link>
          {profile && (
            <Link
              href="/panel/profil"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-charcoal hover:bg-ivory-beige"
            >
              Profil
            </Link>
          )}
          <Link
            href="/panel/okuma-laboratuvari"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-charcoal hover:bg-ivory-beige"
          >
            Okuma Laboratuvarı
          </Link>

          <div className="pt-3 border-t border-sage-200 flex flex-col gap-2">
            <div className="text-xs font-semibold text-charcoal-muted px-1">ROL SEÇİMİ</div>
            <div className="grid grid-cols-2 gap-1.5">
              {roles.map((r) => (
                <button
                  key={r.role}
                  onClick={() => {
                    switchDemoRole(r.role);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-2 py-1 text-xs rounded border text-left ${
                    profile?.role === r.role ? "bg-brand-700 text-white font-bold" : "bg-white text-charcoal"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {profile ? (
              <Button variant="outline" size="sm" onClick={() => logout()} className="w-full mt-2">
                Çıkış Yap
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Link href="/giris" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Giriş
                  </Button>
                </Link>
                <Link href="/kayit" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Kayıt Ol
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
