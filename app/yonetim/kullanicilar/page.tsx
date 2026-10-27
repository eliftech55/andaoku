"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  createUserAssignment,
  getAllUserProfiles,
  getAllUserActivitySummaries,
  getUserAssignments,
  updateUserAssignment,
  updateUserRole,
  updateUserStatus,
} from "@/lib/firebase/firestore";
import { UserActivitySummary, UserAssignment, UserProfile, UserRole } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { CheckCircle2, ClipboardList, Pencil, Search, UserCheck, UserX } from "lucide-react";

const statusLabels: Record<UserProfile["status"], string> = {
  active: "Onaylı",
  pending_verification: "Onay bekliyor",
  suspended: "Askıya alınmış",
};

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "learner", label: "Öğrenci / Okur" },
  { value: "teacher", label: "Öğretmen" },
  { value: "content_manager", label: "İçerik Yöneticisi" },
  { value: "admin", label: "Yönetici" },
  { value: "researcher", label: "Araştırmacı" },
];

export default function KullaniciYonetimiPage() {
  const { profile, user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [assignments, setAssignments] = useState<Record<string, UserAssignment[]>>({});
  const [activitySummaries, setActivitySummaries] = useState<Record<string, UserActivitySummary>>({});
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>("learner");
  const [taskTitle, setTaskTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [editingAssignment, setEditingAssignment] = useState<UserAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasAccess = !authLoading && profile?.role === "admin";
  const filteredUsers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("tr-TR");
    if (!term) return users;
    return users.filter((item) =>
      `${item.displayName} ${item.email} ${item.role}`.toLocaleLowerCase("tr-TR").includes(term)
    );
  }, [search, users]);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    let active = true;
    async function loadUsers() {
      try {
        const list = await getAllUserProfiles();
        const [assignmentEntries, summaries] = await Promise.all([
          Promise.all(
          list.map(async (item) => {
            try {
              return [item.uid, await getUserAssignments(item.uid)] as const;
            } catch (assignmentError) {
              console.error(`Kullanıcı görevi yüklenemedi (${item.uid}):`, assignmentError);
              return [item.uid, []] as const;
            }
          })
          ),
          getAllUserActivitySummaries(list.map((item) => item.uid)),
        ]);
        if (active) {
          setUsers(list.sort((left, right) => left.displayName.localeCompare(right.displayName, "tr")));
          setAssignments(Object.fromEntries(assignmentEntries));
          setActivitySummaries(summaries);
        }
      } catch (loadError) {
        console.error("Kullanıcılar yüklenemedi:", loadError);
        if (active) {
          setError(
            "Kullanıcılar yüklenemedi. Yönetici yetkisini ve Firestore erişim kurallarını kontrol edin."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadUsers();
    return () => {
      active = false;
    };
  }, [hasAccess]);

  const openEditor = (target: UserProfile) => {
    const assignment = assignments[target.uid]?.find((item) => item.status === "active") || null;
    setEditingUser(target);
    setRole(target.role);
    setEditingAssignment(assignment);
    setTaskTitle(assignment?.title || "");
    setDueAt(assignment?.dueAt ? assignment.dueAt.slice(0, 10) : "");
    setMessage(null);
    setError(null);
  };

  const changeStatus = async (target: UserProfile, status: UserProfile["status"]) => {
    setError(null);
    try {
      await updateUserStatus(target.uid, status);
      setUsers((current) => current.map((item) => item.uid === target.uid ? { ...item, status } : item));
      setMessage(`${target.displayName} kullanıcısının durumu güncellendi.`);
    } catch {
      setError("Kullanıcı durumu güncellenemedi.");
    }
  };

  const saveEditor = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingUser || !user || !taskTitle.trim()) {
      setError("Görev başlığı boş bırakılamaz.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateUserRole(editingUser.uid, role);
      const nextAssignment = {
        title: taskTitle.trim(),
        dueAt: dueAt ? new Date(`${dueAt}T23:59:59`).toISOString() : undefined,
        status: "active" as const,
      };
      if (editingAssignment) {
        await updateUserAssignment(editingAssignment.id, nextAssignment);
        setAssignments((current) => ({
          ...current,
          [editingUser.uid]: (current[editingUser.uid] || []).map((item) =>
            item.id === editingAssignment.id ? { ...item, ...nextAssignment } : item
          ),
        }));
      } else {
        const id = await createUserAssignment({
          userId: editingUser.uid,
          ...nextAssignment,
          assignedBy: user.uid,
          assignedAt: new Date().toISOString(),
        });
        setAssignments((current) => ({
          ...current,
          [editingUser.uid]: [...(current[editingUser.uid] || []), { id, ...nextAssignment, userId: editingUser.uid, assignedBy: user.uid, assignedAt: new Date().toISOString() }],
        }));
      }
      setUsers((current) => current.map((item) => item.uid === editingUser.uid ? { ...item, role } : item));
      setEditingUser(null);
      setMessage("Kullanıcı rolü ve görevi güncellendi.");
    } catch {
      setError("Kullanıcı veya görev güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  if (!hasAccess && !loading) {
    return <div className="container mx-auto max-w-5xl px-4 py-10"><div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">Bu sayfayı görüntülemek için yönetici yetkisi gerekir.</div></div>;
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-sage-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <Badge variant="amber" className="mb-1">Sistem ve Güvenlik</Badge>
          <h1 className="font-serif text-3xl font-extrabold text-charcoal">Kullanıcı Yönetimi</h1>
          <p className="text-sm text-charcoal-muted">Kullanıcıları arayın, rollerini ve görevlerini düzenleyin.</p>
        </div>
        <Link href="/yonetim"><Button variant="outline" size="sm">Yönetim Paneline Dön</Button></Link>
      </div>

      {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}

      <Card className="border-sage-200">
        <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-brand-700" /> Kullanıcılar</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-muted" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ad, e-posta veya rol ara..." className="w-full rounded-xl border border-sage-200 py-2.5 pl-10 pr-3 text-sm" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="border-b border-sage-200 bg-ivory-warm text-xs text-charcoal-muted"><tr><th className="p-3">Kullanıcı</th><th className="p-3">Rol</th><th className="p-3">Durum</th><th className="p-3">Son okuma hızı</th><th className="p-3">Son anlama</th><th className="p-3">Modül durumu</th><th className="p-3">Etkinlik</th><th className="p-3">Görev</th><th className="p-3 text-right">İşlem</th></tr></thead>
              <tbody className="divide-y divide-sage-100">
                {loading ? <tr><td colSpan={9} className="p-8 text-center text-charcoal-muted">Kullanıcılar yükleniyor...</td></tr> : filteredUsers.map((item) => {
                  const task = assignments[item.uid]?.find((assignment) => assignment.status === "active");
                  const summary = activitySummaries[item.uid];
                  return <tr key={item.uid}>
                    <td className="p-3"><span className="block font-semibold text-charcoal">{item.displayName}</span><span className="text-xs text-charcoal-muted">{item.email}</span></td>
                    <td className="p-3"><Badge variant="secondary">{roleOptions.find((option) => option.value === item.role)?.label || item.role}</Badge></td>
                    <td className="p-3"><Badge variant={item.status === "active" ? "success" : item.status === "pending_verification" ? "amber" : "outline"}>{statusLabels[item.status]}</Badge></td>
                    <td className="p-3 text-xs">{summary?.lastReadingSpeed !== undefined ? `${Math.round(summary.lastReadingSpeed)} kelime/dk` : "Henüz yok"}</td>
                    <td className="p-3 text-xs">{summary?.lastComprehensionScore !== undefined ? `%${Math.round(summary.lastComprehensionScore)}` : "Henüz yok"}</td>
                    <td className="p-3 text-xs">{summary?.moduleStatus === "completed" ? "Tamamlandı" : summary?.moduleStatus === "in_progress" ? "Devam ediyor" : "Başlamadı"} ({summary?.completedModules || 0}/{summary?.totalModules || 0})</td>
                    <td className="p-3 text-xs">{summary?.completedActivities || 0}/{summary?.totalActivities || 0}</td>
                    <td className="p-3 text-xs text-charcoal-muted">{task?.title || "Görev yok"}</td>
                    <td className="p-3 text-right"><div className="flex justify-end gap-2">{item.status === "pending_verification" && <Button size="sm" variant="primary" onClick={() => void changeStatus(item, "active")}><CheckCircle2 className="mr-1 h-4 w-4" /> Onayla</Button>}{item.status === "active" && <Button size="sm" variant="outline" onClick={() => void changeStatus(item, "suspended")}><UserX className="mr-1 h-4 w-4" /> Askıya Al</Button>}{item.status === "suspended" && <Button size="sm" variant="primary" onClick={() => void changeStatus(item, "active")}>Etkinleştir</Button>}<Button size="sm" variant="outline" onClick={() => openEditor(item)}><Pencil className="mr-1 h-4 w-4" /> Düzenle</Button></div></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={Boolean(editingUser)} onClose={() => setEditingUser(null)} title="Kullanıcıyı Düzenle">
        <form onSubmit={saveEditor} className="space-y-4">
          <p className="text-sm text-charcoal-muted">{editingUser?.displayName}</p>
          <label className="block text-sm font-semibold text-charcoal">Rol
            <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="mt-1 w-full rounded-xl border border-sage-200 bg-white p-2.5">{roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          </label>
          <label className="block text-sm font-semibold text-charcoal">Görev
            <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Görev başlığı" className="mt-1 w-full rounded-xl border border-sage-200 p-2.5" />
          </label>
          <label className="block text-sm font-semibold text-charcoal">Son tarih (isteğe bağlı)
            <input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="mt-1 w-full rounded-xl border border-sage-200 p-2.5" />
          </label>
          <Button type="submit" variant="primary" className="w-full" disabled={saving}>{saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</Button>
        </form>
      </Modal>
    </div>
  );
}
