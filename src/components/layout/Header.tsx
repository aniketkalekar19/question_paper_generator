"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, PlusIcon } from "@/components/ui/Icons";

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === "/generate") return "Generate Question Paper";
    return "Dashboard Overview";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      {/* Left: Mobile Menu Button & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none lg:hidden"
          aria-label="Open navigation sidebar"
        >
          <MenuIcon className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-medium text-slate-400 sm:inline">
            Workspace /
          </span>
          <h1 className="text-sm font-semibold text-slate-900 sm:text-base">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Quick Action Button */}
      <div className="flex items-center gap-3">
        {pathname !== "/generate" && (
          <Link
            href="/generate"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:text-sm"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Generate New Paper</span>
          </Link>
        )}
      </div>
    </header>
  );
}
