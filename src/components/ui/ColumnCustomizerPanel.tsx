"use client";
import React, { useState, useEffect, useRef } from "react";
import { X, GripVertical, RotateCcw, Globe, Search, Eye, EyeOff } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  ColumnDef,
  ColumnCategory,
  COLUMN_CATEGORIES,
  useColumnPrefs,
} from "@/hooks/useColumnPrefs";

interface ColumnCustomizerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnDef[];
  visibleColumns: ColumnDef[];
  isAdmin: boolean;
  toggleColumn: (key: string) => void;
  reorderColumns: (from: number, to: number) => void;
  resetToDefault: () => void;
  publishAsOrgDefault: () => Promise<void>;
}

export function ColumnCustomizerPanel({
  isOpen,
  onClose,
  columns,
  isAdmin,
  toggleColumn,
  reorderColumns,
  resetToDefault,
  publishAsOrgDefault,
}: ColumnCustomizerPanelProps) {
  const [search, setSearch] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-focus search when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 310);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Sort by current order for display
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  // Filter by search query
  const filtered = search
    ? sortedColumns.filter((c) =>
        c.label.toLowerCase().includes(search.toLowerCase()) ||
        COLUMN_CATEGORIES.find((cat) => cat.key === c.category)
          ?.label.toLowerCase()
          .includes(search.toLowerCase())
      )
    : sortedColumns;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    // Map filtered index back to full sorted order index
    const fromCol = filtered[result.source.index];
    const toCol = filtered[result.destination.index];
    const fromIdx = sortedColumns.findIndex((c) => c.key === fromCol.key);
    const toIdx = sortedColumns.findIndex((c) => c.key === toCol.key);
    if (fromIdx !== toIdx) reorderColumns(fromIdx, toIdx);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await publishAsOrgDefault();
    } finally {
      setIsPublishing(false);
    }
  };

  // Group filtered columns by category
  const grouped: Partial<Record<ColumnCategory, ColumnDef[]>> = {};
  for (const col of filtered) {
    if (!grouped[col.category]) grouped[col.category] = [];
    grouped[col.category]!.push(col);
  }

  const visibleCount = columns.filter((c) => c.visible).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-[#133255]/25 backdrop-blur-[2px] transition-opacity duration-200"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Customise columns"
        className="fixed top-0 right-0 bottom-0 z-50 w-[340px] bg-white shadow-[−4px_0_40px_rgba(19,50,85,0.18)] flex flex-col transition-transform duration-300"
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transitionTimingFunction: isOpen
            ? "cubic-bezier(0.16,1,0.3,1)"
            : "cubic-bezier(0.55,0,1,0.45)",
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-[#133255] px-5 py-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-white font-bold text-[16px] tracking-tight">Customise View</h2>
            <button
              onClick={onClose}
              aria-label="Close customiser"
              className="text-white/70 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-[#a8c0dc] text-[12px]">
            {visibleCount} of {columns.length} columns shown · Drag to reorder
          </p>
        </div>

        {/* Search */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-[#e4e8f0] bg-[#f8fafc]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7a99]" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search columns..."
              className="w-full pl-8 pr-3 py-2 text-[13.5px] neo-inset outline-none transition-colors"
            />
          </div>
        </div>

        {/* Column list */}
        <div className="flex-1 overflow-y-auto py-2">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="col-customizer">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {COLUMN_CATEGORIES.map((cat) => {
                    const cols = grouped[cat.key];
                    if (!cols || cols.length === 0) return null;
                    return (
                      <div key={cat.key}>
                        {/* Category heading */}
                        <div className="flex items-center gap-2 px-4 py-2 mt-1">
                          <span className="text-[11px]">{cat.icon}</span>
                          <span className="text-[11px] font-bold uppercase tracking-widest text-[#6b7a99]">
                            {cat.label}
                          </span>
                          <div className="flex-1 h-[1px] bg-[#eef1f7]" />
                        </div>
                        {cols.map((col) => {
                          const globalIdx = sortedColumns.findIndex((c) => c.key === col.key);
                          return (
                            <Draggable key={col.key} draggableId={col.key} index={globalIdx}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                                    snapshot.isDragging
                                      ? "bg-[#f0f5ff] shadow-lg rounded-xl mx-2"
                                      : "neo-row-hover"
                                  }`}
                                >
                                  {/* Drag grip */}
                                  <div
                                    {...provided.dragHandleProps}
                                    aria-label="Drag to reorder"
                                    className="text-[#ccd3df] hover:text-[#6b7a99] cursor-grab active:cursor-grabbing transition-colors flex-shrink-0"
                                  >
                                    <GripVertical size={14} />
                                  </div>

                                  {/* Column label */}
                                  <span className={`flex-1 text-[13.5px] ${col.visible ? "text-[#111] font-medium" : "text-[#6b7a99]"}`}>
                                    {col.label}
                                  </span>

                                  {/* Toggle switch */}
                                  <button
                                    role="switch"
                                    aria-checked={col.visible}
                                    aria-label={`Toggle ${col.label} column`}
                                    onClick={() => toggleColumn(col.key)}
                                    className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#133255] rounded-full"
                                  >
                                    <span
                                      className={`relative inline-flex h-5 w-9 rounded-full transition-colors duration-200 ${
                                        col.visible ? "bg-[#133255]" : "bg-[#dde3ee]"
                                      }`}
                                    >
                                      <span
                                        className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
                                        style={{
                                          transform: col.visible ? "translateX(16px)" : "translateX(0)",
                                          transition: "transform 200ms cubic-bezier(0.34,1.56,0.64,1)",
                                        }}
                                      />
                                    </span>
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                      </div>
                    );
                  })}
                  {provided.placeholder}
                  {filtered.length === 0 && (
                    <div className="text-center py-8 text-[13px] text-[#6b7a99]">
                      No columns match &ldquo;{search}&rdquo;
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* Footer actions */}
        <div className="flex-shrink-0 border-t border-[#e4e8f0] p-4 bg-[#f8fafc] flex flex-col gap-2">
          <button
            onClick={resetToDefault}
            className="flex items-center justify-center gap-2 w-full py-2 text-[13.5px] font-semibold text-[#6b7a99] neo-btn hover:text-[#133255] transition-all"
          >
            <RotateCcw size={13} />
            Reset to Default
          </button>
          {isAdmin && (
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center justify-center gap-2 w-full py-2 text-[13.5px] font-bold text-[#133255] neo-btn transition-all disabled:opacity-50"
            >
              <Globe size={13} />
              {isPublishing ? "Publishing…" : "Publish as Org Default"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
