"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getAllUserProfiles, updateUserStatus, createUserAssignment } from "@/lib/firebase/firestore";
import { UserAssignment, UserProfile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ClipboardList, UserCheck, UserX } from "lucide-react";

const statusLabels: Record<UserProfile["status"], string> = {
  active: "Onaylı",
  pending_verification: "Onay bekliyor",
  suspended: "Askıya alınmış",
};

export default function KullaniciYonetimiPage() {
  const { profile, user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasAccess = !authLoading && profile?.role === "admin";
  const selectedUser = useMemo(
    () => users.find((item) => item.uid === selectedUserId) || null,
    [selectedUserId, users]
  );

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    let active = true;
    async function loadUsers() {
      try {
        const list = await getAllUserProfiles();
        if (active) {
          setUsers(list.sort((left, right) => left.displayName.localeCompare(right.displayName, "tr")));
        }
      } catch {
        if (active) setError("Kullanıcılar yüklenemedi. Firestore erişimini kontrol edin.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadUsers();
    return () => {
      active = false;
    };
  }, [hasAccess]);

  const changeStatus = async (target: UserProfile, status: UserProfile["status"]) => {
    setError(null);
    setMessage(null);
    try {
      await updateUserStatus(target.uid, status);
      setUsers((current) =>
        current.map((item) => item.uid === target.uid ? { ...item, status } : item)
      );
      setMessage(`${target.displayName} kullanıcısının durumu güncellendi.`);
    } catch {
      setError("Kullanıcı durumu güncellenemedi.");
    }
  };

  const assignTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !selectedUserId || !title.trim()) {
      setError("Kullanıcı ve görev başlığı seçilmelidir.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    const assignment: Omit<UserAssignment, "id"> = {
      userId: selectedUserId,
      title: title.trim(),
      description: description.trim() || undefined,
      assignedBy: user.uid,
      assignedAt: new Date().toISOString(),
      dueAt: dueAt ? new Date(`${dueAt}T23:59:59`).toISOString() : undefined,
      status: "active",
    };
    try {
      await createUserAssignment(assignment);
      setTitle("");
      setDescription("");
      setDueAt("");
      setMessage(`${selectedUser?.displayName || "Kullanıcı"} için görev atandı.`);
    } catch {
      setError("Görev atanamadı. Yönetici yetkisini ve Firestore kurallarını kontrol edin.");
    } finally {
      setSaving(false);
    }
  };

  if (!hasAccess && !loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          Bu sayfayı görüntülemek için yönetici yetkisi gerekir.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-sage-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <Badge variant="amber" className="mb-1">Sistem ve Güvenlik</Badge>
          <h1 className="font-serif text-3xl font-extrabold text-charcoal">Kullanıcı Yönetimi</h1>
          <p className="text-sm text-charcoal-muted">Kullanıcı onaylarını yönetin ve kişiye özel görev atayın.</p>
        </div>
        <Link href="/yonetim"><Button variant="outline" size="sm">Yönetim Paneline Dön</Button></Link>
      </div>

      {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="border-sage-200">
          <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-brand-700" /> Kullanıcılar</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loading ? <p className="text-sm text-charcoal-muted">Kullanıcılar yükleniyor...</p> : users.length === 0 ? (
              <p className="text-sm text-charcoal-muted">Kayıtlı kullanıcı bulunamadı.</p>
            ) : users.map((item) => (
              <div key={item.uid} className={`rounded-xl border p-4 ${selectedUserId === item.uid ? "border-brand-700 bg-brand-50" : "border-sage-200 bg-white"}`}>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <button type="button" className="text-left" onClick={() => setSelectedUserId(item.uid)}>
                    <span className="block font-semibold text-charcoal">{item.displayName}</span>
                    <span className="block text-xs text-charcoal-muted">{item.email} · {item.role}</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.status === "active" ? "success" : item.status === "pending_verification" ? "amber" : "outline"}>
                      {statusLabels[item.status]}
                    </Badge>
                    {item.status === "pending_verification" && (
                      <Button size="sm" variant="primary" onClick={() => void changeStatus(item, "active")}>
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Onayla
                      </Button>
                    )}
                    {item.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => void changeStatus(item, "suspended")}>
                        <UserX className="mr-1 h-4 w-4" /> Askıya Al
                      </Button>
                    )}
                    {item.status === "suspended" && (
                      <Button size="sm" variant="primary" onClick={() => void changeStatus(item, "active")}>Yeniden Etkinleştir</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-fit border-sage-200">
          <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-brand-700" /> Görev Ata</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={assignTask} className="space-y-4">
              <label className="block text-sm font-semibold text-charcoal">
                Kullanıcı
                <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="mt-1 w-full rounded-xl border border-sage-200 bg-white p-2.5">
                  <option value="">Kullanıcı seçin</option>
                  {users.filter((item) => item.status === "active").map((item) => <option key={item.uid} value={item.uid}>{item.displayName} — {item.email}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-charcoal">
                Görev başlığı
                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Örn: Kolay okuma metnini tamamla" className="mt-1 w-full rounded-xl border border-sage-200 p-2.5" />
              </label>
              <label className="block text-sm font-semibold text-charcoal">
                Açıklama
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-sage-200 p-2.5" />
              </label>
              <label className="block text-sm font-semibold text-charcoal">
                Son tarih (isteğe bağlı)
                <input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="mt-1 w-full rounded-xl border border-sage-200 p-2.5" />
              </label>
              <Button type="submit" variant="primary" className="w-full" disabled={saving}>{saving ? "Atanıyor..." : "Görevi Ata"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
