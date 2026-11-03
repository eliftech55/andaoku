import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const passageId = request.nextUrl.searchParams.get("passageId");
    if (!token || !passageId || !adminAuth || !adminDb) {
      return NextResponse.json({ questions: [] }, { status: 401 });
    }

    await adminAuth.verifyIdToken(token);
    const examSnapshot = await adminDb
      .collection("placementExams")
      .where("passageId", "==", passageId)
      .where("status", "==", "published")
      .limit(1)
      .get();
    const exam = examSnapshot.docs[0];
    if (!exam) return NextResponse.json({ questions: [] });

    const questionSnapshot = await adminDb
      .collection("placementQuestions")
      .where("examId", "==", exam.id)
      .orderBy("order", "asc")
      .get();

    return NextResponse.json({
      questions: questionSnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })),
    });
  } catch (error) {
    console.error("Okuma soruları API hatası:", error);
    return NextResponse.json({ questions: [] }, { status: 500 });
  }
}
