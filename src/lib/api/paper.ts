import { randomUUID } from "crypto";
import { DifficultyLevel, QuestionType } from "@/types/questionPaper.types";
import {
  BlueprintSection,
  ExamBlueprint,
  MAX_PDF_BYTES,
  MAX_PROMPT_LENGTH,
  resolveBlueprint,
} from "@/lib/api/blueprint";

export { MAX_PDF_BYTES, MAX_PROMPT_LENGTH };
export type { BlueprintSection, ExamBlueprint };

export interface GeneratePaperInput {
  subject: string; courseCode?: string; title?: string; sourceText?: string; pdfBase64?: string;
  referencePdfBase64?: string; requirementsPrompt?: string; blueprint: ExamBlueprint;
  difficulty: DifficultyLevel; questionTypes: QuestionType[]; durationMinutes: number;
}
export interface GeneratedQuestion {
  questionText: string; questionType: QuestionType; difficulty: DifficultyLevel; marks: number;
  options: { id: string; text: string; isCorrect: boolean }[]; correctAnswer: string;
  explanation: string; sourceReference: string; sectionName: string; sectionQuestionNumber: number;
  markingCriteria: string[];
}
export interface GeneratedPaper {
  id: string; title: string; subject: string; difficulty: DifficultyLevel; totalMarks: number;
  durationMinutes: number; questions: GeneratedQuestion[]; blueprint: ExamBlueprint;
  createdAt: string; persisted: boolean;
}

export function validateGenerateInput(value: unknown): { input?: GeneratePaperInput; errors: string[] } {
  if (!value || typeof value !== "object") return { errors: ["Request body must be a JSON object."] };
  const v = value as Record<string, unknown>; const errors: string[] = [];
  const subject = typeof v.subject === "string" ? v.subject.trim() : "";
  const sourceText = typeof v.sourceText === "string" ? v.sourceText.trim() : "";
  const pdfBase64 = typeof v.pdfBase64 === "string" ? v.pdfBase64 : "";
  const referencePdfBase64 = typeof v.referencePdfBase64 === "string" ? v.referencePdfBase64 : "";
  const requirementsPrompt = typeof v.requirementsPrompt === "string" ? v.requirementsPrompt.trim() : "";
  const difficulty = v.difficulty, questionTypes = v.questionTypes;
  const questionCount = Number(v.questionCount), totalMarks = Number(v.totalMarks), durationMinutes = Number(v.durationMinutes);
  if (subject.length < 2 || subject.length > 120) errors.push("subject must be between 2 and 120 characters.");
  if (!sourceText && !pdfBase64) errors.push("Provide pasted text or a PDF as study material.");
  if (sourceText.length > 30000) errors.push("sourceText must not exceed 30,000 characters.");
  for (const [label, data] of [["Study material PDF", pdfBase64], ["Reference paper PDF", referencePdfBase64]] as const) {
    if (data && (!/^JVBERi0[A-Za-z0-9+/]*={0,2}$/.test(data) || data.length > Math.ceil(MAX_PDF_BYTES * 4 / 3) + 4)) errors.push(`${label} must be a valid PDF under 7.5 MB.`);
  }
  if (requirementsPrompt.length > MAX_PROMPT_LENGTH) errors.push(`Paper Requirements must not exceed ${MAX_PROMPT_LENGTH} characters.`);
  if (typeof v.requirementsPrompt !== "undefined" && typeof v.requirementsPrompt !== "string") errors.push("Paper Requirements must be text.");
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 360) errors.push("durationMinutes must be an integer from 1 to 360.");
  if (!(["easy", "medium", "hard"] as unknown[]).includes(difficulty)) errors.push("difficulty must be easy, medium, or hard.");
  const validQuestionTypes = Array.isArray(questionTypes) && questionTypes.length >= 1 && !questionTypes.some((t) => !["mcq", "short_answer", "long_answer"].includes(String(t)));
  if (!validQuestionTypes) errors.push("questionTypes must contain mcq, short_answer, or long_answer.");
  const resolved = resolveBlueprint(requirementsPrompt, questionCount, totalMarks);
  errors.push(...resolved.errors);
  if (resolved.blueprint && validQuestionTypes) {
    for (const section of resolved.blueprint.sections) {
      if (section.questionTypes?.some((t) => !questionTypes.includes(t))) {
        errors.push(`${section.name} requires ${section.questionTypes.join(", ")} questions, which must be enabled in Question Types.`);
      }
    }
  }
  if (errors.length) return { errors };
  return { errors, input: { subject, courseCode: typeof v.courseCode === "string" ? v.courseCode.slice(0, 40) : undefined, title: typeof v.title === "string" ? v.title.slice(0, 160) : undefined, sourceText, pdfBase64, referencePdfBase64, requirementsPrompt, blueprint: resolved.blueprint!, difficulty: difficulty as DifficultyLevel, questionTypes: questionTypes as QuestionType[], durationMinutes } };
}

