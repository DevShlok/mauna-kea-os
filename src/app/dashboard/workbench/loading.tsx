import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col h-screen w-full bg-[#f8fafc]">
      <div className="flex items-center justify-between p-4 bg-white border-b border-[#e4e8f0]">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="w-48 h-6" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="w-32 h-10 rounded-[10px]" />
          <Skeleton className="w-10 h-10 rounded-[10px]" />
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex p-6 gap-6">
        <div className="w-1/4 flex flex-col gap-4">
          <Skeleton className="w-full h-12 rounded-[10px]" />
          <Skeleton className="w-full h-64 rounded-xl" />
        </div>
        <div className="w-3/4 flex flex-col gap-4">
          <Skeleton className="w-full h-12 rounded-[10px]" />
          <Skeleton className="w-full h-full min-h-[500px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
