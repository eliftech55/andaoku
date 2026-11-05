import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(value: unknown): string {
  return typeof value === "string"
    ? value.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ")
    : "";
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const passageId = request.nextUrl.searchParams.get("passageId");
    if (!token || !passageId || !adminAuth || !adminDb) {
      return NextResponse.json({ questions: [] }, { status: 401 });
    }

    await adminAuth.verifyIdToken(token);
    const database = adminDb;
    const [requestedPassage, examSnapshot] = await Promise.all([
      database.collection("readingPassages").doc(passageId).get(),
      database.collection("placementExams").where("status", "==", "published").get(),
    ]);
    const requestedData = requestedPassage.exists ? requestedPassage.data() : undefined;
    const readingQuestionSnapshot = await database
      .collection("questions")
      .where("passageId", "==", passageId)
      .get();
    if (!readingQuestionSnapshot.empty) {
      return NextResponse.json({
        questions: readingQuestionSnapshot.docs.map((item) => {
          const question = item.data();
          return {
            id: item.id,
            passageVersion: question.passageVersion || requestedData?.version || 1,
            questionText: question.prompt || question.questionText || "",
            options: question.options || [],
            correctOptionId: question.correctAnswer || question.correctOptionId || "",
            points: question.points || 0,
            explanation: question.explanation || "",
            questionType: question.targetSkill || question.questionType || "ana_fikir",
            status: question.status || "published",
          };
        }),
      });
    }

    const exams = examSnapshot.docs.filter((item) => {
      const exam = item.data();
      if (exam.passageId === passageId) return true;
      return false;
    });

    let matchingExam: Array<typeof examSnapshot.docs[number] | null> = [];
    if (!exams[0] && requestedData) {
      matchingExam = await Promise.all(
        examSnapshot.docs.map(async (item) => {
          const passage = await database
            .collection("placementPassages")
            .doc(String(item.data().passageId || ""))
            .get();
          const data = passage.data();
          return data &&
            (normalize(data.title) === normalize(requestedData.title) ||
              normalize(data.content) === normalize(requestedData.content))
            ? item
            : null;
        })
      );
    }
    const exam = exams[0] || matchingExam.find((item) => item !== null);
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
