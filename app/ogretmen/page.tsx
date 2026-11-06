"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { TeacherDashboard } from "@/components/teacher/TeacherDashboard";

export default function OgretmenPaneliPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user && !profile) {
      router.replace("/giris?redirect=/ogretmen");
    }
  }, [loading, profile, router, user]);

  if (loading || (!user && !profile)) {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-charcoal-muted">
        Öğretmen paneli yükleniyor...
      </div>
    );
  }

  return <TeacherDashboard />;
}
