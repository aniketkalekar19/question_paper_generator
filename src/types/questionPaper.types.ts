export type DifficultyLevel = "easy" | "medium" | "hard";

export type QuestionType =
  | "mcq"
  | "short_answer"
  | "long_answer";

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuestionItem {
  id?: string;
  paperId: string;
  questionText: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  marks: number;
  options?: QuestionOption[] | null;
  correctAnswer?: string | null;
  explanation?: string | null;
  sourceReference?: string | null;
  createdAt?: string;
}

export interface QuestionPaperSummary {
  id: string;
  userId?: string | null;
  title: string;
  subject: string;
  difficulty: string;
  totalMarks: number;
  durationMinutes: number;
  status: string;
  createdAt: string;
}

export interface CreatePaperInput {
  userId?: string | null;
  title: string;
  subject: string;
  difficulty: DifficultyLevel;
  totalMarks: number;
  durationMinutes: number;
  status?: string;
}

export interface DifficultyDistribution {
  easyPercentage: number;
  mediumPercentage: number;
  hardPercentage: number;
}

export interface QuestionPaperConfig {
  title: string;
  subject: string;
  difficulty?: DifficultyLevel;
  totalMarks: number;
  durationMinutes: number;
  difficultyDistribution?: DifficultyDistribution;
}

export interface SourceDocument {
  id: string;
  userId?: string | null;
  fileName: string;
  extractedText: string | null;
  createdAt: string;
}

export interface TestAttempt {
  id: string;
  userId?: string | null;
  paperId: string;
  score: number | null;
  startedAt: string;
  submittedAt: string | null;
}
