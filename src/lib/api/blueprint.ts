import { QuestionType } from "@/types/questionPaper.types";

export const MAX_PDF_BYTES = 7.5 * 1024 * 1024;
export const MAX_PROMPT_LENGTH = 4000;

export interface BlueprintSection {
  name: string;
  questionCount: number;
  answerCount: number;
  marksPerQuestion: number;
  totalMarks: number;
  questionTypes?: QuestionType[];
}

export interface ExamBlueprint {
  sections: BlueprintSection[];
  questionCount: number;
  totalMarks: number;
}

/**
 * Parses natural-language paper requirements into a validated exam blueprint.
 * Returns validation errors when sections, counts, or totals are malformed or contradictory.
 */
export function parseRequirements(prompt: string): { blueprint?: ExamBlueprint; errors: string[] } {
  if (!prompt.trim()) return { errors: [] };
  const errors: string[] = [];
  const sections: BlueprintSection[] = [];
  const headerRegex = /(?:^|[.,;\n])\s*(?:Section|Part)\s+([A-Za-z0-9]+(?:\s*\([^)\n]{1,30}\))?)\s*(?:[:\-–—]|(?=\n))/gim;
  const headers = Array.from(prompt.matchAll(headerRegex));

  if (!headers.length) {
    const cleanPrompt = prompt.replace(/\btotal\s*:?\s*\d+\s*marks?\b/gi, "");
    const countMatches = Array.from(
      cleanPrompt.matchAll(/\b(\d+)\s+(?:[A-Za-z-]+\s+){0,3}?(?:questions?|qs?|mcqs?|multiple[- ]choice(?:\s+questions?)?|short[- ]answer(?:\s+questions?)?|long[- ]answer(?:\s+questions?)?|problems?|items?)\b/gi)
    );
    const marksMatch =
      cleanPrompt.match(/\b(\d+)\s*marks?\s*(?:each|per\s+question|\/\s*question|\/\s*q)\b/i) ||
      cleanPrompt.match(/(?:of|for|worth)\s*(\d+)\s*marks?\s*(?:each|per\s+question)?\b/i);

    if (countMatches.length === 1 && marksMatch) {
      const questionCount = Number(countMatches[0][1]);
      const perQuestion = Number(marksMatch[1]);
      if (!Number.isInteger(questionCount) || questionCount < 1 || !Number.isInteger(perQuestion) || perQuestion < 1) {
        return { errors: ["Question count and marks per question must be positive integers."] };
      }
      const total = prompt.match(/\btotal\s*:?\s*(\d+)\s*marks?\b/i)?.[1];
      const blueprint: ExamBlueprint = {
        sections: [{ name: "Questions", questionCount, answerCount: questionCount, marksPerQuestion: perQuestion, totalMarks: questionCount * perQuestion }],
        questionCount,
        totalMarks: questionCount * perQuestion,
      };
      if (total && Number(total) !== blueprint.totalMarks) {
        errors.push(`Requested total ${total} marks conflicts with ${questionCount} questions × ${perQuestion} marks (${blueprint.totalMarks}).`);
      }
      return { blueprint: errors.length ? undefined : blueprint, errors };
    }

    if (/\b(?:section|part)\s+[a-z0-9]+|\bmarks?\s*(?:each|per\s+question)\b/i.test(prompt) || countMatches.length > 1) {
      return { errors: ["Describe sections as ‘Section A: answer any 5 of 7 questions, 3 marks each’ so question counts, choices, and marks can be validated before generation."] };
    }

    return { errors: [] };
  }

  for (let index = 0; index < headers.length; index++) {
    const match = headers[index];
    const heading = match[1]?.trim();
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < headers.length ? (headers[index + 1].index ?? prompt.length) : prompt.length;
    const block = prompt.slice(start, end);
    const cleanBlock = block.replace(/\btotal\s*:?\s*\d+\s*marks?\b/gi, "");

    const choiceMatch =
      cleanBlock.match(/(?:answer|attempt)(?:\s+any)?\s+(\d+)\s+(?:of|out\s+of)\s+(\d+)(?:\s+[A-Za-z-]+){0,3}\s*(?:questions?|qs?|mcqs?|items?|problems?)?/i) ||
      cleanBlock.match(/\b(\d+)\s+(?:of|out\s+of)\s+(\d+)\s+(?:[A-Za-z-]+\s+){0,3}?(?:questions?|qs?|mcqs?|items?|problems?)/i);
    const plainCountMatch = !choiceMatch
      ? cleanBlock.match(/\b(\d+)\s+(?:[A-Za-z-]+\s+){0,3}?(?:questions?|qs?|mcqs?|multiple[- ]choice(?:\s+questions?)?|short[- ]answer(?:\s+questions?)?|long[- ]answer(?:\s+questions?)?|problems?|items?)\b/i)
      : null;
    const marksMatch =
      cleanBlock.match(/\b(\d+)\s*marks?\s*(?:each|per\s+question|\/\s*question|\/\s*q)\b/i) ||
      cleanBlock.match(/(?:of|for|worth|at|@)\s*(\d+)\s*marks?\b/i) ||
      cleanBlock.match(/\(\s*(\d+)\s*marks?(?:\s*each)?\s*\)/i) ||
      cleanBlock.match(/\b(\d+)\s*marks?\b/i);

    const countMatch = choiceMatch || plainCountMatch;
    if (!countMatch || !marksMatch) {
      errors.push(`Section ${heading || index + 1} must specify its question count (e.g. ‘5 questions’ or ‘answer any 5 of 7 questions’) and marks per question (e.g. ‘3 marks each’).`);
      continue;
    }

    const answerCount = Number(countMatch[1]);
    const questionCount = choiceMatch ? Number(countMatch[2]) : answerCount;
    const marksPerQuestion = Number(marksMatch[1]);
    if (!Number.isInteger(questionCount) || !Number.isInteger(answerCount) || answerCount < 1 || questionCount < answerCount) {
      errors.push(`Section ${heading || index + 1} has an invalid choice rule. Questions to answer must be positive and no greater than questions provided.`);
      continue;
    }
    if (!Number.isInteger(marksPerQuestion) || marksPerQuestion < 1) {
      errors.push(`Section ${heading || index + 1} must have positive integer marks per question.`);
      continue;
    }
    const types = /\bMCQs?\b|multiple[- ]choice/i.test(block) ? (["mcq"] as QuestionType[]) : undefined;
    sections.push({
      name: heading ? `Section ${heading}` : `Section ${index + 1}`,
      questionCount,
      answerCount,
      marksPerQuestion,
      totalMarks: answerCount * marksPerQuestion,
      questionTypes: types,
    });
  }

  const questionCount = sections.reduce((sum, section) => sum + section.questionCount, 0);
  const totalMarks = sections.reduce((sum, section) => sum + section.totalMarks, 0);
  const requestedTotal = prompt.match(/\btotal\s*:?\s*(\d+)\s*marks?\b/i)?.[1];
  if (requestedTotal && Number(requestedTotal) !== totalMarks) {
    errors.push(`Requested total ${requestedTotal} marks conflicts with the answer-any maximum of ${totalMarks} marks across the sections.`);
  }
  const preamble = prompt.slice(0, headers[0].index ?? 0);
  const totalCountMatch = prompt.match(/\btotal(?:\s+of)?\s*:?\s*(\d+)\s+questions?\b|\b(\d+)\s+questions?\s+total\b/i);
  const requestedCount =
    preamble.match(/(?:create|generate|total(?:\s+of)?)\s+(\d+)\s+questions?/i)?.[1] ||
    totalCountMatch?.[1] ||
    totalCountMatch?.[2];
  if (requestedCount && Number(requestedCount) !== questionCount) {
    errors.push(`Requested ${requestedCount} total questions, but section counts add up to ${questionCount}.`);
  }
  return { blueprint: errors.length ? undefined : { sections, questionCount, totalMarks }, errors };
}

