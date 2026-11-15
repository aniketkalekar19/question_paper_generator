import React from "react";
import Link from "next/link";
import { QuestionPaperSummary } from "@/types/questionPaper.types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDuration, formatMarks } from "@/lib/utils";

interface PaperListProps {
  papers: QuestionPaperSummary[];
}

export function PaperList({ papers }: PaperListProps) {
  if (papers.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-slate-500 text-sm">
          No question papers found in the database.
        </p>
        <div className="mt-4">
          <Link
            href="/generate"
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Create Your First Paper
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {papers.map((paper) => (
        <Card key={paper.id} className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <Badge variant="info">{paper.subject}</Badge>
              {paper.difficulty && (
                <span className="text-xs text-slate-500 uppercase font-semibold">
                  {paper.difficulty}
                </span>
              )}
            </div>
            <h4 className="mt-2 text-base font-semibold text-slate-900">
              {paper.title}
            </h4>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>{formatMarks(paper.totalMarks)}</span>
            <span>{formatDuration(paper.durationMinutes)}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
