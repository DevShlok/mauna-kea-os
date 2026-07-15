"use client";
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import type { SortDir } from "@/hooks/useDataTable";

interface SortableHeaderProps {
  label: string;
  colKey: string;
  sortKey: string | null;
  sortDir: SortDir;
  toggleSort: (key: any) => void;
  className?: string;
}

export function SortableHeader({
  label,
  colKey,
  sortKey,
  sortDir,
  toggleSort,
  className = "",
}: SortableHeaderProps) {
  const isActive = sortKey === colKey;

  return (
    <th
      className={`px-4 py-4 text-left text-[13px] font-bold text-[#8a93a3] uppercase tracking-wider cursor-pointer select-none hover:text-[#133255] hover:bg-[#f8fafc] transition-colors group ${className}`}
      onClick={() => toggleSort(colKey)}
    >
      <div className="flex items-center gap-1.5">
        <span className={isActive ? "text-[#133255]" : ""}>{label}</span>
        <span className={`flex-shrink-0 transition-colors ${isActive ? "text-[#133255]" : "text-[#c8d0de] group-hover:text-[#8a93a3]"}`}>
          {isActive && sortDir === "asc" ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : isActive && sortDir === "desc" ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5" />
          )}
        </span>
      </div>
    </th>
  );
}
