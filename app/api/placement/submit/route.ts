import { NextRequest, NextResponse } from "next/server";
import { evaluatePlacementAttempt } from "@/lib/services/placementExamService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      examCode,
      passageId,
      readingDurationSeconds,
      questionDurationSeconds,
      userAnswers,
    } = body;

    if (!userId || !examCode || !passageId) {
      return NextResponse.json(
        { error: "Eksik parametreler: userId, examCode ve passageId zorunludur." },
        { status: 400 }
      );
    }

    // Güvenli sunucu tarafı değerlendirme
    const result = await evaluatePlacementAttempt({
      userId,
      examCode,
      passageId,
      readingDurationSeconds: Number(readingDurationSeconds) || 1,
      questionDurationSeconds: Number(questionDurationSeconds) || 1,
      userAnswers: userAnswers || {},
    });

    return NextResponse.json({
      success: true,
      attempt: result.attempt,
      recommendations: result.recommendations,
    });
  } catch (error: any) {
    console.error("Sınav değerlendirme API hatası:", error);
    return NextResponse.json(
      { error: error.message || "Sınav değerlendirilirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