export async function generatePaper(input: GeneratePaperInput): Promise<GeneratedPaper> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API is not configured. Add GEMINI_API_KEY in the server environment.");
  const material = input.sourceText || "Use the attached PDF study material.";
  const blueprintText = input.blueprint.sections.map((s) => `${s.name}: provide ${s.questionCount} new questions; students answer ${s.answerCount}; ${s.marksPerQuestion} marks each; section maximum ${s.totalMarks} marks${s.questionTypes?.length ? `; question types: ${s.questionTypes.join(", ")}` : ""}.`).join("\n");
  const prompt = `Create a new exam using the supplied study material as the sole source for question content. Follow this blueprint exactly:\n${blueprintText}\nTotal questions to generate: ${input.blueprint.questionCount}. Maximum exam marks (sum marks for questions students are required to answer): ${input.blueprint.totalMarks}. Subject: ${input.subject}${input.courseCode ? ` (${input.courseCode})` : ""}. Difficulty: ${input.difficulty}. Allowed question types: ${input.questionTypes.join(", ")}.\nUser requirements: ${input.requirementsPrompt || "No additional requirements."}\nA reference PDF, if attached, is guidance only for formatting, section structure, question style, and difficulty. NEVER copy or closely paraphrase questions or answers from it. Do not reproduce names, institution identifiers, dates, or any identifying details from it. Write entirely new questions grounded in the study material.\nFor each question return sectionName and sectionQuestionNumber, marks exactly matching its section, a concise correct answer, explanation, source reference, and question-wise markingCriteria. Each MCQ must have 4 options with exactly one correct. Other types have no options. Output JSON only.`;
  const properties = {
    questionText: { type: "STRING" }, questionType: { type: "STRING", enum: input.questionTypes }, difficulty: { type: "STRING", enum: [input.difficulty] },
    marks: { type: "INTEGER" }, sectionName: { type: "STRING" }, sectionQuestionNumber: { type: "INTEGER" },
    options: { type: "ARRAY", items: { type: "OBJECT", properties: { id: { type: "STRING" }, text: { type: "STRING" }, isCorrect: { type: "BOOLEAN" } }, required: ["id", "text", "isCorrect"] } },
    correctAnswer: { type: "STRING" }, explanation: { type: "STRING" }, sourceReference: { type: "STRING" }, markingCriteria: { type: "ARRAY", items: { type: "STRING" } },
  };
  const parts: Record<string, unknown>[] = [{ text: `${prompt}\n\nStudy material:\n${material}` }];
  if (input.pdfBase64) parts.push({ inlineData: { mimeType: "application/pdf", data: input.pdfBase64 } });
  if (input.referencePdfBase64) parts.push({ inlineData: { mimeType: "application/pdf", data: input.referencePdfBase64 } });
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey }, body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { questions: { type: "ARRAY", items: { type: "OBJECT", properties, required: Object.keys(properties) } } }, required: ["questions"] } } }), signal: AbortSignal.timeout(60000) });
  if (!response.ok) { const detail = await response.json().catch(() => ({})) as { error?: { message?: string } }; throw new Error(`Gemini API request failed (${response.status}): ${detail.error?.message || "Please check your API key and try again."}`); }
  const payload = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[] };
  const candidate = payload.candidates?.[0];
  if (candidate?.finishReason && candidate.finishReason !== "STOP" && candidate.finishReason !== "MAX_TOKENS") {
    throw new Error(`Gemini could not generate the paper (reason: ${candidate.finishReason}). Try simplifying your requirements or using a different model.`);
  }
  const text = candidate?.content?.parts?.map((p) => p.text || "").join("");
  if (!text) throw new Error("Gemini returned an empty response. Check that GEMINI_MODEL names a model available to your Gemini API key.");
  let questions: GeneratedQuestion[];
  try { questions = (JSON.parse(text) as { questions?: GeneratedQuestion[] }).questions || []; } catch { throw new Error("Gemini returned an unreadable paper. Please try again."); }
  const invalid = "The generated paper did not match the requested blueprint. Please review the requirements or regenerate.";
  if (questions.length !== input.blueprint.questionCount) throw new Error(`${invalid} Expected ${input.blueprint.questionCount} questions but received ${questions.length}.`);
  for (const section of input.blueprint.sections) {
    const sectionQuestions = questions.filter((q) => q.sectionName?.toLowerCase() === section.name.toLowerCase());
    if (sectionQuestions.length !== section.questionCount || sectionQuestions.some((q) => q.marks !== section.marksPerQuestion) || new Set(sectionQuestions.map((q) => q.sectionQuestionNumber)).size !== section.questionCount || sectionQuestions.some((q) => q.sectionQuestionNumber < 1 || q.sectionQuestionNumber > section.questionCount)) throw new Error(`${invalid} Section ${section.name} must contain ${section.questionCount} questions worth ${section.marksPerQuestion} marks each.`);
    if (section.questionTypes?.length && sectionQuestions.some((q) => !section.questionTypes!.includes(q.questionType))) throw new Error(`${invalid} ${section.name} must contain only ${section.questionTypes.join(", ")} questions.`);
  }
  if (questions.some((q) => !q.questionText || !Number.isInteger(q.marks) || !input.questionTypes.includes(q.questionType) || q.difficulty !== input.difficulty || !q.correctAnswer || !q.explanation || !Array.isArray(q.markingCriteria) || !q.markingCriteria.length || (q.questionType === "mcq" && (q.options?.length !== 4 || q.options.filter((o) => o.isCorrect).length !== 1)))) throw new Error("The generated paper has incomplete question or evaluation details. Please regenerate.");
  return { id: randomUUID(), title: input.title?.trim() || `${input.subject} Question Paper`, subject: input.subject, difficulty: input.difficulty, totalMarks: input.blueprint.totalMarks, durationMinutes: input.durationMinutes, questions: questions.sort((a, b) => input.blueprint.sections.findIndex((s) => s.name.toLowerCase() === a.sectionName.toLowerCase()) - input.blueprint.sections.findIndex((s) => s.name.toLowerCase() === b.sectionName.toLowerCase()) || a.sectionQuestionNumber - b.sectionQuestionNumber), blueprint: input.blueprint, createdAt: new Date().toISOString(), persisted: false };
}

export async function persistPaper(paper: GeneratedPaper): Promise<GeneratedPaper> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return paper;
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin"); const supabase = createAdminClient();
    const { data, error } = await supabase.from("generated_papers").insert({ title: paper.title, subject: paper.subject, difficulty: paper.difficulty, total_marks: paper.totalMarks, duration_minutes: paper.durationMinutes, status: "generated" }).select("id").single();
    if (error || !data) throw error || new Error("Paper insert returned no record.");
    const rows = paper.questions.map((q) => ({ paper_id: data.id, question_text: q.questionText, question_type: q.questionType, difficulty: q.difficulty, marks: q.marks, options: q.options, correct_answer: q.correctAnswer, explanation: q.explanation, source_reference: q.sourceReference }));
    const result = await supabase.from("questions").insert(rows);
    if (result.error) { await supabase.from("generated_papers").delete().eq("id", data.id); throw result.error; }
    return { ...paper, id: data.id, persisted: true };
  } catch (error) { console.error("Paper persistence failed:", error instanceof Error ? error.message : "unknown error"); return paper; }
}
