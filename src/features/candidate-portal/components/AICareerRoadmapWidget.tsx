"use client";

import React, { useState } from "react";
import { Sparkles, Compass, CheckCircle2, ArrowRight, Loader2, Target, Award, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { generateCareerRoadmapAction } from "@/actions/candidate-portal";

export function AICareerRoadmapWidget({
  currentDesignation,
  dreamRoles = [],
}: {
  currentDesignation?: string;
  dreamRoles?: string[];
}) {
  const [currentRoleInput, setCurrentRoleInput] = useState(currentDesignation || "Financial Controller");
  const [targetRoleInput, setTargetRoleInput] = useState(dreamRoles[0] || "Chief Financial Officer (CFO)");
  const [isGenerating, setIsGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState<any | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoleInput || !targetRoleInput) {
      toast.error("Please enter both current and target role");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateCareerRoadmapAction(currentRoleInput, targetRoleInput);
      if (result.success) {
        setRoadmap(result.roadmap);
        toast.success("AI Career Trajectory Roadmap generated!");
      } else {
        toast.error("Failed to generate roadmap");
      }
    } catch {
      toast.error("Error generating career roadmap");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Generator Form */}
      <form onSubmit={handleGenerate} className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">AI Career Trajectory & Role Mapper</h3>
            <p className="text-xs text-slate-500 font-medium">Map out skills, timelines, and company tiers for your next promotion.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Current Role
            </label>
            <input
              type="text"
              value={currentRoleInput}
              onChange={(e) => setCurrentRoleInput(e.target.value)}
              placeholder="e.g. Financial Controller / VP Finance"
              className="w-full px-4 py-2.5 rounded-xl text-xs font-medium border border-slate-200 outline-none focus:ring-2 focus:ring-[#133255] neo-inset"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Target Aspiration Role
            </label>
            <input
              type="text"
              value={targetRoleInput}
              onChange={(e) => setTargetRoleInput(e.target.value)}
              placeholder="e.g. Group CFO / Global Finance Head"
              className="w-full px-4 py-2.5 rounded-xl text-xs font-medium border border-slate-200 outline-none focus:ring-2 focus:ring-[#133255] neo-inset"
              required
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isGenerating}
            className="neo-btn px-6 py-2.5 rounded-xl bg-[#133255] text-white font-bold text-xs hover:bg-[#1d4d82] transition-all cursor-pointer flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#D8B15B]" /> Generating AI Trajectory...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#D8B15B]" /> Generate Career Roadmap
              </>
            )}
          </button>
        </div>
      </form>

      {/* Rendered Roadmap Output */}
      {roadmap && (
        <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                <Target className="w-3.5 h-3.5 text-emerald-600" /> Target Match: {roadmap.targetMatchScore}%
              </div>
              <h4 className="text-xl font-black text-slate-800 mt-2">
                {roadmap.currentRole} <span className="text-slate-400 font-normal">→</span> {roadmap.targetRole}
              </h4>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
              <Clock className="w-4 h-4 text-[#133255]" />
              Estimated Timeline: <span className="text-[#133255] font-extrabold">{roadmap.estimatedTimeline}</span>
            </div>
          </div>

          {/* Skill Gaps & Upgrades */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#D8B15B]" /> Key Competencies & Skill Upgrades Needed
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {roadmap.skillsNeeded?.map((s: string, idx: number) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Target Company Tiers */}
          <div className="space-y-3 pt-2">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recommended Company Profiles & Sectors</h5>
            <div className="flex flex-wrap gap-2">
              {roadmap.targetSectors?.map((sec: string, idx: number) => (
                <span key={idx} className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-900 border border-sky-200 text-xs font-bold">
                  {sec}
                </span>
              ))}
            </div>
          </div>

          {/* Step-by-Step Transition Milestones */}
          <div className="space-y-3 pt-2">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Step-by-Step Transition Milestones</h5>
            <div className="space-y-2">
              {roadmap.milestones?.map((m: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex items-start gap-3 text-xs">
                  <div className="w-6 h-6 rounded-full bg-[#133255] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-xs">{m.title}</div>
                    <p className="text-slate-600 mt-0.5 leading-relaxed font-medium">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
