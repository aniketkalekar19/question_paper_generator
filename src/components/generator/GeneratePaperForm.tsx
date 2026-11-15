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

export function GeneratePaperForm() {
  // Form State
  const [subject, setSubject] = useState("");
  const [paperTitle, setPaperTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");

  // Source Material
  const [sourceType, setSourceType] = useState<MaterialSourceType>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");

  // Question Types & Difficulty
  const [selectedTypes, setSelectedTypes] = useState<QuestionTypeOption[]>([
    "mcq",
    "short_answer",
  ]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");

  // Exam Parameters
  const [totalMarks, setTotalMarks] = useState(50);
  const [questionCount, setQuestionCount] = useState(15);
  const [durationMinutes, setDurationMinutes] = useState(90);

  // UI Feedback State (Authentic UI only)
  const [errors, setErrors] = useState<string[]>([]);
  const [validatedSuccess, setValidatedSuccess] = useState(false);

  const toggleQuestionType = (type: QuestionTypeOption) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length === 1) return; // keep at least one
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: string[] = [];

    if (!subject.trim()) {
      validationErrors.push("Please enter a Subject name.");
    }

    if (sourceType === "upload" && !file) {
      validationErrors.push("Please upload a PDF document or switch to the 'Paste Study Material' tab.");
    }

    if (sourceType === "paste" && pastedText.trim().length < 15) {
      validationErrors.push("Please paste study material (minimum 15 characters).");
    }

    if (selectedTypes.length === 0) {
      validationErrors.push("Please select at least one question type (MCQ, Short Answer, or Long Answer).");
    }

    if (totalMarks <= 0) {
      validationErrors.push("Total marks must be greater than 0.");
    }

    if (questionCount <= 0) {
      validationErrors.push("Question count must be greater than 0.");
    }

    if (durationMinutes <= 0) {
      validationErrors.push("Exam duration must be greater than 0 minutes.");
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setValidatedSuccess(false);
      return;
    }

    setErrors([]);
    setValidatedSuccess(true);
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
              Parameters are ready for the Gemini AI generation pipeline. (AI integration scheduled for the next phase).
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

      {/* Submit Action Bar */}
      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-600">
          <span className="font-semibold text-slate-900">Blueprint Summary:</span>{" "}
          {subject || "Untitled Subject"} &bull; {questionCount} Questions &bull; {totalMarks} Marks &bull; {durationMinutes} Mins
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <SparklesIcon className="h-4 w-4 text-blue-400" />
          <span>Generate Question Paper</span>
        </button>
      </div>
    </form>
  );
}
