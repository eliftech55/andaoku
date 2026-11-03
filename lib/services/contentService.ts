/**
 * AndaOku — İçerik ve Veri Servisi
 * Firestore'a bağlı olarak çalışır, Firestore henüz boş veya çevrimdışı ise
 * SEED verilerini güvenli bir başlangıç noktası olarak sunar.
 */

import {
  getReadingPassages,
  getPassageById as getPassageByIdFirestore,
  getLearningModules as getLearningModulesFirestore,
  getActivities as getActivitiesFirestore,
  getActivityById as getActivityByIdFirestore,
  getQuestionsForPassage as getQuestionsFirestore,
  saveReadingPassage as savePassageFirestore,
} from "../firebase/firestore";
import {
  SEED_MODULES,
  SEED_PASSAGES,
  SEED_QUESTIONS,
  SEED_ACTIVITIES,
} from "./seedData";
import {
  ReadingPassage,
  LearningModule,
  Activity,
  Question,
  EducationLevel,
  DifficultyLevel,
} from "../types";
import {
  getAllPlacementExams,
  getPublishedPlacementPackages,
  getPlacementPassageById,
  getStudentPlacementQuestions,
} from "./placementExamService";

export async function fetchAllModules(): Promise<LearningModule[]> {
  try {
    const list = await getLearningModulesFirestore();
    if (list && list.length > 0) return list.filter((module) => module.status === "published");
  } catch (e) {
    console.warn("Firestore'dan modüller alınamadı, başlangıç paketi kullanılıyor.");
  }
  return SEED_MODULES;
}

export async function fetchPassages(
  level?: EducationLevel,
  difficulty?: DifficultyLevel
): Promise<ReadingPassage[]> {
  try {
    const list = await getReadingPassages(level, difficulty);
    if (list && list.length > 0) return list;
  } catch (e) {
    console.warn("Firestore'dan metinler alınamadı, başlangıç paketi kullanılıyor.");
  }

  let filtered = [...SEED_PASSAGES];
  if (level) {
    filtered = filtered.filter((p) => p.educationLevels.includes(level));
  }
  if (difficulty) {
    filtered = filtered.filter((p) => p.difficulty === difficulty);
  }
  return filtered;
}

export async function fetchExerciseContent(): Promise<
  { passage: ReadingPassage; questions: Question[] }[]
> {
  const packages = await getPublishedPlacementPackages();

  return packages.map(({ exam, passage, questions }) => ({
    passage: {
      id: passage.id,
      title: passage.title,
      content: passage.content,
      wordCount: passage.wordCount,
      educationLevels: passage.educationLevels,
      learningStage: "exercises",
      ageGroups: passage.ageGroups,
      difficulty: passage.difficulty,
      genre:
        passage.genre === "bilgilendirici" ||
        passage.genre === "oykuleyici" ||
        passage.genre === "aciklayici" ||
        passage.genre === "akademik" ||
        passage.genre === "diger"
          ? passage.genre
          : "diger",
      topic: passage.topic,
      targetSkills: exam.targetSkills,
      estimatedReadingTime: exam.estimatedReadingSeconds,
      status: exam.status,
      version: passage.version,
      createdBy: passage.createdBy,
      createdAt: passage.createdAt,
      updatedAt: passage.updatedAt,
      publishedAt: exam.publishedAt,
    },
    questions: questions.map((question) => ({
      id: question.id,
      passageId: passage.id,
      passageVersion: question.passageVersion,
      questionType: "multiple_choice",
      prompt: question.questionText,
      options: question.options,
      correctAnswer: question.correctOptionId,
      points: question.points,
      explanation: question.explanation,
      targetSkill: question.questionType,
      status: question.status,
    })),
  }));
}

