import { randomUUID } from "crypto";
import { DifficultyLevel, QuestionType } from "@/types/questionPaper.types";

export interface GeneratePaperInput {
  subject: string;
  courseCode?: string;
  title?: string;
  sourceText?: string;
  pdfBase64?: string;
  difficulty: DifficultyLevel;
  questionTypes: QuestionType[];
  questionCount: number;
  totalMarks: number;
  durationMinutes: number;
}

export interface GeneratedQuestion {
  questionText: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  marks: number;
  options: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer: string;
  explanation: string;
  sourceReference: string;
}

export interface GeneratedPaper {
  id: string;
  title: string;
  subject: string;
  difficulty: DifficultyLevel;
  totalMarks: number;
  durationMinutes: number;
  questions: GeneratedQuestion[];
  createdAt: string;
  persisted: boolean;
}

export function validateGenerateInput(value: unknown): { input?: GeneratePaperInput; errors: string[] } {
  if (!value || typeof value !== "object") return { errors: ["Request body must be a JSON object."] };
  const v = value as Record<string, unknown>;
  const errors: string[] = [];
  const subject = typeof v.subject === "string" ? v.subject.trim() : "";
  const sourceText = typeof v.sourceText === "string" ? v.sourceText.trim() : "";
  const pdfBase64 = typeof v.pdfBase64 === "string" ? v.pdfBase64 : "";
  const difficulty = v.difficulty;
  const questionTypes = v.questionTypes;
  const questionCount = Number(v.questionCount);
  const totalMarks = Number(v.totalMarks);
  const durationMinutes = Number(v.durationMinutes);
  if (subject.length < 2 || subject.length > 120) errors.push("subject must be between 2 and 120 characters.");
  if (!sourceText && !pdfBase64) errors.push("Provide sourceText or pdfBase64 study material.");
  if (sourceText.length > 30000) errors.push("sourceText must not exceed 30,000 characters.");
  if (pdfBase64 && (pdfBase64.length > 10_500_000 || !/^JVBERi0[A-Za-z0-9+/=]+$/.test(pdfBase64))) errors.push("pdfBase64 must be a valid PDF under 7.5 MB.");
  if (!["easy", "medium", "hard"].includes(String(difficulty))) errors.push("difficulty must be easy, medium, or hard.");
  if (!Array.isArray(questionTypes) || questionTypes.length < 1 || questionTypes.some((t) => !["mcq", "short_answer", "long_answer"].includes(String(t)))) errors.push("questionTypes must contain mcq, short_answer, or long_answer.");
  if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 40) errors.push("questionCount must be an integer from 1 to 40.");
  if (!Number.isInteger(totalMarks) || totalMarks < 1 || totalMarks > 500) errors.push("totalMarks must be an integer from 1 to 500.");
  if (Number.isInteger(totalMarks) && Number.isInteger(questionCount) && totalMarks < questionCount) errors.push("totalMarks must be at least the number of questions (minimum 1 mark per question).");
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 360) errors.push("durationMinutes must be an integer from 1 to 360.");
  if (errors.length) return { errors };
  return { errors, input: {
    subject, courseCode: typeof v.courseCode === "string" ? v.courseCode.slice(0, 40) : undefined,
    title: typeof v.title === "string" ? v.title.slice(0, 160) : undefined, sourceText, pdfBase64,
    difficulty: difficulty as DifficultyLevel, questionTypes: questionTypes as QuestionType[], questionCount, totalMarks, durationMinutes,
  } };
}

