/**
 * AndaOku — TypeScript Tipleri ve Veri Modelleri
 * "Daha bilinçli oku, daha iyi anla."
 */

export type UserRole = "learner" | "teacher" | "content_manager" | "admin" | "researcher";

export type EducationLevel = "primary" | "middle" | "high" | "university" | "adult";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export type ContentStatus = "draft" | "published" | "archived";

export type AssessmentType = "pretest" | "interim" | "posttest" | "followup" | "practice";

export type ActivityType =
  | "assessment"
  | "visual_attention"
  | "word_recognition"
  | "chunk_reading"
  | "fluency"
  | "skimming"
  | "comprehension"
  | "strategy"
  | "integrated";

export interface UserPreferences {
  fontSize: number; // 16 to 28 px
  lineHeight: number; // 1.4 to 2.2
  fontFamily: "sans" | "serif" | "dyslexic";
  theme: "light" | "sepia" | "dark";
  columnWidth: "narrow" | "normal" | "wide"; // narrow (500px), normal (680px), wide (850px)
  defaultWpmTarget?: number;
  soundEnabled?: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  educationLevel: EducationLevel;
  ageGroup?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
  status: "active" | "suspended" | "pending_verification";
}

export interface ReadingPassage {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  educationLevels: EducationLevel[];
  ageGroups: string[];
  difficulty: DifficultyLevel;
  genre: "bilgilendirici" | "oykuleyici" | "aciklayici" | "akademik" | "diger";
  topic: string;
  targetSkills: string[];
  estimatedReadingTime: number; // seconds
  status: ContentStatus;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  targetSkills: string[];
  difficulty: DifficultyLevel;
  order: number;
  prerequisites: string[]; // module IDs
  estimatedDuration: number; // minutes
  status: ContentStatus;
  iconName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  passageId: string;
  passageVersion: number;
  questionType: "multiple_choice" | "true_false" | "short_answer";
  prompt: string;
  options: QuestionOption[];
  correctAnswer: string; // ID of correct option or exact answer text
  points: number;
  explanation: string;
  targetSkill?: string; // e.g. "ana_fikir", "cikarim_yapma", "ayrinti_bulma"
  status: ContentStatus;
}

export interface Activity {
  id: string;
  moduleId: string;
  title: string;
  type: ActivityType;
  description: string;
  targetSkills: string[];
  difficulty: DifficultyLevel;
  ageGroups: string[];
  educationLevels: EducationLevel[];
  instructions: string;
  contentConfig: {
    passageId?: string;
    wordList?: string[];
    symbolGrid?: string[][];
    targetSymbol?: string;
    targetKeywords?: string[];
    chunkSize?: number; // words per chunk (e.g. 2, 3, 4)
    speedPacingWpm?: number;
    timeLimitSeconds?: number;
  };
  assessmentConfig?: {
    questionIds?: string[];
    minimumPassScore?: number;
  };
  completionRules: {
    minWpm?: number;
    minComprehensionScore?: number;
    requiredAccuracy?: number;
  };
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingSession {
  id: string;
  userId: string;
  passageId: string;
  passageVersion: number;
  activityId?: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  wordCount: number;
  wpm: number;
  status: "completed" | "abandoned";
  createdAt: string;
}

export interface AssessmentResult {
  id: string;
  userId: string;
  assessmentType: AssessmentType;
  passageId: string;
  passageVersion: number;
  readingSessionId?: string;
  wordCount: number;
  durationSeconds: number;
  wpm: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  gradableQuestionCount: number;
  comprehensionScore: number; // 0 to 100 percentage
  userAnswers?: Record<string, string>;
  createdAt: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  moduleId: string;
  activityId?: string;
  status: "not_started" | "in_progress" | "completed";
  completionPercentage: number;
  attemptCount: number;
  bestResult?: {
    wpm: number;
    comprehensionScore: number;
    completedAt: string;
  };
  lastActivityAt: string;
  updatedAt: string;
}

export interface ClassItem {
  id: string;
  name: string;
  teacherId: string;
  educationLevel: EducationLevel;
  classCode: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "archived";
}

export interface ClassMembership {
  id: string;
  classId: string;
  userId: string;
  studentName?: string;
  studentEmail?: string;
  joinedAt: string;
  status: "active" | "removed";
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  classId: string;
  activityId: string;
  activityTitle: string;
  assignedAt: string;
  dueAt: string;
  status: "active" | "closed";
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: string;
  result: "success" | "denied" | "error";
  metadata?: Record<string, any>;
}

// ==========================================
// BAŞLANGIÇ SINAVI VE SEVİYE BELİRLEME MODELLERİ
// ==========================================

export interface PlacementOption {
  id: "A" | "B" | "C" | "D" | string;
  text: string;
}

export type PlacementQuestionCategory =
  | "acik_bilgi"
  | "ana_fikir"
  | "cikarim"
  | "kelime_anlami"
  | "siralama"
  | "yazar_amaci";

export interface PlacementQuestion {
  id: string;
  examId: string;
  examVersion: number;
  passageVersion: number;
  questionText: string;
  questionType: PlacementQuestionCategory;
  options: PlacementOption[]; // Tam olarak 4 seçenek (A, B, C, D)
  correctOptionId: string; // "A" | "B" | "C" | "D" - Öğrenciye sınav öncesinde/sırasında gizlidir
  explanation: string;
  points: number;
  order: number; // 1'den 10'a kadar
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PlacementPassage {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  educationLevels: EducationLevel[];
  ageGroups: string[];
  difficulty: DifficultyLevel;
  genre: string;
  topic: string;
  version: number;
  status: ContentStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlacementExam {
  id: string;
  title: string;
  code: string; // örn: "ilk-okul-baslangic-01"
  description: string;
  educationLevels: EducationLevel[];
  ageGroups: string[];
  targetSkills: string[];
  passageId: string;
  passageVersion: number;
  questionCount: number; // 1 ile 10 arasında
  estimatedReadingSeconds: number;
  targetReadingSeconds?: number;
  readingTimeLimitEnabled: boolean;
  readingTimeLimitSeconds?: number;
  questionTimeLimitEnabled: boolean;
  questionTimeLimitSeconds?: number;
  status: ContentStatus;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface PlacementAttempt {
  id: string;
  userId: string;
  examId: string;
  examVersion: number;
  passageId: string;
  passageVersion: number;
  startedAt: string;
  readingStartedAt: string;
  readingCompletedAt: string;
  questionsStartedAt: string;
  submittedAt: string;
  readingDurationSeconds: number;
  questionDurationSeconds: number;
  wordCount: number;
  rawWpm: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  gradableQuestionCount: number; // 10
  comprehensionPercentage: number;
  status: "completed" | "in_progress" | "abandoned";
  createdAt: string;
}

export interface PlacementResponse {
  attemptId: string;
  userId: string;
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  pointsAwarded: number;
  answeredAt: string;
}

export interface PlacementProfile {
  userId: string;
  latestAttemptId: string;
  latestRawWpm: number;
  latestComprehensionPercentage: number;
  latestAssessmentAt: string;
  profileStatus: "evaluated" | "pending";
  recommendedModuleIds: string[];
  updatedAt: string;
}
