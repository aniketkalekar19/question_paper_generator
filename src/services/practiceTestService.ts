import { createServerClient } from "@/lib/supabase/server";
import { Database } from "@/types/database.types";
import {
  TestAttemptRecord,
  TestSubmissionInput,
  AttemptMetrics,
  ServiceResult,
  ServiceError,
} from "@/types/practiceTest.types";

export type TestAttemptRow =
  Database["public"]["Tables"]["test_attempts"]["Row"];
export type TestAttemptInsert =
  Database["public"]["Tables"]["test_attempts"]["Insert"];

/**
 * Service managing student Test Attempts and evaluations via Supabase.
 * Returns strictly typed results distinguishing query failures from empty datasets.
 */
export class PracticeTestService {
  /**
   * Retrieves all test attempts from Supabase.
   * Returns a typed ServiceResult without masking database failures.
   */
  static async getAllAttempts(): Promise<ServiceResult<TestAttemptRecord[]>> {
    try {
      const supabase = createServerClient();

      const { data, error } = await supabase
        .from("test_attempts")
        .select("id, user_id, paper_id, score, started_at, submitted_at")
        .order("started_at", { ascending: false });

      if (error) {
        // Safe server-side diagnostic logging (no credentials or tokens logged)
        console.error("[PracticeTestService.getAllAttempts] Database query failed:", {
          code: error.code,
          message: error.message,
          hint: error.hint,
        });

        const serviceError: ServiceError = {
          code: error.code || "DB_QUERY_FAILED",
          message: error.message || "Failed to retrieve test attempts from database.",
          details: error.details || undefined,
        };

        return {
          success: false,
          data: null,
          error: serviceError,
        };
      }

      const records: TestAttemptRecord[] = ((data as TestAttemptRow[] | null) || []).map(
        (attempt) => ({
          id: attempt.id,
          userId: attempt.user_id,
          paperId: attempt.paper_id,
          score: attempt.score,
          startedAt: attempt.started_at,
          submittedAt: attempt.submitted_at,
        })
      );

      return {
        success: true,
        data: records,
        error: null,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error during attempts query.";

      console.error("[PracticeTestService.getAllAttempts] Exception encountered:", {
        message: errorMessage,
      });

      return {
        success: false,
        data: null,
        error: {
          code: "INTERNAL_SERVICE_ERROR",
          message: errorMessage,
        },
      };
    }
  }

  /**
   * Calculates overall test metrics (count, completed count, and average score).
   * Distinguishes genuine zero-state datasets from connection or query errors.
   */
  static async getAttemptMetrics(): Promise<ServiceResult<AttemptMetrics>> {
    const attemptsResult = await this.getAllAttempts();

    // Propagate database errors cleanly; never disguise as 0 attempts
    if (!attemptsResult.success || !attemptsResult.data) {
      console.error(
        "[PracticeTestService.getAttemptMetrics] Cannot calculate metrics due to upstream query failure:",
        {
          errorCode: attemptsResult.error?.code,
          errorMessage: attemptsResult.error?.message,
        }
      );

      return {
        success: false,
        data: null,
        error: attemptsResult.error || {
          code: "METRICS_UNAVAILABLE",
          message: "Unable to retrieve metrics from database.",
        },
      };
    }

    const attempts = attemptsResult.data;

    // Genuine empty dataset: 0 attempts recorded
    if (attempts.length === 0) {
      return {
        success: true,
        data: {
          count: 0,
          completedCount: 0,
          averageScore: null,
        },
        error: null,
      };
    }

    // Filter attempts that have a recorded numeric score
    const completedAttempts = attempts.filter(
      (a) => a.score !== null && !isNaN(Number(a.score))
    );

    let averageScoreStr: string | null = null;
    if (completedAttempts.length > 0) {
      const totalScore = completedAttempts.reduce(
        (sum, a) => sum + Number(a.score),
        0
      );
      averageScoreStr = `${(totalScore / completedAttempts.length).toFixed(1)}%`;
    }

    return {
      success: true,
      data: {
        count: attempts.length,
        completedCount: completedAttempts.length,
        averageScore: averageScoreStr,
      },
      error: null,
    };
  }

  /**
   * Records a completed test attempt.
   */
  static async recordAttempt(
    input: TestSubmissionInput
  ): Promise<ServiceResult<TestAttemptRow>> {
    try {
      const supabase = createServerClient();

      const insertData: TestAttemptInsert = {
        user_id: input.userId || null,
        paper_id: input.paperId,
        score: input.score,
        started_at: input.startedAt,
        submitted_at: input.submittedAt,
      };

      const { data, error } = await supabase
        .from("test_attempts")
        .insert(insertData)
        .select()
        .single();

      if (error || !data) {
        console.error("[PracticeTestService.recordAttempt] Failed to insert attempt:", {
          code: error?.code,
          message: error?.message,
        });

        return {
          success: false,
          data: null,
          error: {
            code: error?.code || "INSERT_FAILED",
            message: error?.message || "Failed to save test attempt.",
          },
        };
      }

      return {
        success: true,
        data: data as TestAttemptRow,
        error: null,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error recording attempt.";

      console.error("[PracticeTestService.recordAttempt] Exception encountered:", {
        message,
      });

      return {
        success: false,
        data: null,
        error: {
          code: "INTERNAL_SERVICE_ERROR",
          message,
        },
      };
    }
  }
}
