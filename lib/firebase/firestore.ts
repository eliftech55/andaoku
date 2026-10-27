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
  UserAssignment,
  AuditLog,
  EducationLevel,
  DifficultyLevel,
  ExerciseAttempt,
  ExerciseDefinition,
  ExerciseKind,
  UserProfile,
  UserRole,
} from "../types";
import { BUILT_IN_EXERCISE_DEFINITIONS } from "../services/exerciseCatalog";
import { calculateModuleScore } from "../services/moduleScoring";

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

export async function getExerciseDefinitions(): Promise<ExerciseDefinition[]> {
  const snapshot = await getDocs(collection(db, "exerciseDefinitions"));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ExerciseDefinition);
}

export async function initializeExerciseCatalog(): Promise<void> {
  const definitionsRef = collection(db, "exerciseDefinitions");
  const existing = await getDocs(definitionsRef);
  const existingIds = new Set(existing.docs.map((item) => item.id));
  const missingDefinitions = BUILT_IN_EXERCISE_DEFINITIONS.filter(
    (definition) => !existingIds.has(definition.id)
  );
  if (missingDefinitions.length === 0) return;

  const batch = writeBatch(db);
  missingDefinitions.forEach(({ id, ...definition }) => {
    batch.set(doc(db, "exerciseDefinitions", id), definition);
  });
  await batch.commit();
}

