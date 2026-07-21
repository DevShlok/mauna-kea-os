import React from "react";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number, columns?: number }) {
  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex bg-gray-50 p-4 border-b border-gray-200">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24 mr-4 last:mr-0" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex p-4 border-b border-gray-100 last:border-none items-center">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-4 w-full max-w-[120px] mr-4 last:mr-0" />
          ))}
        </div>
      ))}
    </div>
  );
}
