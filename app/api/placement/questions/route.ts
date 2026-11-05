import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(value: unknown): string {
  return typeof value === "string"
    ? value.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ")
    : "";
}

function firestoreValue(value: Record<string, unknown> | undefined): unknown {
  if (!value) return undefined;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) {
    const values = (value.arrayValue as { values?: Record<string, unknown>[] }).values || [];
    return values.map((item) => firestoreValue(item));
  }
  if ("mapValue" in value) {
    const fields = (value.mapValue as { fields?: Record<string, Record<string, unknown>> }).fields || {};
    return Object.fromEntries(
      Object.entries(fields).map(([key, item]) => [key, firestoreValue(item)])
    );
  }
  return undefined;
}

async function getFirestoreRestCollection(
  collectionName: string,
  token: string
): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return [];

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${collectionName}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  if (!response.ok) {
    throw new Error(`Firestore REST isteği başarısız oldu (${response.status}).`);
  }

  const body = (await response.json()) as {
    documents?: Array<{ name: string; fields?: Record<string, Record<string, unknown>> }>;
  };
  return (body.documents || []).map((document) => ({
    id: document.name.split("/").pop() || "",
    data: Object.fromEntries(
      Object.entries(document.fields || {}).map(([key, value]) => [key, firestoreValue(value)])
    ),
  }));
}

async function getFirestoreRestQuery(
  collectionName: string,
  fieldPath: string,
  value: string,
  token: string
): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return [];

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: collectionName }],
          where: {
            fieldFilter: {
              field: { fieldPath },
              op: "EQUAL",
              value: { stringValue: value },
            },
          },
        },
      }),
      cache: "no-store",
    }
  );
  if (!response.ok) {
    throw new Error(`Firestore sorgusu başarısız oldu (${response.status}).`);
  }

  const rows = (await response.json()) as Array<{
    document?: { name: string; fields?: Record<string, Record<string, unknown>> };
  }>;
  return rows
    .filter((row) => row.document)
    .map((row) => ({
      id: row.document!.name.split("/").pop() || "",
      data: Object.fromEntries(
        Object.entries(row.document!.fields || {}).map(([key, item]) => [
          key,
          firestoreValue(item),
        ])
      ),
    }));
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const passageId = request.nextUrl.searchParams.get("passageId");
    if (!token || !passageId) {
      return NextResponse.json({ questions: [] }, { status: 401 });
    }

    if (adminAuth) {
      await adminAuth.verifyIdToken(token);
    }
    if (!adminAuth || !adminDb) {
      const [passages, questions, exams, placementPassages] = await Promise.all([
        getFirestoreRestCollection("readingPassages", token),
        getFirestoreRestQuery("questions", "passageId", passageId, token),
        getFirestoreRestCollection("placementExams", token),
        getFirestoreRestCollection("placementPassages", token),
      ]);
      const requestedPassage = passages.find((item) => item.id === passageId);
      const readingQuestions = questions.filter((item) => item.data.passageId === passageId);
      if (readingQuestions.length > 0) {
        return NextResponse.json({
          questions: readingQuestions.map(({ id, data: question }) => ({
            id,
            passageVersion: question.passageVersion || requestedPassage?.data.version || 1,
            questionText: question.prompt || question.questionText || "",
            options: question.options || [],
            correctOptionId: question.correctAnswer || question.correctOptionId || "",
            points: question.points || 0,
            explanation: question.explanation || "",
            questionType: question.targetSkill || question.questionType || "ana_fikir",
            status: question.status || "published",
          })),
        });
      }

      const publishedExams = exams.filter((item) => item.data.status === "published");
      const requestedData = requestedPassage?.data;
      const matchingExam = publishedExams.find((item) => {
        if (item.data.passageId === passageId) return true;
        const placementPassage = placementPassages.find(
          (passage) => passage.id === item.data.passageId
        );
        return Boolean(
          requestedData &&
          placementPassage &&
          (normalize(placementPassage.data.title) === normalize(requestedData.title) ||
            normalize(placementPassage.data.content) === normalize(requestedData.content))
        );
      });
      if (!matchingExam) return NextResponse.json({ questions: [] });
      const placementQuestions = await getFirestoreRestQuery(
        "placementQuestions",
        "examId",
        matchingExam.id,
        token
      );

      return NextResponse.json({
        questions: placementQuestions
          .filter((item) => item.data.examId === matchingExam.id)
          .sort((left, right) => Number(left.data.order || 0) - Number(right.data.order || 0))
          .map(({ id, data }) => ({ id, ...data })),
      });
    }

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
