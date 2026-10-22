/**
 * AndaOku — Başlangıç Sınavı ve Seviye Belirleme Servisi
 * Veri akışı, öğrenci soru sunumu (cevap anahtarı gizlenmiş), güvenli değerlendirme ve yönetim CRUD işlemleri.
 */

import {
  PlacementExam,
  PlacementPassage,
  PlacementQuestion,
  PlacementAttempt,
  PlacementResponse,
  PlacementProfile,
  EducationLevel,
} from "../types";
import {
  SEED_PLACEMENT_EXAMS,
  SEED_PLACEMENT_PASSAGES,
  SEED_PLACEMENT_QUESTIONS,
} from "./placementSeedData";
import { countTurkishWords, calculateWpm, calculateComprehensionScore } from "../utils/readingMetrics";
import { db } from "../firebase/client";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { isFirebaseConfigured } from "../firebase/client";

// Local storage önbelleği (Firestore çevrimdışıyken veya demo modunda)
const STORAGE_KEY_EXAMS = "andaoku_placement_exams";
const STORAGE_KEY_PASSAGES = "andaoku_placement_passages";
const STORAGE_KEY_QUESTIONS = "andaoku_placement_questions";
const STORAGE_KEY_ATTEMPTS = "andaoku_placement_attempts";

function assertFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase yapılandırması eksik. Veritabanı işlemi yapılamıyor.");
  }
}

function omitUndefinedFields<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)
  ) as Partial<T>;
}

export async function getPlacementExamsFromDatabase(): Promise<PlacementExam[]> {
  assertFirebaseConfigured();
  const snapshot = await getDocs(collection(db, "placementExams"));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as PlacementExam));
}

export async function getPlacementPassageFromDatabase(
  passageId: string
): Promise<PlacementPassage | null> {
  assertFirebaseConfigured();
  const snapshot = await getDoc(doc(db, "placementPassages", passageId));
  return snapshot.exists()
    ? ({ id: snapshot.id, ...snapshot.data() } as PlacementPassage)
    : null;
}

export async function getPlacementQuestionsFromDatabase(
  examCode: string
): Promise<PlacementQuestion[]> {
  assertFirebaseConfigured();
  const questionsQuery = query(
    collection(db, "placementQuestions"),
    where("examId", "==", examCode),
    orderBy("order", "asc")
  );
  const snapshot = await getDocs(questionsQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as PlacementQuestion));
}

export async function savePlacementExamPackageToDatabase(input: {
  exam: PlacementExam;
  passage: PlacementPassage;
  questions: PlacementQuestion[];
}): Promise<void> {
  assertFirebaseConfigured();
  const existingQuestionsQuery = query(
    collection(db, "placementQuestions"),
    where("examId", "==", input.exam.code)
  );
  const existingQuestions = await getDocs(existingQuestionsQuery);
  const batch = writeBatch(db);
  const { exam, passage, questions } = input;
  const questionIds = new Set(questions.map((question) => question.id));

  batch.set(doc(db, "placementPassages", passage.id), omitUndefinedFields(passage));
  batch.set(doc(db, "placementExams", exam.code), omitUndefinedFields(exam));
  existingQuestions.docs.forEach((existingQuestion) => {
    if (!questionIds.has(existingQuestion.id)) {
      batch.delete(existingQuestion.ref);
    }
  });
  questions.forEach((question) => {
    batch.set(doc(db, "placementQuestions", question.id), {
      ...omitUndefinedFields(question),
      examId: exam.code,
    });
  });

  await batch.commit();
}

export async function deletePlacementExamPackageFromDatabase(exam: PlacementExam): Promise<void> {
  assertFirebaseConfigured();
  const [existingQuestions, examsUsingPassage] = await Promise.all([
    getDocs(query(collection(db, "placementQuestions"), where("examId", "==", exam.code))),
    getDocs(query(collection(db, "placementExams"), where("passageId", "==", exam.passageId))),
  ]);
  const batch = writeBatch(db);

  batch.delete(doc(db, "placementExams", exam.code));
  if (examsUsingPassage.docs.every((otherExam) => otherExam.id === exam.code)) {
    batch.delete(doc(db, "placementPassages", exam.passageId));
  }
  existingQuestions.docs.forEach((question) => batch.delete(question.ref));

  await batch.commit();
}

