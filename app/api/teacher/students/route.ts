import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { normalizeStudentUsername, studentLoginEmail } from "@/lib/studentCredentials";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) return NextResponse.json({ error: "Veritabanı yapılandırılmamış." }, { status: 503 });
    const classCode = request.nextUrl.searchParams.get("classCode")?.trim().toUpperCase();
    const username = request.nextUrl.searchParams.get("username");
    if (!classCode) return NextResponse.json({ error: "Sınıf kodu gerekli." }, { status: 400 });
    const classSnapshot = await adminDb.collection("classes").where("classCode", "==", classCode).limit(1).get();
    if (classSnapshot.empty) return NextResponse.json({ error: "Sınıf bulunamadı." }, { status: 404 });
    const classId = classSnapshot.docs[0].id;
    const memberships = await adminDb.collection("classMemberships")
      .where("classId", "==", classId).where("status", "==", "active").get();
    const students = memberships.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, username: data.studentUsername, name: data.studentName };
    }).filter((student) => typeof student.username === "string" && student.username);
    if (username) {
      const normalized = normalizeStudentUsername(username);
      return NextResponse.json({ available: !students.some((student) => student.username === normalized) });
    }
    return NextResponse.json({ classId, students });
  } catch (error) {
    console.error("Öğrenci kullanıcı adı sorgusu:", error);
    return NextResponse.json({ error: "Öğrenci bilgileri alınamadı." }, { status: 500 });
  }
}

async function teacherId(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!adminAuth || !adminDb) {
    throw new Error("Firebase Admin SDK yapılandırılmamış. FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL ve FIREBASE_PRIVATE_KEY değişkenlerini tanımlayın.");
  }
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch (error) {
    console.error("Öğretmen Firebase oturumu doğrulanamadı:", error);
    return null;
  }
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
      if (!membershipId || !studentId || !name || !username) return NextResponse.json({ error: "Öğrenci bilgileri eksik." }, { status: 400 });
      const normalizedUsername = normalizeStudentUsername(String(username));
      const duplicate = await adminDb!.collection("classMemberships").where("classId", "==", classId).where("studentUsername", "==", normalizedUsername).get();
      if (duplicate.docs.some((doc) => doc.id !== membershipId)) return NextResponse.json({ error: "Bu kullanıcı adı sınıfta zaten kullanılıyor." }, { status: 409 });
      const studentEmail = studentLoginEmail(classId, normalizedUsername);
      await adminAuth!.updateUser(studentId, { email: studentEmail, displayName: name, ...(password ? { password } : {}) });
      await adminDb!.collection("users").doc(studentId).update({ displayName: name, email: studentEmail, updatedAt: new Date().toISOString() });
      await adminDb!.collection("classMemberships").doc(membershipId).update({ studentName: name, studentUsername: normalizedUsername });
      return NextResponse.json({ ok: true });
    }

    if (action === "resetPassword") {
      if (!membershipId || !studentId || !password || String(password).length < 6) {
        return NextResponse.json({ error: "En az 6 karakterli yeni parola zorunludur." }, { status: 400 });
      }
      await adminAuth!.updateUser(studentId, { password: String(password) });
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
    if (error instanceof Error && error.message.startsWith("Firebase Admin SDK yapılandırılmamış")) {
      console.error(error.message);
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    const errorMessage = code === "auth/email-already-exists" ? "Bu e-posta adresi zaten kullanılıyor." : "Öğrenci işlemi tamamlanamadı.";
    console.error("Teacher student API:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
