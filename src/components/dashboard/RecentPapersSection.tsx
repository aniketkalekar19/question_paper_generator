import React from "react";
import Link from "next/link";
import { QuestionPaperSummary } from "@/types/questionPaper.types";
import { FileTextIcon, PlusIcon, ClockIcon, AwardIcon } from "@/components/ui/Icons";
import { formatDuration, formatMarks } from "@/lib/utils";

interface RecentPapersSectionProps {
  papers: QuestionPaperSummary[];
}

export function RecentPapersSection({ papers }: RecentPapersSectionProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Recent Question Papers
          </h2>
          <p className="text-xs text-slate-500">
            Generated exam papers and active syllabus assessments
          </p>
        </div>

        <Link
          href="/generate"
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:self-auto"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Generate New Paper</span>
        </Link>
      </div>

      {/* Content */}
      {papers.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-200/80">
            <FileTextIcon className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-800">
            No question papers generated yet
          </h3>
          <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
            Set your subject, input syllabus material, and define marks distribution to generate your first academic paper.
          </p>
          <div className="mt-6">
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <PlusIcon className="h-4 w-4 text-blue-400" />
              <span>Generate Your First Paper</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Papers List */
        <div className="divide-y divide-slate-100">
          {papers.map((paper) => (
            <div
              key={paper.id}
              className="flex flex-col justify-between gap-4 p-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center"
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <FileTextIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {paper.title}
                    </h4>
                    {paper.difficulty && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                        {paper.difficulty}
                      </span>
                    )}
                    {paper.status && (
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                        {paper.status}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Subject: <span className="font-medium text-slate-700">{paper.subject}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 sm:justify-end">
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-slate-600">
                  <AwardIcon className="h-3.5 w-3.5 text-slate-400" />
                  {formatMarks(paper.totalMarks)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-slate-600">
                  <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
                  {formatDuration(paper.durationMinutes)}
                </span>
                <span className="text-[11px] text-slate-400">
                  {new Date(paper.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
