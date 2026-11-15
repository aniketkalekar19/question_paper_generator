import React from "react";
import { GeneratePaperForm } from "@/components/generator/GeneratePaperForm";

export default function GeneratePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page Title & Context */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Generate Question Paper
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload syllabus materials, customize cognitive difficulty, and configure the exam blueprint.
        </p>
      </div>

      {/* Main Generator Form */}
      <GeneratePaperForm />
    </div>
  );
}
