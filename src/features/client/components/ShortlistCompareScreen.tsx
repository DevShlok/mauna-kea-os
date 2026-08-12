"use client";

import { useState } from "react";
import {
  GitCompare,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  Eye,
  CalendarCheck,
  Building2,
  UserCheck,
} from "lucide-react";
import CompetencyComparisonMatrix from "./CompetencyComparisonMatrix";
import { updateClientRankingAction } from "@/actions/client-command-centre";
import toast from "react-hot-toast";

interface ShortlistCompareScreenProps {
  mandate: any;
  onSelectDeepDive: (candidate: any) => void;
  onScheduleInterview: (candidate: any) => void;
}

export default function ShortlistCompareScreen({
  mandate,
  onSelectDeepDive,
  onScheduleInterview,
}: ShortlistCompareScreenProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);

  const candidates = mandate?.candidates?.filter((c: any) => c.stage === "shortlist" || c.stage === "client-shortlisted") || mandate?.candidates || [];

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleClientRankChange = async (candidateId: number, ranking: "P1" | "P2" | "P3") => {
    try {
      await updateClientRankingAction(candidateId, ranking);
      toast.success(`Assigned Client Rank ${ranking}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update ranking");
    }
  };

  const selectedCandidateData = candidates
    .filter((c: any) => selectedIds.has(c.id))
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      role: c.role || "Executive Leader",
      company: c.company || mandate.company,
      consultantRanking: c.consultantRanking || "P1",
      clientRanking: c.clientRanking,
      overallScore: c.overallScore || c.score || 8.5,
      competencies: c.competencies || c.candidateCompetencies || {
        "Strategic Leadership": c.score || 8.5,
        "Commercial Acumen": c.score || 8.2,
        "Transformation": c.score || 8.8,
        "Stakeholder Management": c.score || 8.5,
        "Team Leadership": c.score || 8.6,
        "Industry Expertise": c.score || 8.1,
        "Cultural Fit": c.score || 8.7,
      },
      strengths: c.strengths?.length ? c.strengths : [c.summary || "Strong Executive Profile"],
      concerns: c.concerns?.length ? c.concerns : ["None reported"],
    }));

  return (
    <div className="space-y-6">
      {/* ─── Header Card ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-[#D8B15B]" />
            <h2 className="text-lg font-bold text-slate-900">3. Shortlist & Candidate Comparison</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Compare shortlisted executive candidates against role-specific competency frameworks and dual P1/P2/P3 rankings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (selectedIds.size < 2) {
                toast.error("Please select at least 2 candidates to compare.");
                return;
              }
              setIsMatrixOpen(true);
            }}
            disabled={selectedIds.size < 2}
            className="px-5 py-2.5 bg-[#133255] text-white hover:bg-[#1a4473] disabled:opacity-40 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-[#D8B15B]" />
            <span>Compare Selected ({selectedIds.size})</span>
          </button>
        </div>
      </div>

      {/* ─── Shortlisted Candidate Cards Grid ────────────────── */}
      {candidates.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center text-slate-400 text-xs">
          No candidates currently in shortlisted stage for this mandate.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((c: any) => {
            const isSelected = selectedIds.has(c.id);
            return (
              <div
                key={c.id}
                className={`bg-white rounded-2xl p-6 border transition-all flex flex-col justify-between space-y-5 relative ${
                  isSelected
                    ? "border-[#133255] ring-2 ring-[#133255]/20 shadow-md"
                    : "border-slate-200/80 hover:border-slate-300 shadow-sm"
                }`}
              >
                {/* Select Checkbox Top Corner */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleSelect(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#133255] text-white border-[#133255]"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{isSelected ? "Selected" : "Select for Compare"}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 bg-[#133255]/10 text-[#133255] border border-[#133255]/20 text-[10px] font-bold rounded-full">
                      Monaki {c.consultantRanking || "P1"}
                    </span>
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#133255] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      {c.initials || "MK"}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                      <div className="text-xs text-slate-500 font-medium">{c.role || "Executive Leader"}</div>
                      <div className="text-[11px] text-slate-400 font-semibold">{c.company || mandate.company}</div>
                    </div>
                  </div>

                  {/* Summary */}
                  {c.summary && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                      "{c.summary}"
                    </p>
                  )}

                  {/* Dual Ranking Selector */}
                  <div className="space-y-1 pt-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Your Client Ranking</div>
                    <div className="flex gap-2">
                      {(["P1", "P2", "P3"] as const).map((rank) => (
                        <button
                          key={rank}
                          onClick={() => handleClientRankChange(c.id, rank)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            c.clientRanking === rank
                              ? "bg-[#D8B15B] text-[#133255] border-[#D8B15B] shadow-xs"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {rank}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => onSelectDeepDive(c)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Deep Dive</span>
                  </button>
                  <button
                    onClick={() => onScheduleInterview(c)}
                    className="flex-1 py-2 bg-[#133255] hover:bg-[#1a4473] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <CalendarCheck className="w-3.5 h-3.5 text-[#D8B15B]" />
                    <span>Schedule</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Side-by-Side Matrix Modal ──────────────────────── */}
      {isMatrixOpen && (
        <CompetencyComparisonMatrix
          candidates={selectedCandidateData}
          onClose={() => setIsMatrixOpen(false)}
        />
      )}
    </div>
  );
}
