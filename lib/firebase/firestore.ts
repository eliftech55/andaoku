import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./client";
import {
  ReadingPassage,
  LearningModule,
  Activity,
  Question,
  ReadingSession,
  AssessmentResult,
  UserProgress,
  ClassItem,
  ClassMembership,
  TeacherAssignment,
  AuditLog,
  EducationLevel,
  DifficultyLevel,
} from "../types";

// ==========================================
// 1. OKUMA METİNLERİ (readingPassages)
// ==========================================

export async function getReadingPassages(
  educationLevel?: EducationLevel,
  difficulty?: DifficultyLevel
): Promise<ReadingPassage[]> {
  try {
    const passagesRef = collection(db, "readingPassages");
    let q = query(passagesRef, where("status", "==", "published"));

    if (educationLevel) {
      q = query(q, where("educationLevels", "array-contains", educationLevel));
    }

    const snapshot = await getDocs(q);
    const list: ReadingPassage[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as ReadingPassage);
    });

    if (difficulty) {
      return list.filter((p) => p.difficulty === difficulty);
    }
    return list;
  } catch (error) {
    console.error("Metinleri getirme hatası:", error);
    return [];
  }
}

export async function getPassageById(id: string): Promise<ReadingPassage | null> {
  try {
    const docRef = doc(db, "readingPassages", id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as ReadingPassage;
    }
    return null;
  } catch (error) {
    console.error("Metin getirme hatası:", error);
    return null;
  }
}

export async function saveReadingPassage(passage: Omit<ReadingPassage, "id">, id?: string) {
  try {
    if (id) {
      const docRef = doc(db, "readingPassages", id);
      await setDoc(docRef, { ...passage, updatedAt: new Date().toISOString() }, { merge: true });
      return id;
    } else {
      const docRef = await addDoc(collection(db, "readingPassages"), {
        ...passage,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return docRef.id;
    }
  } catch (error) {
    console.error("Metin kaydetme hatası:", error);
    throw error;
  }
}

// ==========================================
// 2. ÖĞRENME MODÜLLERİ (learningModules)
// ==========================================

export async function getLearningModules(): Promise<LearningModule[]> {
  try {
    const modulesRef = collection(db, "learningModules");
    const q = query(modulesRef, orderBy("order", "asc"));
    const snapshot = await getDocs(q);
    const list: LearningModule[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as LearningModule);
    });
    return list;
  } catch (error) {
    console.error("Modülleri getirme hatası:", error);
    return [];
  }
}

export async function saveLearningModuleWithActivities(
  module: LearningModule,
  activities: Activity[]
): Promise<void> {
  const batch = writeBatch(db);
  const { id: moduleId, ...moduleData } = module;

  batch.set(doc(db, "learningModules", moduleId), moduleData);

  activities.forEach(({ id, ...activityData }) => {
    batch.set(doc(db, "activities", id), activityData);
  });

  await batch.commit();
}

// ==========================================
// 3. ETKİNLİKLER (activities)
// ==========================================

export async function getActivities(moduleId?: string): Promise<Activity[]> {
  try {
    const actRef = collection(db, "activities");
    let q = query(actRef, where("status", "==", "published"));
    if (moduleId) {
      q = query(q, where("moduleId", "==", moduleId));
    }
    const snapshot = await getDocs(q);
    const list: Activity[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as Activity);
    });
    return list;
  } catch (error) {
    console.error("Etkinlikleri getirme hatası:", error);
    return [];
  }
}

export async function getActivityById(id: string): Promise<Activity | null> {
  try {
    const docRef = doc(db, "activities", id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Activity;
    }
    return null;
  } catch (error) {
    console.error("Etkinlik getirme hatası:", error);
    return null;
  }
}

// ==========================================
// 4. ANLAMA SORULARI (questions)
// ==========================================

export async function getQuestionsForPassage(passageId: string): Promise<Question[]> {
  try {
    const qRef = collection(db, "questions");
    const q = query(qRef, where("passageId", "==", passageId));
    const snapshot = await getDocs(q);
    const list: Question[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as Question);
    });
    return list;
  } catch (error) {
    console.error("Soruları getirme hatası:", error);
    return [];
  }
}

// ==========================================
// 5. OKUMA OTURUMU & DEĞERLENDİRME SONUÇLARI
// ==========================================

