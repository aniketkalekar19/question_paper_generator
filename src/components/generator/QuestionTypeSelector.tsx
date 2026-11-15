"use client";

import React from "react";
import { CheckCircleIcon } from "@/components/ui/Icons";

export type QuestionTypeOption = "mcq" | "short_answer" | "long_answer";

interface QuestionTypeSelectorProps {
  selectedTypes: QuestionTypeOption[];
  onToggleType: (type: QuestionTypeOption) => void;
}

const QUESTION_TYPE_CONFIG = [
  {
    id: "mcq" as const,
    label: "MCQ",
    fullTitle: "Multiple Choice Questions",
    description: "Objective items with 4 options and a single correct answer.",
    markGuide: "1 - 2 marks",
  },
  {
    id: "short_answer" as const,
    label: "Short Answer",
    fullTitle: "Conceptual Short Questions",
    description: "Concise definitions, comparisons, and core explanations.",
    markGuide: "2 - 5 marks",
  },
  {
    id: "long_answer" as const,
    label: "Long Answer",
    fullTitle: "Descriptive & Analytical",
    description: "Detailed problem-solving, derivations, and case studies.",
    markGuide: "5 - 10+ marks",
  },
];

export function QuestionTypeSelector({
  selectedTypes,
  onToggleType,
}: QuestionTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Question Types Included
        </label>
        <span className="text-xs text-slate-400">Select one or more</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {QUESTION_TYPE_CONFIG.map((item) => {
          const isSelected = selectedTypes.includes(item.id);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggleType(item.id)}
              className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? "border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.label}
                  </span>
                  {isSelected && (
                    <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <h4 className="mt-2 text-sm font-semibold text-slate-900">
                  {item.fullTitle}
                </h4>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] font-medium text-slate-500">
                Typical: {item.markGuide}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
