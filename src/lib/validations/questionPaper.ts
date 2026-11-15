import { QuestionPaperConfig } from "@/types/questionPaper.types";

export interface ValidationOutput {
  isValid: boolean;
  errors: string[];
}

export function validateQuestionPaperConfig(
  input: Partial<QuestionPaperConfig>
): ValidationOutput {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length < 3) {
    errors.push("Title must be at least 3 characters long.");
  }

  if (!input.subject || input.subject.trim().length < 2) {
    errors.push("Subject is required.");
  }

  if (typeof input.totalMarks !== "number" || input.totalMarks <= 0) {
    errors.push("Total marks must be a positive number.");
  }

  if (typeof input.durationMinutes !== "number" || input.durationMinutes <= 0) {
    errors.push("Duration must be a positive number of minutes.");
  }

  if (input.difficultyDistribution) {
    const { easyPercentage, mediumPercentage, hardPercentage } =
      input.difficultyDistribution;
    const totalPercentage = easyPercentage + mediumPercentage + hardPercentage;
    if (totalPercentage !== 100) {
      errors.push(
        `Difficulty distribution must sum to 100%. Current total: ${totalPercentage}%.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