export async function saveReadingSession(session: Omit<ReadingSession, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "readingSessions"), {
      ...session,
      serverCreatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Okuma oturumu kaydetme hatası:", error);
    throw error;
  }
}

export async function getUserReadingSessions(userId: string): Promise<ReadingSession[]> {
  try {
    const sessionsRef = collection(db, "readingSessions");
    const q = query(sessionsRef, where("userId", "==", userId), orderBy("createdAt", "desc"), limit(50));
    const snapshot = await getDocs(q);
    const list: ReadingSession[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as ReadingSession);
    });
    return list;
  } catch (error) {
    console.error("Oturumları getirme hatası:", error);
    return [];
  }
}

export async function saveAssessmentResult(result: Omit<AssessmentResult, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "assessmentResults"), {
      ...result,
      serverCreatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Değerlendirme kaydetme hatası:", error);
    throw error;
  }
}

export async function getUserAssessmentResults(userId: string): Promise<AssessmentResult[]> {
  try {
    const resultsRef = collection(db, "assessmentResults");
    const q = query(resultsRef, where("userId", "==", userId), orderBy("createdAt", "desc"), limit(50));
    const snapshot = await getDocs(q);
    const list: AssessmentResult[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as AssessmentResult);
    });
    return list;
  } catch (error) {
    console.error("Değerlendirme sonuçlarını getirme hatası:", error);
    return [];
  }
}

// ==========================================
// 6. KULLANICI İLERLEMESİ (userProgress)
// ==========================================

export async function getUserProgressList(userId: string): Promise<UserProgress[]> {
  try {
    const progressRef = collection(db, "userProgress");
    const q = query(progressRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const list: UserProgress[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as UserProgress);
    });
    return list;
  } catch (error) {
    console.error("İlerleme getirme hatası:", error);
    return [];
  }
}

export async function upsertUserProgress(progress: Omit<UserProgress, "id">) {
  try {
    const docId = `${progress.userId}_${progress.moduleId}`;
    const docRef = doc(db, "userProgress", docId);
    await setDoc(docRef, { ...progress, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error("İlerleme güncelleme hatası:", error);
    throw error;
  }
}

// ==========================================
// 7. ÖĞRETMEN VE SINIF YÖNETİMİ
// ==========================================

export async function getTeacherClasses(teacherId: string): Promise<ClassItem[]> {
  try {
    const classesRef = collection(db, "classes");
    const q = query(classesRef, where("teacherId", "==", teacherId));
    const snapshot = await getDocs(q);
    const list: ClassItem[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as ClassItem);
    });
    return list;
  } catch (error) {
    console.error("Sınıfları getirme hatası:", error);
    return [];
  }
}

export async function createClass(classData: Omit<ClassItem, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "classes"), {
      ...classData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Sınıf oluşturma hatası:", error);
    throw error;
  }
}

export async function getClassMemberships(classId: string): Promise<ClassMembership[]> {
  try {
    const membersRef = collection(db, "classMemberships");
    const q = query(membersRef, where("classId", "==", classId));
    const snapshot = await getDocs(q);
    const list: ClassMembership[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as ClassMembership);
    });
    return list;
  } catch (error) {
    console.error("Sınıf üyelerini getirme hatası:", error);
    return [];
  }
}

export async function getTeacherAssignments(teacherId: string): Promise<TeacherAssignment[]> {
  try {
    const assignRef = collection(db, "teacherAssignments");
    const q = query(assignRef, where("teacherId", "==", teacherId));
    const snapshot = await getDocs(q);
    const list: TeacherAssignment[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as TeacherAssignment);
    });
    return list;
  } catch (error) {
    console.error("Ödevleri getirme hatası:", error);
    return [];
  }
}

export async function createTeacherAssignment(assignment: Omit<TeacherAssignment, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "teacherAssignments"), assignment);
    return docRef.id;
  } catch (error) {
    console.error("Ödev atama hatası:", error);
    throw error;
  }
}

// ==========================================
// 8. DENETİM GÜNLÜĞÜ (auditLogs)
// ==========================================

export async function createAuditLog(log: Omit<AuditLog, "id">) {
  try {
    await addDoc(collection(db, "auditLogs"), {
      ...log,
      timestamp: new Date().toISOString(),
      serverTimestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Denetim günlüğü kaydetme hatası:", error);
  }
}
