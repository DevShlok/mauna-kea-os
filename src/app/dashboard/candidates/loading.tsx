import React from "react";

/**
 * Skeleton loader that closely matches the real CandidatesClient layout.
 * Uses animate-pulse shimmer so the page feels responsive while data loads.
 * aria-busy="true" signals to screen readers that content is loading.
 */

function SkeletonBox({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`bg-[#e9edf5] rounded animate-pulse ${className || ""}`} style={style} />;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[#eef1f7]">
      {/* Checkbox */}
      <td className="px-4 py-4 w-10">
        <SkeletonBox className="w-[18px] h-[18px] rounded-[4px]" />
      </td>
      {/* Name + avatar */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <SkeletonBox className="w-10 h-10 rounded-[10px] flex-shrink-0" />
          <div className="flex flex-col gap-1.5">
            <SkeletonBox className="h-3.5 w-32" />
            <SkeletonBox className="h-3 w-24 opacity-60" />
          </div>
        </div>
      </td>
      {/* Other cells — varying widths for realism */}
      {[90, 130, 120, 100, 110, 80, 90].map((w, i) => (
        <td key={i} className="px-4 py-4">
          <SkeletonBox className="h-3.5" style={{ width: w } as any} />
        </td>
      ))}
      {/* Status badge */}
      <td className="px-4 py-4">
        <SkeletonBox className="h-7 w-20 rounded-[8px]" />
      </td>
    </tr>
  );
}

export default function Loading() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 pb-10 pt-6" aria-busy="true" aria-label="Loading candidates">

      {/* ── Page header skeleton ─────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex flex-col gap-2">
          <SkeletonBox className="h-7 w-56" />
          <SkeletonBox className="h-3.5 w-40 opacity-60" />
        </div>
        <div className="flex items-center gap-2.5">
          {[110, 120, 110, 130].map((w, i) => (
            <SkeletonBox key={i} className="h-10 rounded-[10px]" style={{ width: w } as any} />
          ))}
        </div>
      </div>

      {/* ── KPI pills skeleton ───────────────────────────── */}
      <div className="flex items-center gap-3 mb-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 min-w-[120px] bg-[#f4f7fd] border border-[#e4e8f0] rounded-[14px] px-4 py-3">
            <SkeletonBox className="h-3 w-16 mb-2 opacity-60" />
            <SkeletonBox className="h-6 w-10" />
          </div>
        ))}
      </div>

      {/* ── Search / filter bar skeleton ────────────────── */}
      <SkeletonBox className="h-14 w-full rounded-[16px] mb-5" />

      {/* ── Table skeleton ───────────────────────────────── */}
      <div
        className="bg-white border border-[#e4e8f0] rounded-[16px] overflow-hidden"
        aria-hidden="true"
      >
        {/* Table header */}
        <div className="bg-[#fafbfd] border-b-2 border-[#e4e8f0] px-4 py-3 flex items-center gap-6">
          <SkeletonBox className="w-[18px] h-[18px] rounded-[4px]" />
          {[80, 100, 140, 130, 90, 100, 90, 70].map((w, i) => (
            <SkeletonBox key={i} className="h-3 opacity-60" style={{ width: w } as any} />
          ))}
        </div>
        {/* Table rows */}
        <table className="w-full border-collapse">
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination skeleton ──────────────────────────── */}
      <div className="flex items-center justify-between mt-4 px-1">
        <SkeletonBox className="h-4 w-36 opacity-60" />
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonBox key={i} className="h-9 w-9 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
