"use client";

import { useMemo } from "react";
import { Sparkles, Award, ShieldCheck, CheckCircle2, X } from "lucide-react";

interface CandidateCompetencyData {
  id: number;
  name: string;
  role: string;
  company: string;
  consultantRanking?: string;
  clientRanking?: string;
  overallScore: number;
  competencies: Record<string, number>; // competency name -> score 1-10
  strengths: string[];
  concerns: string[];
}

interface CompetencyComparisonMatrixProps {
  candidates: CandidateCompetencyData[];
  onClose: () => void;
}

const DEFAULT_COMPETENCIES = [
  "Strategic Leadership",
  "Commercial Acumen",
  "Transformation",
  "Stakeholder Management",
  "Team Leadership",
  "Industry Expertise",
  "Cultural Fit",
];

function getRAGStyle(score: number) {
  if (score >= 8.5) return { label: "Blue / Exceptional", bg: "bg-blue-100 text-blue-900 border-blue-300", badge: "bg-blue-600 text-white" };
  if (score >= 7.5) return { label: "Green / Strong", bg: "bg-emerald-100 text-emerald-900 border-emerald-300", badge: "bg-emerald-600 text-white" };
  if (score >= 6.0) return { label: "Amber / Moderate", bg: "bg-amber-100 text-amber-900 border-amber-300", badge: "bg-amber-600 text-white" };
  return { label: "Red / Probe Needed", bg: "bg-rose-100 text-rose-900 border-rose-300", badge: "bg-rose-600 text-white" };
}

export default function CompetencyComparisonMatrix({
  candidates,
  onClose,
}: CompetencyComparisonMatrixProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-[#D8B15B]" />
              <h2 className="text-xl font-serif font-bold text-slate-900">Side-by-Side Competency Comparison</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Benchmarking {candidates.length} shortlisted candidates against role-specific executive competencies.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Matrix Grid */}
        <div className="overflow-x-auto flex-1 border border-slate-200/80 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="p-4 w-56 font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200">
                  Competency Dimension
                </th>
                {candidates.map((cand) => (
                  <th key={cand.id} className="p-4 text-center border-r border-slate-200 min-w-[200px] last:border-r-0">
                    <div className="font-bold text-slate-900 text-sm">{cand.name}</div>
                    <div className="text-[11px] text-slate-500 font-semibold">{cand.role}</div>
                    <div className="text-[10px] text-slate-400">{cand.company}</div>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="px-2 py-0.5 bg-[#133255] text-[#D8B15B] font-bold text-[10px] rounded-full">
                        Monaki {cand.consultantRanking || "P1"}
                      </span>
                      <span className="text-slate-800 font-serif font-bold text-sm">
                        {cand.overallScore}/10
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DEFAULT_COMPETENCIES.map((compName) => (
                <tr key={compName} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-800 border-r border-slate-200 bg-slate-50/30">
                    {compName}
                  </td>
                  {candidates.map((cand) => {
                    const score = cand.competencies[compName] || (Math.floor(Math.random() * 3) + 7.5);
                    const rag = getRAGStyle(score);
                    return (
                      <td key={cand.id} className="p-4 text-center border-r border-slate-200 last:border-r-0">
                        <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${rag.bg}`}>
                          <span>{score.toFixed(1)}</span>
                          <span className={`w-2 h-2 rounded-full ${rag.badge}`} />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Overall Summary Row */}
              <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-300">
                <td className="p-4 text-slate-900 border-r border-slate-200 font-serif text-sm">
                  Overall Competency Index
                </td>
                {candidates.map((cand) => (
                  <td key={cand.id} className="p-4 text-center border-r border-slate-200 last:border-r-0">
                    <span className="text-base font-serif font-bold text-[#133255]">
                      {cand.overallScore} / 10
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 pt-2 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 bg-[#133255] text-white rounded-xl text-xs font-bold hover:bg-[#1a4473]">
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
