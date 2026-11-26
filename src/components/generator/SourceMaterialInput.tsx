"use client";

import React, { useRef } from "react";
import { UploadCloudIcon, FileTextIcon, TrashIcon } from "@/components/ui/Icons";

export type MaterialSourceType = "upload" | "paste";

interface SourceMaterialInputProps {
  sourceType: MaterialSourceType;
  onSourceTypeChange: (type: MaterialSourceType) => void;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  pastedText: string;
  onPastedTextChange: (text: string) => void;
}

export function SourceMaterialInput({
  sourceType,
  onSourceTypeChange,
  file,
  onFileSelect,
  pastedText,
  onPastedTextChange,
}: SourceMaterialInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type === "application/pdf" && selected.size <= 7.5 * 1024 * 1024) onFileSelect(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.type === "application/pdf" && selected.size <= 7.5 * 1024 * 1024) onFileSelect(selected);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const wordCount = pastedText.trim() === "" ? 0 : pastedText.trim().split(/\s+/).length;

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => onSourceTypeChange("upload")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
            sourceType === "upload"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <UploadCloudIcon className="h-4 w-4" />
          <span>Upload PDF Document</span>
        </button>

        <button
          type="button"
          onClick={() => onSourceTypeChange("paste")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
            sourceType === "paste"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileTextIcon className="h-4 w-4" />
          <span>Paste Study Material</span>
        </button>
      </div>

      {/* PDF Upload UI */}
      {sourceType === "upload" && (
        <div>
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50/30"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <UploadCloudIcon className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-800">
                Click to browse or drag and drop your PDF
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Course syllabi, lecture notes, textbook chapters (PDF up to 7.5 MB)
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <FileTextIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onFileSelect(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-red-600 transition"
                title="Remove file"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Paste Study Material Option */}
      {sourceType === "paste" && (
        <div className="space-y-2">
          <div className="relative">
            <textarea
              rows={7}
              value={pastedText}
              onChange={(e) => onPastedTextChange(e.target.value)}
              placeholder="Paste syllabus modules, study guides, topic summaries, or lesson notes here..."
              className="w-full rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Minimum 50 words recommended for accurate questions.</span>
            <span className="font-medium text-slate-700">{wordCount} words</span>
          </div>
        </div>
      )}
    </div>
  );
}
