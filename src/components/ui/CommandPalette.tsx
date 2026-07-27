"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, User, Settings, Upload, Download, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { searchCandidatesAction } from "@/actions";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCustomiser: () => void;
  onOpenImport: () => void;
  onOpenAddCandidate: () => void;
  onExport: () => void;
}

/**
 * ⌘K command palette — live candidate search + quick actions.
 * Opens as a centered overlay; keyboard-navigable.
 */
export function CommandPalette({
  isOpen,
  onClose,
  onOpenCustomiser,
  onOpenImport,
  onOpenAddCandidate,
  onExport,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const quickActions: QuickAction[] = [
    {
      id: "customise",
      label: "Customise columns",
      icon: <Settings size={15} />,
      description: "Choose which columns to show",
      onSelect: () => { onOpenCustomiser(); onClose(); },
    },
    {
      id: "import",
      label: "Import from Excel",
      icon: <Upload size={15} />,
      description: "Bulk import candidates via spreadsheet",
      onSelect: () => { onOpenImport(); onClose(); },
    },
    {
      id: "export",
      label: "Export to Excel",
      icon: <Download size={15} />,
      description: "Download current view as .xlsx",
      onSelect: () => { onExport(); onClose(); },
    },
    {
      id: "add",
      label: "Add new candidate",
      icon: <Plus size={15} />,
      description: "Manually create a candidate profile",
      onSelect: () => { onOpenAddCandidate(); onClose(); },
    },
  ];

  const filteredActions = query
    ? quickActions.filter(
        (a) =>
          a.label.toLowerCase().includes(query.toLowerCase()) ||
          a.description?.toLowerCase().includes(query.toLowerCase())
      )
    : quickActions;

  // Total navigable items = candidates + actions
  const totalItems = candidates.length + filteredActions.length;

  // Live candidate search with 300ms debounce
  useEffect(() => {
    if (!query.trim()) {
      setCandidates([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const result = await searchCandidatesAction(query);
        setCandidates(result.data ?? []);
      } catch {
        setCandidates([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [query]);

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setCandidates([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, totalItems - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeIndex < candidates.length) {
          const c = candidates[activeIndex];
          router.push(`/dashboard/candidates/${c.id}`);
          onClose();
        } else {
          const action = filteredActions[activeIndex - candidates.length];
          action?.onSelect();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [activeIndex, candidates, filteredActions, router, onClose, totalItems]
  );

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Opened externally by parent — this component just handles the close
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4"
      aria-modal="true"
      role="dialog"
      aria-label="Command palette"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#133255]/40 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-[560px] bg-white rounded-2xl shadow-[0_30px_80px_rgba(19,50,85,0.3)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
        style={{ zIndex: 1 }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#eef1f7]">
          <Search size={18} className="text-[#6b7a99] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search candidates, columns, actions…"
            className="flex-1 text-[15px] text-[#111] outline-none placeholder-[#94a3b8]"
            role="combobox"
            aria-expanded={totalItems > 0}
            aria-autocomplete="list"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setCandidates([]); }}
              className="text-[#94a3b8] hover:text-[#6b7a99] transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="text-[11px] font-bold text-[#94a3b8] border border-[#e4e8f0] rounded px-1.5 py-0.5 hidden sm:block">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto" role="listbox">
          {/* Candidate results */}
          {(candidates.length > 0 || isSearching) && (
            <div className="py-1">
              <div className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">
                Candidates
              </div>
              {isSearching ? (
                <div className="px-4 py-3 text-[13.5px] text-[#94a3b8] animate-pulse">
                  Searching…
                </div>
              ) : (
                candidates.map((c, i) => (
                  <button
                    key={c.id}
                    role="option"
                    aria-selected={activeIndex === i}
                    onClick={() => { router.push(`/dashboard/candidates/${c.id}`); onClose(); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeIndex === i ? "bg-[#f0f5ff]" : "hover:bg-[#f8fafc]"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-[8px] bg-[#133255] flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0">
                      {c.name?.slice(0, 2)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold text-[#111] truncate">{c.name}</div>
                      <div className="text-[12px] text-[#6b7a99] truncate">
                        {[c.designation, c.company].filter(Boolean).join(" · ") || c.id}
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        c.status === "Active"
                          ? "bg-[#e6f6ee] text-[#127a41]"
                          : c.status === "Passive"
                          ? "bg-[#fdf2d6] text-[#b7791f]"
                          : "bg-[#f1f3f6] text-[#697587]"
                      }`}
                    >
                      {c.status || "Active"}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Divider if both sections shown */}
          {candidates.length > 0 && filteredActions.length > 0 && (
            <div className="border-t border-[#eef1f7] mx-4" />
          )}

          {/* Quick actions */}
          {filteredActions.length > 0 && (
            <div className="py-1">
              <div className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">
                Quick Actions
              </div>
              {filteredActions.map((action, i) => {
                const idx = candidates.length + i;
                return (
                  <button
                    key={action.id}
                    role="option"
                    aria-selected={activeIndex === idx}
                    onClick={action.onSelect}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeIndex === idx ? "bg-[#f0f5ff]" : "hover:bg-[#f8fafc]"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-[8px] bg-[#f0f5ff] text-[#133255] flex items-center justify-center flex-shrink-0">
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-bold text-[#111]">{action.label}</div>
                      {action.description && (
                        <div className="text-[12px] text-[#6b7a99]">{action.description}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!isSearching && query && candidates.length === 0 && filteredActions.length === 0 && (
            <div className="px-4 py-8 text-center text-[13.5px] text-[#94a3b8]">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-[#eef1f7] px-4 py-2.5 flex items-center gap-4 bg-[#fafbfd]">
          <div className="flex items-center gap-1.5 text-[11px] text-[#94a3b8]">
            <kbd className="border border-[#e4e8f0] rounded px-1.5 py-0.5 font-bold">↑↓</kbd>
            navigate
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#94a3b8]">
            <kbd className="border border-[#e4e8f0] rounded px-1.5 py-0.5 font-bold">↵</kbd>
            select
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#94a3b8]">
            <kbd className="border border-[#e4e8f0] rounded px-1.5 py-0.5 font-bold">esc</kbd>
            close
          </div>
        </div>
      </div>
    </div>
  );
}
