"use client";

import { useState } from "react";
import {
  Users,
  Building2,
  GraduationCap,
  Briefcase,
  History,
  AlertCircle,
  Eye,
  X,
  MessageSquare,
} from "lucide-react";

interface EngagementTrackerScreenProps {
  mandate: any;
  onSelectDeepDive: (candidate: any) => void;
}

export default function EngagementTrackerScreen({
  mandate,
  onSelectDeepDive,
}: EngagementTrackerScreenProps) {
  const [selectedTimelineCandidate, setSelectedTimelineCandidate] = useState<any | null>(null);

  const candidates = mandate?.candidates?.filter((c: any) => c.stage && c.stage !== "universe") || mandate?.candidates || [];

  return (
    <div className="space-y-6">
      {/* ─── Header Card ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D8B15B]" />
            <h2 className="text-lg font-serif font-bold text-slate-900">2. Candidate Engagement Tracker</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sophisticated ATS-style snapshot of candidate progression, career pedigree, and consultant evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            {candidates.length} Active Candidates Engaged
          </span>
        </div>
      </div>

      {/* ─── ATS Excel-Style Table View ──────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Candidate & Current Role</th>
                <th className="p-4">Pedigree & Qualification</th>
                <th className="p-4">Short Profile Summary</th>
                <th className="p-4">Monaki Assessment & Comments</th>
                <th className="p-4">Status & Rejection Reason</th>
                <th className="p-4 text-right">Activity Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    No engaged candidates yet for this mandate.
                  </td>
                </tr>
              ) : (
                candidates.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#133255] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {c.initials || "MK"}
                        </div>
                        <div>
                          <button onClick={() => onSelectDeepDive(c)} className="font-bold text-slate-900 hover:text-[#133255] hover:underline block text-left">
                            {c.name}
                          </button>
                          <div className="text-slate-500 text-[11px] font-semibold">{c.role || "Executive"}</div>
                          <div className="text-slate-400 text-[10px]">{c.company || "Leading Enterprise"}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-slate-700">
                      <div className="flex items-center gap-1 font-semibold text-slate-800">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        <span>MBA / Tier-1 Tech Pedigree</span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{c.exp ? `${c.exp} Yrs Exp` : "15+ Yrs Exp"}</div>
                    </td>

                    <td className="p-4 max-w-xs text-slate-600">
                      <p className="line-clamp-2 text-[11px] leading-relaxed">
                        Strong track record in executive growth, enterprise P&L management, and operational leadership.
                      </p>
                    </td>

                    <td className="p-4 max-w-xs">
                      <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/60 text-amber-900 text-[11px]">
                        <div className="font-bold text-amber-800 flex items-center gap-1 mb-0.5">
                          <MessageSquare className="w-3 h-3 text-amber-600" />
                          <span>Monaki Consultant Note</span>
                        </div>
                        <p className="line-clamp-2 text-amber-900/90">
                          Recommended P1 choice. Highly articulate with strong cultural alignment and immediate availability.
                        </p>
                      </div>
                    </td>

                    <td className="p-4">
                      <div>
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          c.stage === "shortlist" || c.stage === "client-shortlisted"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : c.stage === "rejected"
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}>
                          {c.stage || "Engaged"}
                        </span>
                        {c.rejectionReason && (
                          <div className="text-[10px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>{c.rejectionReason}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedTimelineCandidate(c)}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 ml-auto transition-colors"
                      >
                        <History className="w-3.5 h-3.5 text-slate-400" />
                        <span>Timeline</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Candidate Activity History Modal/Drawer ────────── */}
      {selectedTimelineCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#133255]" />
                <h3 className="font-bold text-slate-900 text-base">Candidate Activity History</h3>
              </div>
              <button onClick={() => setSelectedTimelineCandidate(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Audit timeline for <span className="font-bold text-slate-900">{selectedTimelineCandidate.name}</span>:
            </div>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pl-8">
              <div className="relative">
                <div className="absolute -left-8 top-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                <div className="text-xs font-bold text-slate-800">Shortlisted for Client Review</div>
                <div className="text-[10px] text-slate-400">10 Aug 2026, 1:30 PM • Mauna Kea Consultant</div>
              </div>

              <div className="relative">
                <div className="absolute -left-8 top-0.5 w-3 h-3 rounded-full bg-purple-500 border-2 border-white shadow-sm" />
                <div className="text-xs font-bold text-slate-800">360° Assessment Completed</div>
                <div className="text-[10px] text-slate-400">8 Aug 2026, 11:05 AM • Competency AI Engine</div>
              </div>

              <div className="relative">
                <div className="absolute -left-8 top-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                <div className="text-xs font-bold text-slate-800">Candidate Engaged</div>
                <div className="text-[10px] text-slate-400">7 Aug 2026, 4:20 PM • Executive Consultant</div>
              </div>

              <div className="relative">
                <div className="absolute -left-8 top-0.5 w-3 h-3 rounded-full bg-slate-400 border-2 border-white shadow-sm" />
                <div className="text-xs font-bold text-slate-800">Candidate Mapped</div>
                <div className="text-[10px] text-slate-400">5 Aug 2026, 10:32 AM • Sourcing Engine</div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button onClick={() => setSelectedTimelineCandidate(null)} className="px-4 py-2 bg-[#133255] text-white rounded-xl text-xs font-bold">
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
