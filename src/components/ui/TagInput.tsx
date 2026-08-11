"use client";

import React, { useState, useRef } from "react";
import { X, Plus, Tag as TagIcon } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onChange: (newTags: string[]) => void;
  placeholder?: string;
  presetSuggestions?: string[];
  maxTags?: number;
  readOnly?: boolean;
  label?: string;
  colorScheme?: "blue" | "gold" | "slate" | "emerald";
}

const DEFAULT_PRESETS = [
  "M&A",
  "FP&A",
  "Big4 Alum",
  "IFRS / IND-AS",
  "C-Suite Ready",
  "Crisis Turnaround",
  "Private Equity",
  "SaaS & Tech",
  "Automotive",
  "FMCG & Retail",
  "ESG & Governance",
  "IPO Experience",
];

export function TagInput({
  tags = [],
  onChange,
  placeholder = "Type tag and press Enter...",
  presetSuggestions = DEFAULT_PRESETS,
  maxTags = 20,
  readOnly = false,
  label,
  colorScheme = "blue",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const safeTags = Array.isArray(tags) ? tags : [];

  const handleAddTag = (rawTag: string) => {
    const trimmed = rawTag.trim();
    if (!trimmed) return;
    if (safeTags.length >= maxTags) return;

    // Avoid case-insensitive duplicates
    if (!safeTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...safeTags, trimmed]);
    }
    setInputValue("");
  };

  const handleRemoveTag = (indexToRemove: number) => {
    if (readOnly) return;
    onChange(safeTags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && safeTags.length > 0) {
      handleRemoveTag(safeTags.length - 1);
    }
  };

  // Available suggestions filtered by input text & excluding already selected tags
  const filteredSuggestions = presetSuggestions.filter((suggestion) => {
    const isAlreadyAdded = safeTags.some(
      (t) => t.toLowerCase() === suggestion.toLowerCase()
    );
    if (isAlreadyAdded) return false;
    if (!inputValue) return true;
    return suggestion.toLowerCase().includes(inputValue.toLowerCase());
  });

  const badgeStyles = {
    blue: "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100",
    gold: "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100",
    slate: "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  }[colorScheme];

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Main Tag Container */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={`min-h-[46px] p-2 rounded-2xl border transition-all flex flex-wrap items-center gap-1.5 cursor-text bg-white shadow-2xs ${
          isFocused
            ? "border-[#133255] ring-2 ring-[#133255]/10"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <TagIcon className="w-4 h-4 text-slate-400 ml-1.5 shrink-0" />

        {safeTags.map((tag, idx) => (
          <span
            key={idx}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${badgeStyles}`}
          >
            {tag}
            {!readOnly && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(idx);
                }}
                className="text-slate-400 hover:text-red-500 rounded-full p-0.5 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        {!readOnly && safeTags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={safeTags.length === 0 ? placeholder : "Add tag..."}
            className="flex-1 min-w-[120px] bg-transparent text-xs font-medium text-slate-800 placeholder-slate-400 outline-none px-2 py-1"
          />
        )}
      </div>

      {/* Preset Suggestions Dropdown / Quick Pills */}
      {!readOnly && isFocused && filteredSuggestions.length > 0 && (
        <div className="p-2 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap gap-1.5 max-h-36 overflow-y-auto animate-fade-in shadow-xs">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider w-full px-1 mb-1">
            Suggested Executive Tags:
          </span>
          {filteredSuggestions.slice(0, 10).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleAddTag(suggestion);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#133255] hover:text-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3 h-3 opacity-60" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