/**
 * Kullanıcının eğitim kademesine göre uygun başlangıç sınavını getirir.
 */
export async function getPlacementExamByLevel(
  educationLevel: EducationLevel
): Promise<{ exam: PlacementExam; passage: PlacementPassage } | null> {
  const allExams = await getAllPlacementExams();
  // Yayınlanmış ve eğitim kademesini içeren sınavı bul
  const matchingExam = allExams.find(
    (e) =>
      e.status === "published" &&
      (e.learningStage === undefined || e.learningStage === "placement_exam") &&
      e.educationLevels.includes(educationLevel)
  );

  if (!matchingExam) return null;

  const passage = await getPlacementPassageById(matchingExam.passageId);
  if (!passage) return null;

  return { exam: matchingExam, passage };
}

/**
 * Sınav sorularını öğrenciye sunmak üzere getirir.
 * GÜVENLİK İLKESİ: Öğrenci için 'correctOptionId' alanı kaldırılır!
 */
export async function getStudentPlacementQuestions(
  examCode: string
): Promise<Omit<PlacementQuestion, "correctOptionId">[]> {
  const allQuestions = await getQuestionsByExamCode(examCode);
  // Doğru cevap anahtarını öğrenciye giden veriden temizle
  return allQuestions.map((q) => {
    const { correctOptionId, ...sanitized } = q;
    return sanitized;
  });
}

/**
 * Yönetici veya değerlendirme motoru için tüm soruları (cevap anahtarıyla birlikte) getirir.
 */
export async function getQuestionsByExamCode(examCode: string): Promise<PlacementQuestion[]> {
  try {
    if (process.env.NODE_ENV !== "test" && db) {
      const qRef = collection(db, "placementQuestions");
      const qQuery = query(qRef, where("examId", "==", examCode), orderBy("order", "asc"));
      const snapshot = await getDocs(qQuery);
      if (!snapshot.empty) {
        const list: PlacementQuestion[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as PlacementQuestion));
        return list;
      }
    }
  } catch (e) {}

  // LocalStorage kontrolü
  if (typeof window !== "undefined") {
    const local = localStorage.getItem(`${STORAGE_KEY_QUESTIONS}_${examCode}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }
  }

  // Varsayılan Seed verisi
  return SEED_PLACEMENT_QUESTIONS[examCode] || [];
}

/**
 * Tüm başlangıç sınavlarını getirir (Yönetim paneli ve eşleme için).
 */
export async function getAllPlacementExams(): Promise<PlacementExam[]> {
  try {
    if (process.env.NODE_ENV !== "test" && db) {
      const ref = collection(db, "placementExams");
      const snapshot = await getDocs(ref);
      if (!snapshot.empty) {
        const list: PlacementExam[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as PlacementExam));
        return list;
      }
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    const local = localStorage.getItem(STORAGE_KEY_EXAMS);
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }
  }

  return SEED_PLACEMENT_EXAMS;
}

export async function getPlacementPassageById(passageId: string): Promise<PlacementPassage | null> {
  try {
    if (process.env.NODE_ENV !== "test" && db) {
      const docRef = doc(db, "placementPassages", passageId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as PlacementPassage;
      }
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    const local = localStorage.getItem(`${STORAGE_KEY_PASSAGES}_${passageId}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }
  }

  return SEED_PLACEMENT_PASSAGES.find((p) => p.id === passageId) || null;
}

/**
 * Güvenli Sınav Değerlendirme Fonksiyonu
 * Öğrencinin yanıtlarını cevap anahtarıyla karşılaştırır, WPM ve Anlama yüzdesini ayrı ayrı hesaplar.
 */
