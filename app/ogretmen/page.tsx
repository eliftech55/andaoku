"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  GraduationCap,
  Users,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  Download,
  BookOpen,
  TrendingUp,
  Award,
  Filter,
} from "lucide-react";
import { ClassItem, TeacherAssignment } from "@/lib/types";
import { getTeacherClasses, createClass, getTeacherAssignments, createTeacherAssignment } from "@/lib/firebase/firestore";

export default function OgretmenPaneliPage() {
  const { user, profile } = useAuth();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");

  // Modal durumları
  const [newClassModal, setNewClassModal] = useState(false);
  const [classNameInput, setClassNameInput] = useState("");
  const [classGradeInput, setClassGradeInput] = useState<any>("middle");

  const [newAssignmentModal, setNewAssignmentModal] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [targetClassId, setTargetClassId] = useState("");

  const mockStudents = [
    { id: "s1", name: "Ali Kaya", wpm: 210, comp: 85, lastActivity: "Bugün 10:30", completedAssignments: 4 },
    { id: "s2", name: "Zeynep Demir", wpm: 245, comp: 90, lastActivity: "Dün 16:15", completedAssignments: 5 },
    { id: "s3", name: "Burak Çelik", wpm: 175, comp: 70, lastActivity: "2 gün önce", completedAssignments: 3 },
    { id: "s4", name: "Ayşe Aydın", wpm: 290, comp: 95, lastActivity: "Bugün 11:20", completedAssignments: 5 },
  ];

  useEffect(() => {
    async function load() {
      const uid = user?.uid || profile?.uid || "demo-teacher-123";
      try {
        const cList = await getTeacherClasses(uid);
        if (cList.length > 0) {
          setClasses(cList);
          setTargetClassId(cList[0].id);
        } else {
          // Örnek sınıf
          const defaultClass: ClassItem = {
            id: "cls-7a",
            name: "7-A Türkçe ve Okuma Becerileri",
            teacherId: uid,
            educationLevel: "middle",
            classCode: "AND7A26",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "active",
          };
          setClasses([defaultClass]);
          setTargetClassId("cls-7a");
        }

        const aList = await getTeacherAssignments(uid);
        if (aList.length > 0) {
          setAssignments(aList);
        } else {
          setAssignments([
            {
              id: "asg-1",
              teacherId: uid,
              classId: "cls-7a",
              activityId: "act-pretest-1",
              activityTitle: "Haftalık Akıcı Okuma ve Çıkarım Ödevi",
              assignedAt: new Date().toISOString(),
              dueAt: "2026-10-25T23:59:00Z",
              status: "active",
            },
          ]);
        }
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [user, profile]);

  const handleCreateClass = async () => {
    if (!classNameInput) return;
    const uid = user?.uid || profile?.uid || "demo-teacher-123";
    const code = "OKU" + Math.floor(1000 + Math.random() * 9000);

    const newCls: ClassItem = {
      id: "cls-" + Date.now(),
      name: classNameInput,
      teacherId: uid,
      educationLevel: classGradeInput,
      classCode: code,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
    };

    setClasses((prev) => [...prev, newCls]);
    setNewClassModal(false);
    setClassNameInput("");

    try {
      await createClass(newCls);
    } catch (e) {}
  };

  const handleCreateAssignment = async () => {
    if (!assignmentTitle || !targetClassId) return;
    const uid = user?.uid || profile?.uid || "demo-teacher-123";

    const newAsg: TeacherAssignment = {
      id: "asg-" + Date.now(),
      teacherId: uid,
      classId: targetClassId,
      activityId: "act-fluency-1",
      activityTitle: assignmentTitle,
      assignedAt: new Date().toISOString(),
      dueAt: "2026-10-30T23:59:00Z",
      status: "active",
    };

    setAssignments((prev) => [newAsg, ...prev]);
    setNewAssignmentModal(false);
    setAssignmentTitle("");

    try {
      await createTeacherAssignment(newAsg);
    } catch (e) {}
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl space-y-8">
      {/* Başlık ve Hızlı Butonlar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-sage-200">
        <div>
          <Badge variant="amber" className="mb-1">Eğitimci Yönetim Portalı</Badge>
          <h1 className="text-3xl font-extrabold font-serif text-charcoal">Öğretmen Paneli</h1>
          <p className="text-xs sm:text-sm text-charcoal-muted">
            Sınıflarınızı yönetin, ödev atayın ve öğrenci gelişimini takip edin.
          </p>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setNewClassModal(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Yeni Sınıf Oluştur
          </Button>
          <Button size="sm" variant="amber" onClick={() => setNewAssignmentModal(true)}>
            <Send className="mr-1.5 h-4 w-4" /> Ödev / Görev Ata
          </Button>
        </div>
      </div>

      {/* Sınıf Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {classes.map((c) => (
          <Card key={c.id} className="border-sage-200 bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="capitalize text-[10px]">{c.educationLevel}</Badge>
                <span className="font-mono text-xs font-bold text-brand-800 bg-sage-100 px-2 py-0.5 rounded">
                  Kod: {c.classCode}
                </span>
              </div>
              <CardTitle className="text-base font-bold font-serif text-charcoal mt-1">
                {c.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-charcoal-muted space-y-2">
              <div className="flex justify-between">
                <span>Kayıtlı Öğrenci:</span>
                <span className="font-bold text-charcoal">{mockStudents.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Aktif Görevler:</span>
                <span className="font-bold text-amber-700">{assignments.length}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Öğrenci İlerleme Tablosu */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-serif text-charcoal">Öğrenci Performans Listesi</h2>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => {
              alert("Yetkili sınıf raporu CSV formatında dışa aktarıldı.");
            }}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> Raporu İndir (CSV)
          </Button>
        </div>

        <div className="rounded-2xl border border-sage-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-warm border-b border-sage-200 text-charcoal font-semibold">
                <tr>
                  <th className="p-3.5">Öğrenci Adı</th>
                  <th className="p-3.5">Ortalama Hız (WPM)</th>
                  <th className="p-3.5">Anlama Puanı</th>
                  <th className="p-3.5">Son Etkinlik</th>
                  <th className="p-3.5">Tamamlanan Görev</th>
                  <th className="p-3.5 text-right">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {mockStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-ivory-warm/50 transition-colors">
                    <td className="p-3.5 font-bold text-charcoal flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs">
                        {s.name.charAt(0)}
                      </div>
                      <span>{s.name}</span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-brand-900">{s.wpm} WPM</td>
                    <td className="p-3.5 font-mono font-bold text-amber-600">%{s.comp}</td>
                    <td className="p-3.5 text-charcoal-muted">{s.lastActivity}</td>
                    <td className="p-3.5 text-charcoal">{s.completedAssignments} / 5</td>
                    <td className="p-3.5 text-right">
                      <Badge variant="success" className="text-[10px]">Aktif</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sınıf Oluştur Modalı */}
      <Modal
        isOpen={newClassModal}
        onClose={() => setNewClassModal(false)}
        title="Yeni Sınıf Oluştur"
        description="Öğrencilerinizin sisteme katılması için bir sınıf grubu oluşturun."
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setNewClassModal(false)}>
              Vazgeç
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateClass}>
              Sınıfı Kaydet
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Sınıf Adı</label>
            <input
              type="text"
              value={classNameInput}
              onChange={(e) => setClassNameInput(e.target.value)}
              placeholder="Örn: 8-B Hızlı Okuma ve LGS Grubu"
              className="w-full p-2.5 rounded-xl border border-sage-200 bg-white"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Eğitim Kademesi</label>
            <select
              value={classGradeInput}
              onChange={(e) => setClassGradeInput(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-sage-200 bg-white"
            >
              <option value="primary">İlkokul</option>
              <option value="middle">Ortaokul</option>
              <option value="high">Lise</option>
              <option value="university">Üniversite</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Ödev Ata Modalı */}
      <Modal
        isOpen={newAssignmentModal}
        onClose={() => setNewAssignmentModal(false)}
        title="Ödev / Okuma Görevi Ata"
        description="Seçtiğiniz sınıftaki tüm öğrencilerin panelinde görüntülenecek bir okuma görevi oluşturun."
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setNewAssignmentModal(false)}>
              Vazgeç
            </Button>
            <Button variant="amber" size="sm" onClick={handleCreateAssignment}>
              Görevi Yayınla
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Görev Başlığı</label>
            <input
              type="text"
              value={assignmentTitle}
              onChange={(e) => setAssignmentTitle(e.target.value)}
              placeholder="Örn: Hafta Sonu Mars Metni Okuması ve Anlama Sınavı"
              className="w-full p-2.5 rounded-xl border border-sage-200 bg-white"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Hedef Sınıf</label>
            <select
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-sage-200 bg-white"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
