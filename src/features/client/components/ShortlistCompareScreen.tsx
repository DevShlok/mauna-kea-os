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

  const selectedCandidateData = candidates.filter((c: any) => selectedIds.has(c.id)).map((c: any) => ({
    id: c.id,
    name: c.name,
    role: c.role || "Executive Leader",
    company: c.company || "Enterprise",
    consultantRanking: c.consultantRanking || "P1",
    clientRanking: c.clientRanking,
    overallScore: c.score || 8.3,
    competencies: {
      "Strategic Leadership": 8.8,
      "Commercial Acumen": 8.2,
      "Transformation": 9.1,
      "Stakeholder Management": 8.5,
      "Team Leadership": 8.7,
      "Industry Expertise": 7.8,
      "Cultural Fit": 8.6,
    },
    strengths: ["10+ Yrs Scale P&L Experience", "Proven Digital Transformation Track Record"],
    concerns: ["Relocation timing required for Q4"],
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

      {/* ─── Shortlist Visual Candidate Cards ───────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.length === 0 ? (
          <div className="col-span-full p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
            No candidates currently shortlisted for this mandate.
          </div>
        ) : (
          candidates.map((c: any) => {
            const isSelected = selectedIds.has(c.id);
            return (
              <div
                key={c.id}
                className={`bg-white rounded-2xl p-6 border transition-all duration-250 flex flex-col justify-between space-y-5 relative ${
                  isSelected
                    ? "border-[#D8B15B] ring-2 ring-[#D8B15B]/30 shadow-md"
                    : "border-slate-200/80 hover:border-slate-300 shadow-sm"
                }`}
              >
                {/* Select Checkbox */}
                <div className="flex items-start justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(c.id)}
                      className="w-4 h-4 rounded text-[#133255] focus:ring-[#133255]"
                    />
                    <span className="text-xs font-bold text-slate-500">Select to Compare</span>
                  </label>

                  <div className="flex items-center gap-1.5">
                    {/* Monaki Rank */}
                    <span className="px-2.5 py-0.5 bg-[#133255] text-[#D8B15B] font-bold text-[10px] rounded-full">
                      Monaki {c.consultantRanking || "P1"}
                    </span>
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#133255] to-[#0b1f36] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-md">
                    {c.initials || "MK"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => onSelectDeepDive(c)} className="font-serif font-bold text-slate-900 text-base hover:text-[#133255] block truncate text-left">
                      {c.name}
                    </button>
                    <div className="text-xs font-semibold text-slate-700 truncate">{c.role || "Executive Leader"}</div>
                    <div className="text-[11px] text-slate-400 truncate">{c.company || "Enterprise Corp"}</div>
                  </div>
                </div>

                {/* Dual Client Ranking Selector */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Client Ranking:</span>
                  <select
                    defaultValue={c.clientRanking || ""}
                    onChange={(e) => handleClientRankChange(c.id, e.target.value as any)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#133255] outline-none"
                  >
                    <option value="">Assign Rank</option>
                    <option value="P1">P1 — Top Choice</option>
                    <option value="P2">P2 — Strong Choice</option>
                    <option value="P3">P3 — Backup</option>
                  </select>
                </div>

                {/* Key Strengths & Concerns */}
                <div className="space-y-2 text-xs">
                  <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/60 text-emerald-900">
                    <div className="font-bold text-emerald-800 flex items-center gap-1 mb-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Key Strength</span>
                    </div>
                    <p className="text-[11px] leading-snug">Proven P&L scale leadership across multi-region teams.</p>
                  </div>

                  <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/60 text-amber-900">
                    <div className="font-bold text-amber-800 flex items-center gap-1 mb-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Key Concern</span>
                    </div>
                    <p className="text-[11px] leading-snug">Requires 60-day notice period negotiation.</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onSelectDeepDive(c)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Deep Dive</span>
                  </button>
                  <button
                    onClick={() => onScheduleInterview(c)}
                    className="flex-1 py-2 bg-[#133255] hover:bg-[#1a4473] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <CalendarCheck className="w-3.5 h-3.5 text-[#D8B15B]" />
                    <span>Schedule</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Side-by-Side Competency Matrix Modal ────────────── */}
      {isMatrixOpen && (
        <CompetencyComparisonMatrix
          candidates={selectedCandidateData}
          onClose={() => setIsMatrixOpen(false)}
        />
      )}
    </div>
  );
}
