import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { normalizeStudentUsername, studentLoginEmail } from "@/lib/studentCredentials";

export const runtime = "nodejs";

async function teacherId(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !adminAuth || !adminDb) return null;
  const decoded = await adminAuth.verifyIdToken(token);
  const profile = await adminDb.collection("users").doc(decoded.uid).get();
  return profile.data()?.role === "teacher" || profile.data()?.role === "admin" ? decoded.uid : null;
}

async function ownsClass(uid: string, classId: string) {
  const classDoc = await adminDb!.collection("classes").doc(classId).get();
  return classDoc.exists && (classDoc.data()?.teacherId === uid);
}

export async function POST(request: NextRequest) {
  try {
    const uid = await teacherId(request);
    if (!uid) return NextResponse.json({ error: "Öğretmen oturumu doğrulanamadı." }, { status: 401 });
    const body = await request.json();
    const {
      action,
      classId,
      membershipId,
      studentId,
      name,
      email,
      username,
      password,
      educationLevel = "middle",
    } = body;
    if (!classId || !(await ownsClass(uid, classId))) return NextResponse.json({ error: "Bu sınıf için yetkiniz yok." }, { status: 403 });

    if (action === "create") {
      const normalizedUsername = normalizeStudentUsername(String(username || ""));
      if (!name || !normalizedUsername || !password || String(password).length < 6) {
        return NextResponse.json({ error: "Ad, kullanıcı adı ve en az 6 karakterli parola zorunludur." }, { status: 400 });
      }
      const existing = await adminDb!.collection("classMemberships").where("classId", "==", classId).where("studentUsername", "==", normalizedUsername).limit(1).get();
      if (!existing.empty) return NextResponse.json({ error: "Bu kullanıcı adı sınıfta zaten kullanılıyor." }, { status: 409 });
      const email = studentLoginEmail(classId, normalizedUsername);
      const student = await adminAuth!.createUser({ email, password, displayName: name, emailVerified: false });
      const now = new Date().toISOString();
      await adminDb!.collection("users").doc(student.uid).set({
        uid: student.uid, displayName: name, email, role: "learner", educationLevel,
        preferences: { fontSize: 18, lineHeight: 1.8, fontFamily: "serif", theme: "light", columnWidth: "normal", soundEnabled: true },
        status: "active", createdAt: now, updatedAt: now,
      });
      const membership = await adminDb!.collection("classMemberships").add({
        classId, userId: student.uid, studentName: name, studentUsername: normalizedUsername, joinedAt: now, status: "active",
      });
      return NextResponse.json({ studentId: student.uid, membershipId: membership.id });
    }

    if (action === "update") {
      if (!membershipId || !studentId || !name || !email) return NextResponse.json({ error: "Öğrenci bilgileri eksik." }, { status: 400 });
      await adminAuth!.updateUser(studentId, { email, displayName: name, ...(password ? { password } : {}) });
      await adminDb!.collection("users").doc(studentId).update({ displayName: name, email, updatedAt: new Date().toISOString() });
      await adminDb!.collection("classMemberships").doc(membershipId).update({ studentName: name, studentEmail: email });
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      if (!membershipId || !studentId) return NextResponse.json({ error: "Öğrenci kaydı eksik." }, { status: 400 });
      await adminDb!.collection("classMemberships").doc(membershipId).delete();
      await adminDb!.collection("users").doc(studentId).delete();
      await adminAuth!.deleteUser(studentId);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    const errorMessage = code === "auth/email-already-exists" ? "Bu e-posta adresi zaten kullanılıyor." : "Öğrenci işlemi tamamlanamadı.";
    console.error("Teacher student API:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
