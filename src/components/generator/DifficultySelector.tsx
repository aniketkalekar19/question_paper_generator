"use client";

import React from "react";
import { DifficultyLevel } from "@/types/questionPaper.types";

interface DifficultySelectorProps {
  difficulty: DifficultyLevel;
  onChange: (diff: DifficultyLevel) => void;
}

const DIFFICULTY_CONFIG: {
  id: DifficultyLevel;
  label: string;
  badgeClass: string;
  activeBorder: string;
  description: string;
}[] = [
  {
    id: "easy",
    label: "Easy",
    badgeClass: "bg-emerald-100 text-emerald-800",
    activeBorder: "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/40",
    description: "Focus on definitions, recall, and direct foundational principles.",
  },
  {
    id: "medium",
    label: "Medium",
    badgeClass: "bg-amber-100 text-amber-800",
    activeBorder: "border-amber-500 ring-1 ring-amber-500 bg-amber-50/40",
    description: "Balanced conceptual comprehension, applications, and reasoning.",
  },
  {
    id: "hard",
    label: "Hard",
    badgeClass: "bg-rose-100 text-rose-800",
    activeBorder: "border-rose-500 ring-1 ring-rose-500 bg-rose-50/40",
    description: "Complex derivations, multi-step scenarios, and advanced evaluation.",
  },
];

export function DifficultySelector({
  difficulty,
  onChange,
}: DifficultySelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
        Assessment Difficulty
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        {DIFFICULTY_CONFIG.map((item) => {
          const isSelected = difficulty === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? item.activeBorder
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">
                  {item.label}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.badgeClass}`}
                >
                  {item.id.toUpperCase()}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