export async function generatePaper(input: GeneratePaperInput): Promise<GeneratedPaper> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API is not configured. Add GEMINI_API_KEY in the server environment.");
  const material = input.sourceText || "Use the attached PDF study material.";
  const marksPerQuestion = Array.from({ length: input.questionCount }, (_, i) => Math.floor(input.totalMarks / input.questionCount) + (i < input.totalMarks % input.questionCount ? 1 : 0));
  const prompt = `Create a high-quality exam paper using only the study material below. Return exactly ${input.questionCount} questions. The required marks in order are: ${marksPerQuestion.join(", ")}; copy these marks exactly so the total is ${input.totalMarks}. Subject: ${input.subject}${input.courseCode ? ` (${input.courseCode})` : ""}. Difficulty: ${input.difficulty}. Allowed question types: ${input.questionTypes.join(", ")}. Each MCQ must have 4 options, exactly one marked correct, and correctAnswer matching it. Other types have an empty options array. Include a concise answer, explanation, and source reference for each question. Output JSON matching the requested schema. Study material:\n${material}`;
  const properties = {
    questionText: { type: "STRING" }, questionType: { type: "STRING", enum: input.questionTypes },
    difficulty: { type: "STRING", enum: [input.difficulty] }, marks: { type: "INTEGER" },
    options: { type: "ARRAY", items: { type: "OBJECT", properties: { id: { type: "STRING" }, text: { type: "STRING" }, isCorrect: { type: "BOOLEAN" } }, required: ["id", "text", "isCorrect"] } },
    correctAnswer: { type: "STRING" }, explanation: { type: "STRING" }, sourceReference: { type: "STRING" },
  };
  const contents: Record<string, unknown>[] = [{ role: "user", parts: [
    { text: prompt }, ...(input.pdfBase64 ? [{ inlineData: { mimeType: "application/pdf", data: input.pdfBase64 } }] : []),
  ] }];
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({ contents, generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { questions: { type: "ARRAY", items: { type: "OBJECT", properties, required: Object.keys(properties) } } }, required: ["questions"] } } }),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`Gemini API request failed (${response.status}): ${detail.error?.message || "Please check your API key and try again."}`);
  }
  const payload = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = payload.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("");
  if (!text) throw new Error("Gemini returned an empty response. Please try again.");
  const parsed = JSON.parse(text) as { questions?: GeneratedQuestion[] };
  const questions = parsed.questions;
  if (!Array.isArray(questions) || questions.length !== input.questionCount || questions.some((q) => !q.questionText || !Number.isInteger(q.marks) || q.marks < 1)) throw new Error("Gemini returned an invalid paper. Please try again.");
  if (questions.some((q) => !input.questionTypes.includes(q.questionType) || q.difficulty !== input.difficulty || !q.correctAnswer || !q.explanation || (q.questionType === "mcq" && (q.options?.length !== 4 || q.options.filter((option) => option.isCorrect).length !== 1)) || (q.questionType !== "mcq" && (q.options?.length ?? 0) > 0))) throw new Error("Gemini returned invalid question details. Please regenerate.");
  if (questions.reduce((sum, q) => sum + q.marks, 0) !== input.totalMarks) throw new Error("The generated question marks did not total the requested marks. Please regenerate.");
  return { id: randomUUID(), title: input.title?.trim() || `${input.subject} Question Paper`, subject: input.subject, difficulty: input.difficulty, totalMarks: input.totalMarks, durationMinutes: input.durationMinutes, questions, createdAt: new Date().toISOString(), persisted: false };
}

export async function persistPaper(paper: GeneratedPaper): Promise<GeneratedPaper> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return paper;
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("generated_papers").insert({ title: paper.title, subject: paper.subject, difficulty: paper.difficulty, total_marks: paper.totalMarks, duration_minutes: paper.durationMinutes, status: "generated" }).select("id").single();
    if (error || !data) throw error || new Error("Paper insert returned no record.");
    const rows = paper.questions.map((q) => ({ paper_id: data.id, question_text: q.questionText, question_type: q.questionType, difficulty: q.difficulty, marks: q.marks, options: q.options, correct_answer: q.correctAnswer, explanation: q.explanation, source_reference: q.sourceReference }));
    const result = await supabase.from("questions").insert(rows);
    if (result.error) {
      await supabase.from("generated_papers").delete().eq("id", data.id);
      throw result.error;
    }
    return { ...paper, id: data.id, persisted: true };
  } catch (error) {
    console.error("Paper persistence failed:", error instanceof Error ? error.message : "unknown error");
    return paper;
  }
}
