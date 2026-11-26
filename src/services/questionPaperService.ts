import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Database, Json } from "@/types/database.types";
import {
  QuestionPaperSummary,
  CreatePaperInput,
} from "@/types/questionPaper.types";

export type GeneratedPaperRow =
  Database["public"]["Tables"]["generated_papers"]["Row"];
export type GeneratedPaperInsert =
  Database["public"]["Tables"]["generated_papers"]["Insert"];
export type QuestionRow =
  Database["public"]["Tables"]["questions"]["Row"];

/**
 * Service handling Question Paper persistence and retrieval via Supabase
 * using the `generated_papers` and `questions` tables.
 */
export class QuestionPaperService {
  /**
   * Retrieves list of generated papers ordered by creation date.
   */
  static async getAllQuestionPapers(): Promise<QuestionPaperSummary[]> {
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createAdminClient()
      : createServerClient();

    const { data, error } = await supabase
      .from("generated_papers")
      .select("id, user_id, title, subject, difficulty, total_marks, duration_minutes, status, created_at")
      .is("user_id", null)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch generated papers: ${error.message}`);
    }

    const records = (data as GeneratedPaperRow[] | null) || [];

    return records.map((paper) => ({
      id: paper.id,
      userId: paper.user_id,
      title: paper.title,
      subject: paper.subject,
      difficulty: paper.difficulty,
      totalMarks: paper.total_marks,
      durationMinutes: paper.duration_minutes,
      status: paper.status,
      createdAt: paper.created_at,
    }));
  }

  /**
   * Retrieves a single generated paper by ID including questions.
   */
  static async getQuestionPaperById(id: string) {
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createAdminClient()
      : createServerClient();

    const { data: paper, error: paperError } = await supabase
      .from("generated_papers")
      .select("*")
      .eq("id", id)
      .is("user_id", null)
      .single();

    if (paperError || !paper) {
      throw new Error(`Question paper not found: ${paperError?.message || id}`);
    }

    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .eq("paper_id", id)
      .order("created_at", { ascending: true });

    if (questionsError) {
      throw new Error(`Failed to load questions: ${questionsError.message}`);
    }

    return {
      ...(paper as GeneratedPaperRow),
      questions: (questions as QuestionRow[]) || [],
    };
  }

  /**
   * Stores a newly generated paper record in Supabase.
   */
  static async createPaper(input: CreatePaperInput): Promise<GeneratedPaperRow> {
    const supabase = createServerClient();

    const insertData: GeneratedPaperInsert = {
      user_id: input.userId || null,
      title: input.title,
      subject: input.subject,
      difficulty: input.difficulty,
      total_marks: input.totalMarks,
      duration_minutes: input.durationMinutes,
      status: input.status || "draft",
    };

    const { data, error } = await supabase
      .from("generated_papers")
      .insert(insertData)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create paper: ${error?.message || "Unknown error"}`);
    }

    return data as GeneratedPaperRow;
  }
}
