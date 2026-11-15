import React from "react";
import { AlertCircleIcon } from "@/components/ui/Icons";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  isError?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  isError = false,
}: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 shadow-sm transition hover:shadow-md ${
        isError
          ? "border-amber-200 bg-amber-50/20"
          : "border-slate-200/90 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${
            isError
              ? "bg-amber-50 text-amber-600 ring-amber-200"
              : "bg-blue-50 text-blue-600 ring-blue-100"
          }`}
        >
          {isError ? (
            <AlertCircleIcon className="h-5 w-5" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>
      </div>

      <div className="mt-4">
        <div
          className={`text-2xl font-bold tracking-tight sm:text-3xl ${
            isError ? "text-amber-800" : "text-slate-900"
          }`}
        >
          {value}
        </div>
        <p
          className={`mt-1 text-xs ${
            isError ? "text-amber-700 font-medium" : "text-slate-500"
          }`}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