export async function evaluatePlacementAttempt(input: {
  userId: string;
  examCode: string;
  passageId: string;
  readingDurationSeconds: number;
  questionDurationSeconds: number;
  userAnswers: Record<string, string>; // questionId -> selectedOptionId ("A", "B", "C", "D")
}): Promise<{
  attempt: PlacementAttempt;
  responses: PlacementResponse[];
  recommendations: {
    status: string;
    feedback: string;
    suggestedAction: string;
    recommendedModuleIds: string[];
  };
}> {
  const { userId, examCode, passageId, readingDurationSeconds, questionDurationSeconds, userAnswers } = input;

  const passage = await getPlacementPassageById(passageId);
  const questions = await getQuestionsByExamCode(examCode);
  if (questions.length === 0) {
    throw new Error("Sınavda değerlendirilecek soru bulunamadı.");
  }

  const wordCount = passage ? passage.wordCount || countTurkishWords(passage.content) : 150;
  // WPM yalnızca okuma süresi üzerinden hesaplanır! Soru süresi dahil edilmez.
  const rawWpm = calculateWpm(wordCount, readingDurationSeconds || 1);

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const responses: PlacementResponse[] = [];
  const attemptId = `att-${Date.now()}`;

  questions.forEach((q) => {
    const selected = userAnswers[q.id];
    let isCorrect = false;

    if (!selected) {
      unansweredCount++;
    } else if (selected === q.correctOptionId) {
      isCorrect = true;
      correctCount++;
    } else {
      incorrectCount++;
    }

    responses.push({
      attemptId,
      userId,
      questionId: q.id,
      selectedOptionId: selected || "",
      isCorrect,
      pointsAwarded: isCorrect ? (q.points || 10) : 0,
      answeredAt: new Date().toISOString(),
    });
  });

  const comprehensionPercentage = calculateComprehensionScore(correctCount, questions.length);

  const attempt: PlacementAttempt = {
    id: attemptId,
    userId,
    examId: examCode,
    examVersion: 1,
    passageId,
    passageVersion: 1,
    startedAt: new Date(Date.now() - (readingDurationSeconds + questionDurationSeconds) * 1000).toISOString(),
    readingStartedAt: new Date(Date.now() - (readingDurationSeconds + questionDurationSeconds) * 1000).toISOString(),
    readingCompletedAt: new Date(Date.now() - questionDurationSeconds * 1000).toISOString(),
    questionsStartedAt: new Date(Date.now() - questionDurationSeconds * 1000).toISOString(),
    submittedAt: new Date().toISOString(),
    readingDurationSeconds,
    questionDurationSeconds,
    wordCount,
    rawWpm,
    correctCount,
    incorrectCount,
    unansweredCount,
    gradableQuestionCount: questions.length,
    comprehensionPercentage,
    status: "completed",
    createdAt: new Date().toISOString(),
  };

  // Sonuçları Firestore'a ve LocalStorage'a kaydet
  try {
    if (process.env.NODE_ENV !== "test" && db) {
      await setDoc(doc(db, "placementAttempts", attemptId), {
        ...attempt,
        serverCreatedAt: serverTimestamp(),
      });
      // Kullanıcı profil özetini güncelle
      await setDoc(
        doc(db, "placementProfiles", userId),
        {
          userId,
          latestAttemptId: attemptId,
          latestRawWpm: rawWpm,
          latestComprehensionPercentage: comprehensionPercentage,
          latestAssessmentAt: new Date().toISOString(),
          profileStatus: "evaluated",
          recommendedModuleIds: comprehensionPercentage < 65 ? ["modul-7", "modul-8"] : ["modul-2", "modul-4"],
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } catch (e) {
    console.warn("Firestore placementAttempt kaydedilirken uyarı:", e);
  }

  // LocalStorage yedeği
  if (typeof window !== "undefined") {
    const existingStr = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
    const existingList = existingStr ? JSON.parse(existingStr) : [];
    localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify([attempt, ...existingList]));
  }

  // Pedagojik Öneri ve Geri Bildirim
  let feedback = "";
  let suggestedAction = "";
  let recommendedModuleIds: string[] = [];

  if (comprehensionPercentage < 60) {
    feedback = "Okuma hızınız iyi olsa bile, anlamadan hızlı okumak hedeflenen okuma kazanımını sağlamaz. Önceliğiniz metin yapısını kavramak ve ana fikre odaklanmak olmalıdır.";
    suggestedAction = "Modül 7 (Okuduğunu Derinlemesine Anlama) etkinliklerine başlayın.";
    recommendedModuleIds = ["modul-7", "modul-8"];
  } else if (rawWpm < 150 && comprehensionPercentage >= 80) {
    feedback = "Tebrikler! Anlama düzeyiniz mükemmel (%80+). Artık kelime gruplarıyla okuma teknikleriyle hızınızı güvenle artırabilirsiniz.";
    suggestedAction = "Modül 4 (Kelime Gruplarıyla Okuma) ve Modül 2 (Görsel Dikkat) alıştırmalarına başlayın.";
    recommendedModuleIds = ["modul-2", "modul-4"];
  } else if (rawWpm >= 220 && comprehensionPercentage >= 80) {
    feedback = "Harika bir başlangıç! Hem okuma hızınız hem anlama puanınız dengeli ve yüksek bir seviyede.";
    suggestedAction = "Modül 5 (Okuma Akıcılığı ve Ritim) ile devam edin.";
    recommendedModuleIds = ["modul-5", "modul-6"];
  } else {
    feedback = "Dengeli bir okuma performansı sergilediniz. Düzenli günlük okuma çalışmalarıyla hem hızınızı hem anlama oranınızı kademeli olarak yükseltebilirsiniz.";
    suggestedAction = "Kişisel Öğrenme Yolunuzun 2. Modülüne geçin.";
    recommendedModuleIds = ["modul-2", "modul-3"];
  }

  return {
    attempt,
    responses,
    recommendations: {
      status: "evaluated",
      feedback,
      suggestedAction,
      recommendedModuleIds,
    },
  };
}

/**
 * Kullanıcının geçmiş başlangıç sınavı denemelerini getirir.
 */
export async function getUserPlacementAttempts(userId: string): Promise<PlacementAttempt[]> {
  try {
    if (process.env.NODE_ENV !== "test" && db) {
      const ref = collection(db, "placementAttempts");
      const q = query(ref, where("userId", "==", userId), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const list: PlacementAttempt[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as PlacementAttempt));
        return list;
      }
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    const local = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
    if (local) {
      try {
        const all: PlacementAttempt[] = JSON.parse(local);
        return all.filter((a) => a.userId === userId);
      } catch (e) {}
    }
  }

  return [];
}

/**
 * Yönetim Paneli: Sınavı kaydet / güncelle
 */
export async function savePlacementExam(exam: PlacementExam) {
  try {
    if (process.env.NODE_ENV !== "test" && db) {
      await setDoc(doc(db, "placementExams", exam.code), {
        ...exam,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    const all = await getAllPlacementExams();
    const index = all.findIndex((e) => e.code === exam.code);
    let updatedList = [...all];
    if (index >= 0) {
      updatedList[index] = exam;
    } else {
      updatedList.push(exam);
    }
    localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(updatedList));
  }
}

/**
 * Yönetim Paneli: Sınav sorularını kaydet / güncelle
 */
export async function savePlacementQuestions(examCode: string, questions: PlacementQuestion[]) {
  try {
    if (process.env.NODE_ENV !== "test" && db) {
      for (const q of questions) {
        await setDoc(doc(db, "placementQuestions", q.id), {
          ...q,
          examId: examCode,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    localStorage.setItem(`${STORAGE_KEY_QUESTIONS}_${examCode}`, JSON.stringify(questions));
  }
}

/**
 * Yönetim Paneli: Metni kaydet / güncelle
 */
export async function savePlacementPassage(passage: PlacementPassage) {
  try {
    if (process.env.NODE_ENV !== "test" && db) {
      await setDoc(doc(db, "placementPassages", passage.id), {
        ...passage,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    localStorage.setItem(`${STORAGE_KEY_PASSAGES}_${passage.id}`, JSON.stringify(passage));
  }
}
