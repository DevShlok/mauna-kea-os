"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { updateCandidateVisibilityAction, updateConsultantRankingAction } from "@/actions/client-command-centre";
import { Eye, EyeOff, ShieldCheck, Lock, CheckCircle2, Sliders, RefreshCw, UserCheck, AlertTriangle } from "lucide-react";

type Candidate = {
  id: number;
  candId?: string;
  name?: string;
  stage?: string;
  company?: string;
  designation?: string;
  visibleToClient?: boolean;
  showContactDetails?: boolean;
  showCompensation?: boolean;
  showAssessment?: boolean;
  showComments?: boolean;
  consultantRanking?: "P1" | "P2" | "P3" | null;
  clientDecision?: string | null;
};

export default function CandidateVisibilityPanel({
  mandateId,
  candidates: initialCandidates,
  onUpdateCandidates,
}: {
  mandateId: number;
  candidates: Candidate[];
  onUpdateCandidates?: (updatedList: Candidate[]) => void;
}) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [isPending, startTransition] = useTransition();
  const [filterStage, setFilterStage] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const filtered = candidates.filter((c) => {
    const matchStage = filterStage === "all" || c.stage === filterStage;
    const matchSearch =
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase()) ||
      c.designation?.toLowerCase().includes(search.toLowerCase());
    return matchStage && matchSearch;
  });

  const handleToggle = (
    candidateId: number,
    field: "visibleToClient" | "showContactDetails" | "showCompensation" | "showAssessment" | "showComments",
    currentVal: boolean
  ) => {
    const newVal = !currentVal;

    // Optimistic update
    const updated = candidates.map((c) => (c.id === candidateId ? { ...c, [field]: newVal } : c));
    setCandidates(updated);
    if (onUpdateCandidates) onUpdateCandidates(updated);

    startTransition(async () => {
      try {
        const target = candidates.find((c) => c.id === candidateId);
        if (!target) return;

        await updateCandidateVisibilityAction({
          mandateCandidateId: candidateId,
          visibleToClient: field === "visibleToClient" ? newVal : target.visibleToClient ?? false,
          showContactDetails: field === "showContactDetails" ? newVal : target.showContactDetails ?? false,
          showCompensation: field === "showCompensation" ? newVal : target.showCompensation ?? true,
          showAssessment: field === "showAssessment" ? newVal : target.showAssessment ?? true,
          showComments: field === "showComments" ? newVal : target.showComments ?? true,
        });
        toast.success("Visibility setting updated");
      } catch (err: any) {
        toast.error(err.message || "Failed to update setting");
        // Rollback
        setCandidates(initialCandidates);
      }
    });
  };

  const handleRankingChange = (candidateId: number, ranking: "P1" | "P2" | "P3" | null) => {
    const updated = candidates.map((c) => (c.id === candidateId ? { ...c, consultantRanking: ranking } : c));
    setCandidates(updated);
    if (onUpdateCandidates) onUpdateCandidates(updated);

    startTransition(async () => {
      try {
        await updateConsultantRankingAction(candidateId, ranking);
        toast.success("Consultant ranking updated");
      } catch (err: any) {
        toast.error(err.message || "Failed to update ranking");
        setCandidates(initialCandidates);
      }
    });
  };

  const handleBatchToggle = (field: "visibleToClient" | "showContactDetails" | "showCompensation", targetVal: boolean) => {
    const targetIds = filtered.map((c) => c.id);
    if (targetIds.length === 0) return;

    const updated = candidates.map((c) => (targetIds.includes(c.id) ? { ...c, [field]: targetVal } : c));
    setCandidates(updated);
    if (onUpdateCandidates) onUpdateCandidates(updated);

    startTransition(async () => {
      try {
        await Promise.all(
          targetIds.map((id) => {
            const target = candidates.find((c) => c.id === id);
            if (!target) return Promise.resolve();
            return updateCandidateVisibilityAction({
              mandateCandidateId: id,
              visibleToClient: field === "visibleToClient" ? targetVal : target.visibleToClient ?? false,
              showContactDetails: field === "showContactDetails" ? targetVal : target.showContactDetails ?? false,
              showCompensation: field === "showCompensation" ? targetVal : target.showCompensation ?? true,
              showAssessment: target.showAssessment ?? true,
              showComments: target.showComments ?? true,
            });
          })
        );
        toast.success(`Batch updated ${targetIds.length} candidate(s)`);
      } catch (err: any) {
        toast.error("Batch update failed");
        setCandidates(initialCandidates);
      }
    });
  };

  const totalVisible = candidates.filter((c) => c.visibleToClient).length;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-5 bg-[#133255] text-white rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg text-white">Client Portal Visibility & Governance</h3>
          </div>
          <p className="text-xs text-blue-100/80 mt-1 max-w-xl">
            Configure granular profile controls exposed to the client in their Hiring Command Centre. Obfuscate direct contacts or financial figures until contractual stage gates are met.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
          <div className="text-center">
            <div className="text-xl font-black text-white">{candidates.length}</div>
            <div className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Total Pipeline</div>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <div className="text-xl font-black text-emerald-400">{totalVisible}</div>
            <div className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Client Visible</div>
          </div>
        </div>
      </div>

      {/* Batch Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
          <Sliders className="w-4 h-4 text-[#133255]" />
          <span>Batch Operations ({filtered.length} candidates in view):</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleBatchToggle("visibleToClient", true)}
            disabled={isPending}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" /> Make All Visible
          </button>
          <button
            onClick={() => handleBatchToggle("visibleToClient", false)}
            disabled={isPending}
            className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <EyeOff className="w-3.5 h-3.5" /> Hide All
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <button
            onClick={() => handleBatchToggle("showContactDetails", false)}
            disabled={isPending}
            className="px-3 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" /> Mask All Contacts
          </button>
          <button
            onClick={() => handleBatchToggle("showCompensation", false)}
            disabled={isPending}
            className="px-3 py-1.5 bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" /> Mask All Compensation
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search candidates by name, company or designation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-[#133255] focus:ring-1 focus:ring-[#133255]"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-500 font-semibold">Stage filter:</span>
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-[#133255]"
          >
            <option value="all">All Stages</option>
            <option value="universe">Universe</option>
            <option value="mapping">Mapping</option>
            <option value="longlist">Long List</option>
            <option value="calllist">Call List</option>
            <option value="shortlist">Shortlist</option>
            <option value="client-shortlisted">Client Shortlisted</option>
            <option value="interview">Interview</option>
            <option value="offer-sent">Offer Sent</option>
            <option value="offer-accepted">Offer Accepted</option>
          </select>
        </div>
      </div>

      {/* Table of Candidates */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Candidate</th>
                <th className="p-3.5">Current Stage</th>
                <th className="p-3.5 text-center">Consultant Rank</th>
                <th className="p-3.5 text-center">Client Visible</th>
                <th className="p-3.5 text-center">Contact Info</th>
                <th className="p-3.5 text-center">Compensation</th>
                <th className="p-3.5 text-center">Assessment</th>
                <th className="p-3.5 text-center">Comments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 italic">
                    No candidates match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-gray-900">{c.name || "Unnamed Candidate"}</div>
                      <div className="text-[11px] text-gray-500">
                        {c.designation ?? "—"} {c.company ? `@ ${c.company}` : ""}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-md capitalize text-[11px]">
                        {c.stage || "universe"}
                      </span>
                    </td>

                    {/* Consultant Ranking Badge */}
                    <td className="p-3.5 text-center">
                      <div className="flex justify-center gap-1">
                        {(["P1", "P2", "P3"] as const).map((rk) => (
                          <button
                            key={rk}
                            onClick={() => handleRankingChange(c.id, c.consultantRanking === rk ? null : rk)}
                            className={`px-2 py-0.5 font-extrabold rounded text-[10px] transition-colors ${
                              c.consultantRanking === rk
                                ? rk === "P1"
                                  ? "bg-amber-500 text-white shadow-sm"
                                  : rk === "P2"
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "bg-gray-600 text-white shadow-sm"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {rk}
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* Visible to Client Toggle */}
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleToggle(c.id, "visibleToClient", c.visibleToClient ?? false)}
                        className={`px-3 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1 transition-colors ${
                          c.visibleToClient
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {c.visibleToClient ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {c.visibleToClient ? "Exposed" : "Hidden"}
                      </button>
                    </td>

                    {/* Contact Details Toggle */}
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={c.showContactDetails ?? false}
                        onChange={() => handleToggle(c.id, "showContactDetails", c.showContactDetails ?? false)}
                        className="w-4 h-4 rounded text-[#133255] focus:ring-[#133255] cursor-pointer"
                        title="Allow client to view phone & email"
                      />
                    </td>

                    {/* Compensation Toggle */}
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={c.showCompensation ?? true}
                        onChange={() => handleToggle(c.id, "showCompensation", c.showCompensation ?? true)}
                        className="w-4 h-4 rounded text-[#133255] focus:ring-[#133255] cursor-pointer"
                        title="Allow client to view CTC figures"
                      />
                    </td>

                    {/* Assessment Toggle */}
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={c.showAssessment ?? true}
                        onChange={() => handleToggle(c.id, "showAssessment", c.showAssessment ?? true)}
                        className="w-4 h-4 rounded text-[#133255] focus:ring-[#133255] cursor-pointer"
                        title="Allow client to view assessment notes"
                      />
                    </td>

                    {/* Comments Toggle */}
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={c.showComments ?? true}
                        onChange={() => handleToggle(c.id, "showComments", c.showComments ?? true)}
                        className="w-4 h-4 rounded text-[#133255] focus:ring-[#133255] cursor-pointer"
                        title="Allow client to view internal notes"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
