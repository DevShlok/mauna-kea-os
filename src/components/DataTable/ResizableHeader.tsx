"use client";
import React, { useRef } from "react";
import { ColumnDef } from "@/hooks/useColumnPrefs";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

interface ResizableHeaderProps {
  col: ColumnDef;
  children: React.ReactNode;
  onWidthChange: (key: string, width: number) => void;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  className?: string;
  
  // Drag and Drop props
  onColumnDragStart?: (key: string) => void;
  onColumnDrop?: (sourceKey: string, targetKey: string) => void;
  dragTargetPosition?: "left" | "right" | null;
  dragOverKey?: string | null;
  setDragOverKey?: (key: string | null) => void;
  setDragTargetPosition?: (pos: "left" | "right" | null) => void;
}

export function ResizableHeader({
  col,
  children,
  onWidthChange,
  sortKey,
  sortDir,
  onSort,
  className = "",
  
  onColumnDragStart,
  onColumnDrop,
  dragTargetPosition,
  dragOverKey,
  setDragOverKey,
  setDragTargetPosition,
}: ResizableHeaderProps) {
  const isResizing = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = col.width;

    const onMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = e.clientX - startX;
      const newWidth = Math.max(60, startWidth + delta);
      onWidthChange(col.key, newWidth);
    };

    const onUp = () => {
      isResizing.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const isSorted = sortKey === col.key;
  const isDragTarget = dragOverKey === col.key;

  return (
    <th
      draggable={!isResizing.current}
      onDragStart={(e) => {
        if (isResizing.current) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", col.key);
        onColumnDragStart?.(col.key);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const rect = e.currentTarget.getBoundingClientRect();
        const midPoint = rect.left + rect.width / 2;
        const position = e.clientX < midPoint ? "left" : "right";
        if (dragTargetPosition !== position || dragOverKey !== col.key) {
          setDragOverKey?.(col.key);
          setDragTargetPosition?.(position);
        }
      }}
      onDragLeave={() => {
        setDragOverKey?.(null);
        setDragTargetPosition?.(null);
      }}
      onDrop={(e) => {
        e.preventDefault();
        const sourceKey = e.dataTransfer.getData("text/plain");
        if (sourceKey && sourceKey !== col.key) {
          onColumnDrop?.(sourceKey, col.key);
        }
        setDragOverKey?.(null);
        setDragTargetPosition?.(null);
      }}
      style={{ width: col.width, minWidth: Math.min(col.width, 60), maxWidth: col.width }}
      className={`relative select-none px-4 py-3 text-center text-[11.5px] font-bold uppercase tracking-wider text-[#6b7a99] bg-[#fafbfd] border-b-2 border-r border-[#e4e8f0] whitespace-nowrap transition-colors cursor-grab active:cursor-grabbing ${className} ${
        isDragTarget && dragTargetPosition === "left" ? "shadow-[inset_4px_0_0_#1d4ed8]" : ""
      } ${
        isDragTarget && dragTargetPosition === "right" ? "shadow-[inset_-4px_0_0_#1d4ed8]" : ""
      }`}
    >
      <div
        className={`flex items-center justify-center gap-1 ${col.sortable && onSort ? "hover:text-[#133255] transition-colors" : ""}`}
        onClick={() => col.sortable && onSort?.(col.key)}
        role={col.sortable ? "button" : undefined}
      >
        {children}
        {col.sortable && (
          <span className="opacity-60 ml-0.5 pointer-events-none">
            {isSorted ? (
              sortDir === "asc" ? (
                <ArrowUp size={11} />
              ) : (
                <ArrowDown size={11} />
              )
            ) : (
              <ArrowUpDown size={11} />
            )}
          </span>
        )}
      </div>

      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 bottom-0 w-[6px] cursor-col-resize z-10 group/resizer"
      >
        <div className="absolute inset-y-[20%] right-0 w-[2px] bg-transparent group-hover/resizer:bg-[#D8B15B] transition-colors duration-150 rounded-full" />
      </div>
    </th>
  );
}
