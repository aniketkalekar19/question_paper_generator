"use client";

import React, { useState } from "react";
import { SourceMaterialInput, MaterialSourceType } from "./SourceMaterialInput";
import {
  QuestionTypeSelector,
  QuestionTypeOption,
} from "./QuestionTypeSelector";
import { DifficultySelector } from "./DifficultySelector";
import { ExamParametersInput } from "./ExamParametersInput";
import { DifficultyLevel } from "@/types/questionPaper.types";
import { SparklesIcon, AlertCircleIcon, CheckCircleIcon } from "@/components/ui/Icons";
import { GeneratedPaper } from "@/lib/api/paper";
import { resolveBlueprint } from "@/lib/api/blueprint";

const DEFAULT_REQUIREMENTS = "Section A: answer any 5 of 7 questions, 3 marks each. Section B: answer any 3 of 5 questions, 5 marks each. Total: 30 marks.";

export function GeneratePaperForm() {
  // Form State
  const [subject, setSubject] = useState("");
  const [paperTitle, setPaperTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");

  // Source Material
  const [sourceType, setSourceType] = useState<MaterialSourceType>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [requirementsPrompt, setRequirementsPrompt] = useState("");
  const [referenceError, setReferenceError] = useState("");

  // Question Types & Difficulty
  const [selectedTypes, setSelectedTypes] = useState<QuestionTypeOption[]>([
    "mcq",
    "short_answer",
  ]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");

  // Exam Parameters
  const [totalMarks, setTotalMarks] = useState(50);
  const [questionCount, setQuestionCount] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(90);

  // UI Feedback State (Authentic UI only)
  const [errors, setErrors] = useState<string[]>([]);
  const [validatedSuccess, setValidatedSuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPaper, setGeneratedPaper] = useState<GeneratedPaper | null>(null);
  const [previewTab, setPreviewTab] = useState<"student" | "scheme">("student");
  const [generationError, setGenerationError] = useState("");
  const [generationErrorDetails, setGenerationErrorDetails] = useState<string[]>([]);

  const resolvedBlueprint = resolveBlueprint(requirementsPrompt, questionCount, totalMarks);

  const toggleQuestionType = (type: QuestionTypeOption) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length === 1) return; // keep at least one
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: string[] = [];

    if (subject.trim().length < 2 || subject.trim().length > 120) {
      validationErrors.push("Subject name must be between 2 and 120 characters.");
    }

    if (sourceType === "upload" && !file) {
      validationErrors.push("Please upload a PDF document or switch to the 'Paste Study Material' tab.");
    }

    if (sourceType === "paste" && pastedText.trim().length < 15) {
      validationErrors.push("Please paste study material (minimum 15 characters).");
    }

    if (sourceType === "paste" && pastedText.trim().length > 30000) {
      validationErrors.push("Pasted study material must not exceed 30,000 characters.");
    }

    if (sourceType === "upload" && file && (file.size > 7.5 * 1024 * 1024 || !file.name.toLowerCase().endsWith(".pdf"))) validationErrors.push("Study material must be a PDF no larger than 7.5 MB.");
    if (referenceFile && (referenceFile.size > 7.5 * 1024 * 1024 || !referenceFile.name.toLowerCase().endsWith(".pdf"))) validationErrors.push("Reference Paper must be a PDF no larger than 7.5 MB.");
    if (requirementsPrompt.length > 4000) validationErrors.push("Paper Requirements must not exceed 4,000 characters.");

    if (selectedTypes.length === 0) {
      validationErrors.push("Please select at least one question type (MCQ, Short Answer, or Long Answer).");
    }

    for (const bpError of resolvedBlueprint.errors) {
      validationErrors.push(bpError);
    }

    if (resolvedBlueprint.blueprint) {
      for (const section of resolvedBlueprint.blueprint.sections) {
        if (section.questionTypes?.some((t) => !selectedTypes.includes(t))) {
          validationErrors.push(`${section.name} requires ${section.questionTypes.join(", ")} questions, which must be enabled in Question Types.`);
        }
      }
    }

    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 360) {
      validationErrors.push("Exam duration must be a whole number between 1 and 360 minutes.");
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setValidatedSuccess(false);
      return;
    }

    setErrors([]);
    setValidatedSuccess(true);
    setGenerationError("");
    setGenerationErrorDetails([]);
    setIsGenerating(true);
    try {
      let pdfBase64: string | undefined;
      let referencePdfBase64: string | undefined;
      const toBase64 = (inputFile: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result.split(",")[1]) : reject(new Error("Unable to read PDF."));
        reader.onerror = () => reject(new Error("Unable to read PDF."));
        reader.readAsDataURL(inputFile);
      });
      if (sourceType === "upload" && file) {
        pdfBase64 = await toBase64(file);
      }
      if (referenceFile) referencePdfBase64 = await toBase64(referenceFile);
      const response = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, title: paperTitle, courseCode, sourceText: sourceType === "paste" ? pastedText : undefined, pdfBase64, referencePdfBase64, requirementsPrompt, difficulty, questionTypes: selectedTypes, questionCount, totalMarks, durationMinutes }),
      });
      const result = await response.json();
      if (!response.ok) {
        const details = Array.isArray(result.error?.details) ? result.error.details.filter((d: unknown): d is string => typeof d === "string") : [];
        setGenerationErrorDetails(details);
        throw new Error(result.error?.message || "Paper generation failed.");
      }
      setGeneratedPaper(result.data as GeneratedPaper);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Unable to generate the paper. Please try again.");
      setValidatedSuccess(false);
    } finally { setIsGenerating(false); }
  };

  return (
    <form onSubmit={handleGenerate} className="space-y-6">
      {/* Validation Errors Notice */}
      {errors.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/80 p-4 text-xs text-red-800">
          <AlertCircleIcon className="h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-900">Please review the following requirements:</p>
            <ul className="mt-1.5 list-disc pl-4 space-y-1">
              {errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Validation Success Banner */}
      {validatedSuccess && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-xs text-blue-900">
          <CheckCircleIcon className="h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="font-semibold text-blue-950">
              Exam Configuration Validated Successfully
            </p>
            <p className="mt-0.5 text-blue-800">
              Your request is ready. Gemini will generate the questions from your study material.
            </p>
          </div>
        </div>
      )}

      {/* 1. Exam Identification */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
          1. Course &amp; Examination Details
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Specify the academic subject and optional course identifiers.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label
              htmlFor="subjectInput"
              className="block text-xs font-semibold text-slate-700"
            >
              Subject / Course Name <span className="text-red-500">*</span>
            </label>
            <input
              id="subjectInput"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Distributed Systems, Organic Chemistry, Discrete Math"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          <div>
            <label
              htmlFor="courseCodeInput"
              className="block text-xs font-semibold text-slate-700"
            >
              Course Code <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="courseCodeInput"
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g. CS601, MAT202"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-mono text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="sm:col-span-3">
            <label
              htmlFor="paperTitleInput"
              className="block text-xs font-semibold text-slate-700"
            >
              Paper / Assessment Title <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="paperTitleInput"
              type="text"
              value={paperTitle}
              onChange={(e) => setPaperTitle(e.target.value)}
              placeholder="e.g. CIA-1 Mid-Semester Continuous Assessment"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div><h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Paper Requirements</h3><p className="mt-1 text-xs text-slate-500">Describe sections, how many questions to answer, and marks per question. Contradictory totals are flagged before generation.</p></div>
        <label htmlFor="requirementsPrompt" className="sr-only">Paper Requirements prompt</label>
        <textarea id="requirementsPrompt" rows={5} maxLength={4000} value={requirementsPrompt} onChange={(event) => setRequirementsPrompt(event.target.value)} placeholder={DEFAULT_REQUIREMENTS} className="w-full rounded-xl border border-slate-300 p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-slate-500">{requirementsPrompt.length}/4,000 characters · optional</span><div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center"><label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><input type="file" accept=".pdf,application/pdf" className="sr-only" onChange={async (event) => { const chosen = event.target.files?.[0]; event.target.value = ""; setReferenceError(""); if (!chosen) return; if (!chosen.name.toLowerCase().endsWith(".pdf")) { setReferenceError("Choose a PDF file."); return; } if (chosen.size > 7.5 * 1024 * 1024) { setReferenceError("Reference Paper must be no larger than 7.5 MB."); return; } const signature = new Uint8Array(await chosen.slice(0, 5).arrayBuffer()); if (Array.from(signature).map((byte) => String.fromCharCode(byte)).join("") !== "%PDF-") { setReferenceError("This file does not appear to be a valid PDF."); return; } setReferenceFile(chosen); }} />Add Reference Paper (optional)</label>{referenceFile && <span className="max-w-full truncate text-xs text-slate-600">{referenceFile.name}</span>}</div></div>
        <p className="text-xs text-slate-500">The reference is for guidance on formatting, structure, style, and difficulty only. New questions will come from your study material; reference questions, answers, names, and identifying details must not be reused.</p>
        {referenceFile && <button type="button" onClick={() => setReferenceFile(null)} className="text-xs font-semibold text-red-700">Remove reference PDF</button>}{referenceError && <p role="alert" className="text-sm text-red-700">{referenceError}</p>}
      </div>

      {/* 2. Study Material Source */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
          2. Study Material &amp; Syllabus Scope
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Provide the textbook chapters, lecture notes, or syllabus units.
        </p>

        <div className="mt-4">
          <SourceMaterialInput
            sourceType={sourceType}
            onSourceTypeChange={setSourceType}
            file={file}
            onFileSelect={setFile}
            pastedText={pastedText}
            onPastedTextChange={setPastedText}
          />
        </div>
      </div>

      {/* 3. Question Types & Difficulty */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            3. Question Types &amp; Difficulty
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Choose the item formats and target cognitive rigor.
          </p>
        </div>

        <QuestionTypeSelector
          selectedTypes={selectedTypes}
          onToggleType={toggleQuestionType}
        />

        <div className="border-t border-slate-100 pt-5">
          <DifficultySelector
            difficulty={difficulty}
            onChange={setDifficulty}
          />
        </div>
      </div>

      {/* 4. Exam Parameters */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
          4. Exam Duration &amp; Marks Distribution
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Set the total grading weight and allotted time.
        </p>

        <div className="mt-4">
          <ExamParametersInput
            totalMarks={totalMarks}
            onTotalMarksChange={setTotalMarks}
            questionCount={questionCount}
            onQuestionCountChange={setQuestionCount}
            durationMinutes={durationMinutes}
            onDurationChange={setDurationMinutes}
          />
        </div>
      </div>

      {/* Blueprint Summary & Submit Action Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Blueprint Summary
          </h3>
          {resolvedBlueprint.blueprint && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
              Total Required Marks: {resolvedBlueprint.blueprint.totalMarks} · {resolvedBlueprint.blueprint.questionCount} questions · {durationMinutes} mins
            </span>
          )}
        </div>

        {resolvedBlueprint.errors.length > 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <p className="font-semibold">Blueprint needs attention before generation:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {resolvedBlueprint.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        ) : resolvedBlueprint.blueprint ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {resolvedBlueprint.blueprint.sections.map((section) => (
              <div
                key={section.name}
                className="flex flex-col justify-between rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">{section.name}</span>
                  <span className="font-semibold text-blue-700">{section.totalMarks} marks</span>
                </div>
                <p className="mt-1 text-slate-600">
                  {section.questionCount} offered · answer {section.answerCount} · {section.marksPerQuestion} mark{section.marksPerQuestion === 1 ? "" : "s"} each
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {resolvedBlueprint.blueprint
              ? `Students answer for a maximum of ${resolvedBlueprint.blueprint.totalMarks} marks across ${resolvedBlueprint.blueprint.sections.length} section${resolvedBlueprint.blueprint.sections.length === 1 ? "" : "s"}.`
              : "Resolve blueprint errors above before generating."}
          </p>

          <button
            type="submit"
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
          >
            <SparklesIcon className="h-4 w-4 text-blue-400" />
            <span>{isGenerating ? "Generating with Gemini…" : "Generate Question Paper"}</span>
          </button>
        </div>
      </div>
      {generationError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">{generationError}</p>
          {generationErrorDetails.length > 0 && (
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs">
              {generationErrorDetails.map((detail, idx) => (
                <li key={idx}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {generatedPaper && <section id="generated-paper" className="space-y-4 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div><span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Generated question paper and scheme</span><h2 className="mt-1 text-xl font-bold text-slate-900">{generatedPaper.title}</h2><p className="mt-1 text-sm text-slate-500">{generatedPaper.subject} · {generatedPaper.questions.length} questions · {generatedPaper.totalMarks} marks · {generatedPaper.durationMinutes} minutes</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { document.body.dataset.printTarget = "student"; window.print(); delete document.body.dataset.printTarget; }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Print student paper</button><button type="button" onClick={() => { document.body.dataset.printTarget = "scheme"; window.print(); delete document.body.dataset.printTarget; }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Print evaluation scheme</button></div>
        </div>
        {!generatedPaper.persisted && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Paper generated successfully. Configure the Supabase service role key to save papers to your database.</p>}
        <div className="flex gap-2 border-b border-slate-200 print:hidden">
          <button type="button" onClick={() => setPreviewTab("student")} className={`border-b-2 px-3 py-2 text-xs font-semibold transition sm:text-sm ${previewTab === "student" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>Student Question Paper</button>
          <button type="button" onClick={() => setPreviewTab("scheme")} className={`border-b-2 px-3 py-2 text-xs font-semibold transition sm:text-sm ${previewTab === "scheme" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>Scheme of Evaluation</button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 print:hidden"><PaperPrintable paper={generatedPaper} scheme={previewTab === "scheme"} /></div>
        <div className="print-student"><PaperPrintable paper={generatedPaper} scheme={false} /></div><div className="print-scheme"><PaperPrintable paper={generatedPaper} scheme /></div>
      </section>}
    </form>
  );
}

function PaperPrintable({ paper, scheme }: { paper: GeneratedPaper; scheme: boolean }) {
  return <article className="paper-print mx-auto max-w-3xl bg-white p-6 text-black sm:p-10">
    <header className="mb-6 border-b-2 border-black pb-4 text-center"><h1 className="text-xl font-bold">{paper.title}</h1><p>{paper.subject} · {paper.durationMinutes} minutes · {paper.totalMarks} marks</p><p className="mt-1 text-sm font-semibold">{scheme ? "Scheme of Evaluation" : "Student Question Paper"}</p>{!scheme && <p className="mt-3 text-left text-sm">Name: ______________________________ &nbsp; Date: ______________</p>}</header>
    {paper.blueprint.sections.map((section) => <section key={section.name} className="mb-6 break-inside-avoid"><h2 className="mb-2 text-base font-bold">{section.name} <span className="font-normal">(Answer any {section.answerCount} of {section.questionCount}; {section.marksPerQuestion} marks each)</span></h2><ol className="space-y-5">{paper.questions.filter((question) => question.sectionName?.toLowerCase() === section.name.toLowerCase()).map((question) => <li key={`${section.name}-${question.sectionQuestionNumber}`} className="break-inside-avoid"><div className="flex justify-between gap-4"><p>{question.sectionQuestionNumber}. {question.questionText}</p><span className="shrink-0">[{question.marks}]</span></div>{question.options.length > 0 && <ol className="ml-8 mt-2 list-[upper-alpha]">{question.options.map((option) => <li key={option.id}>{option.text}</li>)}</ol>}{scheme ? <div className="mt-2 text-sm"><p><strong>Answer:</strong> {question.correctAnswer}</p><p><strong>Explanation:</strong> {question.explanation}</p><p><strong>Marking criteria:</strong> {question.markingCriteria.join("; ")}</p></div> : <div className="mt-3 space-y-5">{Array.from({ length: Math.max(1, Math.min(6, question.marks)) }, (_, index) => <div key={index} className="h-6 border-b border-slate-400" />)}</div>}</li>)}</ol></section>)}
  </article>;
}
