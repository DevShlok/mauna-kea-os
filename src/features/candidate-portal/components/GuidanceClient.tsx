"use client";

import React, { useState } from "react";
import { GuidanceBlock } from "@/db/schema";
import { BookOpen, Sparkles, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { AICareerRoadmapWidget } from "./AICareerRoadmapWidget";

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
  candidateDesignation?: string;
  candidateDreamRoles?: string[];
}

export function GuidanceClient({ blocks, tier, candidateDesignation, candidateDreamRoles }: Props) {
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

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-[#133255]" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Executive Guidance & AI Career Roadmap</h1>
            <p className="text-xs text-slate-500 font-medium">Curated consultant playbooks and AI career progression trajectory</p>
          </div>
        </div>
        {tier && (
          <div className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100/80 border border-blue-200 text-blue-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Tier {tier} Matched
          </div>
        )}
      </div>

      {/* AI Career Trajectory Roadmap Generator (#5) */}
      <AICareerRoadmapWidget
        currentDesignation={candidateDesignation}
        dreamRoles={candidateDreamRoles}
      />

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
