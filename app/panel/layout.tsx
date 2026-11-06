"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user && !profile) {
      router.replace(`/giris?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, pathname, profile, router, user]);

  if (loading || (!user && !profile)) {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-charcoal-muted">
        Kullanıcı paneli yükleniyor...
      </div>
    );
  }

  return <>{children}</>;
}
