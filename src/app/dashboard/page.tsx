import React from "react";
import Link from "next/link";
import { QuestionPaperService } from "@/services/questionPaperService";
import { PracticeTestService } from "@/services/practiceTestService";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentPapersSection } from "@/components/dashboard/RecentPapersSection";
import { QuestionPaperSummary } from "@/types/questionPaper.types";
import { AttemptMetrics } from "@/types/practiceTest.types";
import {
  FileTextIcon,
  CheckCircleIcon,
  BarChartIcon,
  PlusIcon,
  AlertCircleIcon,
} from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Papers state
  let papers: QuestionPaperSummary[] = [];
  let papersError: string | null = null;

  // Test metrics state
  let testMetrics: AttemptMetrics | null = null;
  let metricsError: string | null = null;

  // Execute queries independently so one failure does not break the other
  const [papersOutcome, metricsOutcome] = await Promise.allSettled([
    QuestionPaperService.getAllQuestionPapers(),
    PracticeTestService.getAttemptMetrics(),
  ]);

  if (papersOutcome.status === "fulfilled") {
    papers = papersOutcome.value;
  } else {
    papersError =
      papersOutcome.reason instanceof Error
        ? papersOutcome.reason.message
        : "Failed to connect to generated papers database.";
  }

  if (metricsOutcome.status === "fulfilled") {
    const res = metricsOutcome.value;
    if (res.success && res.data) {
      testMetrics = res.data;
    } else {
      metricsError = res.error?.message || "Failed to retrieve test metrics.";
    }
  } else {
    metricsError =
      metricsOutcome.reason instanceof Error
        ? metricsOutcome.reason.message
        : "Failed to connect to test attempts database.";
  }

  const hasAnyError = Boolean(papersError || metricsError);

  return (
    <div className="space-y-8">
      {/* Welcome Heading Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of question paper generation and student practice evaluations.
          </p>
        </div>

        <Link
          href="/generate"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Generate New Paper</span>
        </Link>
      </div>

      {/* Database Connection Notice if Table/Connection not initialized */}
      {hasAnyError && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800">
          <AlertCircleIcon className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-900">
              Database Connectivity Notice
            </p>
            {papersError && (
              <p>
                <span className="font-medium">Question Papers:</span> {papersError}
              </p>
            )}
            {metricsError && (
              <p>
                <span className="font-medium">Test Attempts:</span> {metricsError}
              </p>
            )}
            <p className="pt-1 text-[11px] text-amber-700">
              Check that Supabase schema migrations have been applied and authentication sessions are active.
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Papers Card */}
        <StatCard
          title="Total Papers"
          value={papersError ? "—" : papers.length}
          subtitle={
            papersError
              ? "Unable to load papers count"
              : papers.length === 0
              ? "No papers generated yet"
              : `${papers.length} paper${papers.length > 1 ? "s" : ""} on record`
          }
          icon={FileTextIcon}
          isError={Boolean(papersError)}
        />

        {/* Tests Attempted Card */}
        <StatCard
          title="Tests Attempted"
          value={metricsError ? "—" : testMetrics ? testMetrics.count : "—"}
          subtitle={
            metricsError
              ? "Unable to load attempt count"
              : testMetrics && testMetrics.count === 0
              ? "No test attempts recorded yet"
              : testMetrics
              ? `${testMetrics.count} test session${testMetrics.count > 1 ? "s" : ""}`
              : "No data available"
          }
          icon={CheckCircleIcon}
          isError={Boolean(metricsError)}
        />

        {/* Average Score Card */}
        <StatCard
          title="Average Score"
          value={
            metricsError
              ? "—"
              : testMetrics && testMetrics.averageScore !== null
              ? testMetrics.averageScore
              : "N/A"
          }
          subtitle={
            metricsError
              ? "Unable to load score metrics"
              : testMetrics && testMetrics.averageScore !== null
              ? "Average score across completed tests"
              : "Calculated upon first student completion"
          }
          icon={BarChartIcon}
          isError={Boolean(metricsError)}
        />
      </div>

      {/* Recent Papers Section */}
      <RecentPapersSection papers={papers} />
    </div>
  );
}