export async function fetchPassageById(id: string): Promise<ReadingPassage | null> {
  try {
    const p = await getPassageByIdFirestore(id);
    if (p) return p;
  } catch (e) {}

  const placementPassage = await getPlacementPassageById(id);
  if (placementPassage) {
    return {
      ...placementPassage,
      genre:
        placementPassage.genre === "bilgilendirici" ||
        placementPassage.genre === "oykuleyici" ||
        placementPassage.genre === "aciklayici" ||
        placementPassage.genre === "akademik" ||
        placementPassage.genre === "diger"
          ? placementPassage.genre
          : "diger",
      targetSkills: [],
      estimatedReadingTime: 0,
    };
  }

  return SEED_PASSAGES.find((p) => p.id === id) || null;
}

export async function fetchActivities(moduleId?: string): Promise<Activity[]> {
  try {
    const list = await getActivitiesFirestore(moduleId);
    if (list && list.length > 0) return list;
  } catch (e) {}

  if (moduleId) {
    return SEED_ACTIVITIES.filter((a) => a.moduleId === moduleId);
  }
  return SEED_ACTIVITIES;
}

export async function fetchActivityById(id: string): Promise<Activity | null> {
  try {
    const act = await getActivityByIdFirestore(id);
    if (act) return act;
  } catch (e) {}
  return SEED_ACTIVITIES.find((a) => a.id === id) || null;
}

export async function fetchQuestionsForPassage(
  passageId: string,
  accessToken?: string
): Promise<Question[]> {
  try {
    const list = await getQuestionsFirestore(passageId);
    if (list && list.length > 0) return list;
  } catch (e) {}

  try {
    if (accessToken) {
      const response = await fetch(
        `/api/placement/questions?passageId=${encodeURIComponent(passageId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
      );
      if (response.ok) {
        const data = (await response.json()) as {
          questions?: Array<{
            id: string;
            passageVersion: number;
            questionText: string;
            options: Question["options"];
            correctOptionId: string;
            points: number;
            explanation: string;
            questionType: string;
            status: Question["status"];
          }>;
        };
        if (data.questions?.length) {
          return data.questions.map((question) => ({
            id: question.id,
            passageId,
            passageVersion: question.passageVersion,
            questionType: "multiple_choice",
            prompt: question.questionText,
            options: question.options,
            correctAnswer: question.correctOptionId,
            points: question.points,
            explanation: question.explanation,
            targetSkill: question.questionType,
            status: question.status,
          }));
        }
      }
    }

    const packages = await getPublishedPlacementPackages();
    const passage = await fetchPassageById(passageId);
    const normalize = (value: string) =>
      value.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
    const packageContent = packages.find((content) =>
      content.passage.id === passageId ||
      (passage &&
        (normalize(content.passage.title) === normalize(passage.title) ||
          normalize(content.passage.content) === normalize(passage.content)))
    );
    if (packageContent?.questions.length) {
      return packageContent.questions.map((question) => ({
        id: question.id,
        passageId,
        passageVersion: question.passageVersion,
        questionType: "multiple_choice",
        prompt: question.questionText,
        options: question.options,
        correctAnswer: question.correctOptionId,
        points: question.points,
        explanation: question.explanation,
        targetSkill: question.questionType,
        status: question.status,
      }));
    }

    const exam = (await getAllPlacementExams()).find((item) => item.passageId === passageId);
    if (exam) {
      const placementQuestions = await getStudentPlacementQuestions(exam.code);
      if (placementQuestions.length > 0) {
        return placementQuestions.map((question) => ({
          id: question.id,
          passageId,
          passageVersion: question.passageVersion,
          questionType: "multiple_choice",
          prompt: question.questionText,
          options: question.options,
          correctAnswer: "",
          points: question.points,
          explanation: question.explanation,
          targetSkill: question.questionType,
          status: question.status,
        }));
      }
    }
  } catch (e) {
    console.warn("Yayınlanmış sınav soruları alınamadı, başlangıç soruları denenecek.");
  }

  return SEED_QUESTIONS.filter((q) => q.passageId === passageId);
}
