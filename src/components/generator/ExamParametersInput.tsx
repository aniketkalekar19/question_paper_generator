"use client";

import React from "react";

interface ExamParametersInputProps {
  totalMarks: number;
  onTotalMarksChange: (val: number) => void;
  questionCount: number;
  onQuestionCountChange: (val: number) => void;
  durationMinutes: number;
  onDurationChange: (val: number) => void;
}

const MARKS_PRESETS = [25, 50, 75, 100];
const QUESTIONS_PRESETS = [5, 10, 15, 20];
const DURATION_PRESETS = [30, 60, 90, 180];

export function ExamParametersInput({
  totalMarks,
  onTotalMarksChange,
  questionCount,
  onQuestionCountChange,
  durationMinutes,
  onDurationChange,
}: ExamParametersInputProps) {
  return (
    <div className="space-y-4">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
        Exam Blueprint Parameters
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total Marks */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <label
            htmlFor="totalMarksInput"
            className="block text-xs font-semibold text-slate-700"
          >
            Total Marks
          </label>
          <input
            id="totalMarksInput"
            type="number"
            min={5}
            max={500}
            value={totalMarks}
            onChange={(e) => onTotalMarksChange(Number(e.target.value))}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {MARKS_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onTotalMarksChange(p)}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition ${
                  totalMarks === p
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p}m
              </button>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <label
            htmlFor="questionCountInput"
            className="block text-xs font-semibold text-slate-700"
          >
            Question Count
          </label>
          <input
            id="questionCountInput"
            type="number"
            min={1}
            max={40}
            value={questionCount}
            onChange={(e) => onQuestionCountChange(Number(e.target.value))}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUESTIONS_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onQuestionCountChange(p)}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition ${
                  questionCount === p
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p} Qs
              </button>
            ))}
          </div>
        </div>

        {/* Exam Duration */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <label
            htmlFor="durationInput"
            className="block text-xs font-semibold text-slate-700"
          >
            Duration (Minutes)
          </label>
          <input
            id="durationInput"
            type="number"
            min={10}
            max={360}
            value={durationMinutes}
            onChange={(e) => onDurationChange(Number(e.target.value))}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DURATION_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onDurationChange(p)}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition ${
                  durationMinutes === p
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p} min
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
