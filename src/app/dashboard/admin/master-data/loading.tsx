import React from "react";
import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col h-screen w-full bg-[#f8fafc]">
      <div className="flex items-center justify-between p-4 bg-white border-b border-[#e4e8f0]">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="w-48 h-6" />
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col p-6">
        <SkeletonTable rows={10} columns={4} />
      </div>
    </div>
  );
}
