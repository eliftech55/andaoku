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

export async function fetchAllModules(): Promise<LearningModule[]> {
  try {
    const list = await getLearningModulesFirestore();
    if (list && list.length > 0) return list;
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

export async function fetchPassageById(id: string): Promise<ReadingPassage | null> {
  try {
    const p = await getPassageByIdFirestore(id);
    if (p) return p;
  } catch (e) {}
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

export async function fetchQuestionsForPassage(passageId: string): Promise<Question[]> {
  try {
    const list = await getQuestionsFirestore(passageId);
    if (list && list.length > 0) return list;
  } catch (e) {}
  return SEED_QUESTIONS.filter((q) => q.passageId === passageId);
}