/**
 * Resolves the active exam blueprint from either Paper Requirements or numeric parameters.
 */
export function resolveBlueprint(
  requirementsPrompt: string,
  questionCount: number,
  totalMarks: number
): { blueprint?: ExamBlueprint; errors: string[] } {
  const parsed = parseRequirements(requirementsPrompt);
  const errors = [...parsed.errors];
  const usesNumericBlueprint = !parsed.blueprint && parsed.errors.length === 0;

  if (usesNumericBlueprint && (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 40)) {
    errors.push("questionCount must be an integer from 1 to 40.");
  }
  if (usesNumericBlueprint && (!Number.isInteger(totalMarks) || totalMarks < 1 || totalMarks > 500)) {
    errors.push("totalMarks must be an integer from 1 to 500.");
  }
  if (usesNumericBlueprint && Number.isInteger(totalMarks) && Number.isInteger(questionCount) && totalMarks < questionCount) {
    errors.push("totalMarks must be at least the number of questions (minimum 1 mark per question).");
  }
  if (usesNumericBlueprint && Number.isInteger(totalMarks) && Number.isInteger(questionCount) && questionCount > 0 && totalMarks >= questionCount) {
    const count = Math.min(questionCount, 40);
    if (totalMarks % count !== 0) {
      errors.push("Without a section blueprint in Paper Requirements, totalMarks must divide evenly across questionCount.");
    }
  }

  const blueprint =
    parsed.blueprint ||
    (usesNumericBlueprint &&
    Number.isInteger(questionCount) &&
    Number.isInteger(totalMarks) &&
    questionCount > 0 &&
    totalMarks >= questionCount &&
    totalMarks % questionCount === 0
      ? {
          sections: [
            {
              name: "Questions",
              questionCount,
              answerCount: questionCount,
              marksPerQuestion: Math.floor(totalMarks / questionCount),
              totalMarks,
            },
          ],
          questionCount,
          totalMarks,
        }
      : undefined);

  if (blueprint && (blueprint.questionCount > 40 || blueprint.totalMarks > 500)) {
    errors.push("Blueprints are limited to 40 questions and 500 required-answer marks.");
  }

  return { blueprint: errors.length ? undefined : blueprint, errors };
}