export async function saveExerciseDefinition(definition: ExerciseDefinition): Promise<void> {
  const { id, ...data } = definition;
  await setDoc(doc(db, "exerciseDefinitions", id), {
    ...data,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function assignExercisesToModule(
  moduleId: string,
  readingPassageId: string,
  exerciseTypes: ExerciseKind[],
  exerciseLevels: Partial<Record<ExerciseKind, number[]>>,
  definitions: ExerciseDefinition[]
): Promise<void> {
  if (!readingPassageId) {
    throw new Error("Modüle yayımlanmış bir okuma metni atanmalıdır.");
  }
  const moduleRef = doc(db, "learningModules", moduleId);
  const [moduleSnapshot, passageSnapshot] = await Promise.all([
    getDoc(moduleRef),
    getDoc(doc(db, "readingPassages", readingPassageId)),
  ]);
  if (!moduleSnapshot.exists()) {
    throw new Error("Seçilen modül bulunamadı.");
  }
  if (!passageSnapshot.exists() || passageSnapshot.data().status !== "published") {
    throw new Error("Modüle yalnızca yayımlanmış bir okuma metni atanabilir.");
  }

  const module = { id: moduleSnapshot.id, ...moduleSnapshot.data() } as LearningModule;
  const normalizedLevels: Partial<Record<ExerciseKind, number[]>> = {};
  for (const kind of exerciseTypes) {
    const levels = Array.from(new Set(exerciseLevels[kind] || [])).sort(
      (left, right) => left - right
    );
    if (!levels.length || levels.some((level, index) => level !== index + 1)) {
      throw new Error("Egzersiz seviyeleri 1’den başlayarak kesintisiz seçilmelidir.");
    }
    normalizedLevels[kind] = levels;
  }
  const assignedDefinitions = definitions.filter(
    (definition) =>
      exerciseTypes.includes(definition.kind) &&
      normalizedLevels[definition.kind]?.includes(definition.level) &&
      definition.status === "published"
  );
  const expectedDefinitionCount = exerciseTypes.reduce(
    (total, kind) => total + (normalizedLevels[kind]?.length || 0),
    0
  );
  if (assignedDefinitions.length !== expectedDefinitionCount) {
    throw new Error("Seçilen her egzersiz seviyesi yayımlanmış olmalıdır.");
  }

  const nextActivities: Activity[] = assignedDefinitions.map((definition) => {
    const activityId = `${moduleId}-${definition.id}`;
    const levelDifficulty: DifficultyLevel =
      definition.level <= 2 ? "beginner" : definition.level === 3 ? "intermediate" : "advanced";
    return {
      id: activityId,
      moduleId,
      title: definition.title,
      type: definition.kind,
      level: definition.level,
      description: definition.description,
      targetSkills: [definition.kind, "gorsel_dikkat"],
      difficulty: levelDifficulty,
      ageGroups: ["all"],
      educationLevels: module.educationLevel
        ? [module.educationLevel]
        : ["primary", "middle", "high", "university", "adult"],
      instructions: definition.instructions,
      contentConfig: {
        ...definition.config,
        exerciseKind: definition.kind,
        ...(definition.kind === "flash_words"
          ? { wordList: ["okuma", "dikkat", "bilgi", "anlam", "kitap", "öğrenme", "tarama", "odak"] }
          : {}),
      },
      completionRules: { requiredAccuracy: 70 },
      status: module.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const batch = writeBatch(db);
  const previousActivityIds = (module.activityIds || []) as string[];
  previousActivityIds.forEach((activityId) => {
    if (!nextActivities.some((activity) => activity.id === activityId)) {
      batch.set(doc(db, "activities", activityId), { status: "archived", updatedAt: new Date().toISOString() }, { merge: true });
    }
  });
  nextActivities.forEach(({ id, ...activity }) => {
    batch.set(doc(db, "activities", id), activity);
  });
  batch.set(moduleRef, {
    readingPassageId,
    exerciseTypes,
    exerciseLevels: normalizedLevels,
    activityIds: nextActivities.map((activity) => activity.id),
    requiredCompletionScore: 70,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
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

export async function getUserExerciseAttempts(userId: string): Promise<ExerciseAttempt[]> {
  const snapshot = await getDocs(
    query(collection(db, "exerciseAttempts"), where("userId", "==", userId))
  );
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }) as ExerciseAttempt)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function getBestExerciseScoresForModule(
  attempts: ExerciseAttempt[],
  moduleId: string,
  module: LearningModule | null
): Partial<Record<ExerciseKind, number>> {
  const bestScores: Partial<Record<ExerciseKind, number>> = {};
  for (const attempt of attempts) {
    if (attempt.moduleId !== moduleId) continue;
    if (module?.activityIds && !module.activityIds.includes(attempt.activityId)) continue;
    bestScores[attempt.exerciseKind] = Math.max(
      bestScores[attempt.exerciseKind] || 0,
      attempt.score
    );
  }
  return bestScores;
}

export async function saveExerciseAttempt(
  attempt: Omit<ExerciseAttempt, "id">
): Promise<ExerciseAttempt> {
  const attemptRef = doc(collection(db, "exerciseAttempts"));
  await setDoc(attemptRef, attempt);

  try {
    const [moduleSnapshot, progressSnapshot, attempts] = await Promise.all([
      getDoc(doc(db, "learningModules", attempt.moduleId)),
      getDoc(doc(db, "userProgress", `${attempt.userId}_${attempt.moduleId}`)),
      getUserExerciseAttempts(attempt.userId),
    ]);
    const module = moduleSnapshot.exists()
      ? ({ id: moduleSnapshot.id, ...moduleSnapshot.data() } as LearningModule)
      : null;
    const existingProgress = progressSnapshot.exists()
      ? (progressSnapshot.data() as UserProgress)
      : null;
    const bestExerciseScores = getBestExerciseScoresForModule(
      attempts,
      attempt.moduleId,
      module
    );

    const score = calculateModuleScore({
      readingScore: existingProgress?.readingScore,
      exerciseTypes: module?.exerciseTypes || [],
      bestExerciseScores,
    });
    const now = new Date().toISOString();
    await setDoc(doc(db, "userProgress", `${attempt.userId}_${attempt.moduleId}`), {
      userId: attempt.userId,
      moduleId: attempt.moduleId,
      activityId: attempt.activityId,
      status: score.isComplete ? "completed" : "in_progress",
      completionPercentage: score.overallScore ?? score.exerciseScore,
      attemptCount: (existingProgress?.attemptCount || 0) + 1,
      exerciseScore: score.exerciseScore,
      overallScore: score.overallScore,
      bestExerciseScores,
      lastActivityAt: now,
      updatedAt: now,
    }, { merge: true });
  } catch (error) {
    console.error("Egzersiz kaydedildi ancak modül ilerlemesi güncellenemedi:", error);
    throw error;
  }

  return { id: attemptRef.id, ...attempt };
}

export async function saveModuleReadingScore(
  userId: string,
  moduleId: string,
  readingScore: number
): Promise<void> {
  const [moduleSnapshot, progressSnapshot, attempts] = await Promise.all([
    getDoc(doc(db, "learningModules", moduleId)),
    getDoc(doc(db, "userProgress", `${userId}_${moduleId}`)),
    getUserExerciseAttempts(userId),
  ]);
  const module = moduleSnapshot.exists()
    ? ({ id: moduleSnapshot.id, ...moduleSnapshot.data() } as LearningModule)
    : null;
  const existingProgress = progressSnapshot.exists()
    ? (progressSnapshot.data() as UserProgress)
    : null;
  const bestReadingScore = Math.max(existingProgress?.readingScore || 0, readingScore);
  const bestExerciseScores = getBestExerciseScoresForModule(attempts, moduleId, module);
  const score = calculateModuleScore({
    readingScore: bestReadingScore,
    exerciseTypes: module?.exerciseTypes || [],
    bestExerciseScores,
  });
  const now = new Date().toISOString();
  await setDoc(doc(db, "userProgress", `${userId}_${moduleId}`), {
    userId,
    moduleId,
    status: score.isComplete ? "completed" : "in_progress",
    completionPercentage: score.overallScore ?? score.exerciseScore,
    attemptCount: (existingProgress?.attemptCount || 0) + 1,
    readingScore: bestReadingScore,
    exerciseScore: score.exerciseScore,
    overallScore: score.overallScore,
    bestExerciseScores,
    lastActivityAt: now,
    updatedAt: now,
  }, { merge: true });
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

export async function getAllUserProfiles(): Promise<UserProfile[]> {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    return snapshot.docs.map((item) => item.data() as UserProfile);
  } catch (error) {
    console.error("Kullanıcı profilleri getirilemedi:", error);
    throw error;
  }
}

export async function updateUserStatus(
  userId: string,
  status: UserProfile["status"]
): Promise<void> {
  try {
    await updateDoc(doc(db, "users", userId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Kullanıcı durumu güncellenemedi:", error);
    throw error;
  }
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  try {
    await updateDoc(doc(db, "users", userId), {
      role,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Kullanıcı rolü güncellenemedi:", error);
    throw error;
  }
}

export async function createUserAssignment(
  assignment: Omit<UserAssignment, "id">
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "userAssignments"), assignment);
    return docRef.id;
  } catch (error) {
    console.error("Kullanıcı görevi oluşturulamadı:", error);
    throw error;
  }
}

export async function getUserAssignments(userId: string): Promise<UserAssignment[]> {
  try {
    const snapshot = await getDocs(
      query(collection(db, "userAssignments"), where("userId", "==", userId))
    );
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as UserAssignment);
  } catch (error) {
    console.error("Kullanıcı görevleri getirilemedi:", error);
    throw error;
  }
}

export async function updateUserAssignment(
  assignmentId: string,
  changes: Pick<UserAssignment, "title" | "dueAt" | "status">
): Promise<void> {
  try {
    await updateDoc(doc(db, "userAssignments", assignmentId), changes);
  } catch (error) {
    console.error("Kullanıcı görevi güncellenemedi:", error);
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
