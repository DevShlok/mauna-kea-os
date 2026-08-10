"use client";

import React, { useState } from "react";
import { GuidanceBlock } from "@/db/schema";
import { BookOpen, Sparkles, ChevronDown, ChevronUp, Lock } from "lucide-react";

function NeoCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] relative overflow-hidden ${className}`}
      style={{
        background: "#eef2f7",
        boxShadow: "10px 10px 20px #cbd5e1, -10px -10px 20px #ffffff",
      }}
    >
      {children}
    </div>
  );
}

interface Props {
  blocks: GuidanceBlock[];
  tier: "A" | "B" | "C" | null;
}

export function GuidanceClient({ blocks, tier }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set(blocks.map((b) => b.id)));

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!tier) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-7 h-7 text-[#133255]" />
          <h1 className="text-2xl font-bold text-slate-800">Executive Guidance</h1>
        </div>
        <NeoCard className="p-8 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto bg-amber-100/80 border border-amber-200 mb-4">
            <Lock className="w-7 h-7 text-amber-800" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Assessment Required</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Complete your Mauna Kea Assessment to receive personalized consultant-curated guidance notes tailored to your tier and career track.
          </p>
        </NeoCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-[#133255]" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Executive Guidance</h1>
            <p className="text-xs text-slate-500 font-medium">Curated consultant insights for Tier {tier} candidates</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100/80 border border-blue-200 text-blue-800 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Tier {tier} Matched
        </div>
      </div>

      {blocks.length === 0 ? (
        <NeoCard className="p-8 text-center">
          <p className="text-slate-500 text-sm font-medium">
            No specific guidance notes found for your current profile parameters. Check back soon as consultants curate new career playbooks.
          </p>
        </NeoCard>
      ) : (
        <div className="space-y-4">
          {blocks.map((b) => {
            const isExpanded = expandedIds.has(b.id);
            return (
              <NeoCard key={b.id} className="p-6 transition-all duration-200">
                <button
                  onClick={() => toggleExpand(b.id)}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-base group-hover:text-blue-700 transition-colors">
                        {b.title}
                      </h3>
                      {b.targetRole !== "*" && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200/80 text-slate-700">
                          {b.targetRole} Focus
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-slate-200/60 flex items-center justify-center text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-200/70 text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-normal">
                    {b.body}
                  </div>
                )}
              </NeoCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
