"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon, SparklesIcon, FileTextIcon } from "@/components/ui/Icons";
import { isSupabaseConfigured } from "@/lib/validations/env";

interface SidebarProps {
  onNavigate?: () => void;
}

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: DashboardIcon,
  },
  {
    name: "Generate Paper",
    href: "/generate",
    icon: SparklesIcon,
  },
];

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm ring-1 ring-slate-800">
          <FileTextIcon className="h-5 w-5 text-blue-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-slate-900">
            PaperGen AI
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            CIA-P Project Suite
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <nav className="space-y-1.5">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/dashboard" && pathname === "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive
                      ? "text-blue-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Project Context Box */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
          {isSupabaseConfigured() ? (
            <>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-700">
                  Database Connected
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Supabase PostgreSQL active for academic paper generation.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs font-semibold text-slate-700">
                  Instant Generation Mode
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Papers generate without database persistence until Supabase is configured.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
            ED
          </div>
          <div className="flex flex-col truncate">
            <span className="truncate text-xs font-medium text-slate-800">
              Academic Assessment
            </span>
            <span className="text-[10px] text-slate-400">
              Exam Controller Mode
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
