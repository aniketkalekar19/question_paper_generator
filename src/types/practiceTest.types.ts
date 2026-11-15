import { QuestionItem } from "./questionPaper.types";

export interface ServiceError {
  code: string;
  message: string;
  details?: string;
}

export type ServiceResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: ServiceError };

export interface AttemptMetrics {
  count: number;
  completedCount: number;
  averageScore: string | null;
}

export interface TestAttemptRecord {
  id: string;
  userId: string | null;
  paperId: string;
  score: number | null;
  startedAt: string;
  submittedAt: string | null;
}

export interface PracticePaperDetail {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  totalMarks: number;
  durationMinutes: number;
  questions: QuestionItem[];
}

export interface StudentAnswer {
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
}

export interface TestSubmissionInput {
  userId?: string | null;
  paperId: string;
  score: number;
  startedAt: string;
  submittedAt: string;
}
