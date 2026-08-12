"use client";

import { useState } from "react";
import {
  CalendarCheck, Calendar, Clock, CheckCircle2, AlertCircle, HelpCircle, XCircle, CheckSquare, Square, User, Briefcase
} from "lucide-react";
import toast from "react-hot-toast";
import { submitClientDecisionAction, scheduleInterviewAction } from "@/actions/client-command-centre";

const REJECTION_REASONS = [
  "Compensation Mismatch",
  "Insufficient Experience",
  "Industry / Domain Mismatch",
  "Functional Skill Gap",
  "Leadership Fit",
  "Cultural Fit",
  "Location Mismatch",
  "Internal Candidate Preferred",
  "Role on Hold / Cancelled",
  "Other",
];

interface DecisionsSchedulingScreenProps {
  mandate: any;
  candidate?: any;
  onSuccess?: () => void;
}

export default function DecisionsSchedulingScreen({
  mandate,
  candidate: initialCandidate,
  onSuccess,
}: DecisionsSchedulingScreenProps) {
  const candidates = mandate?.candidates || [];
  const [selectedCandId, setSelectedCandId] = useState<number>(initialCandidate?.id || candidates[0]?.id || 0);

  const selectedCandidate = candidates.find((c: any) => c.id === selectedCandId) || initialCandidate || candidates[0];

  const [decision, setDecision] = useState<"Interview" | "Hold" | "Reject" | "MoreInfo">("Interview");
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 5);
    return d.toISOString().split("T")[0];
  });
  const [selectedSlot, setSelectedSlot] = useState("11:00 AM - 12:00 PM");
  const [selectedRound, setSelectedRound] = useState(1);
  const [interviewerName, setInterviewerName] = useState("");
  const [rejectionReasons, setRejectionReasons] = useState<Set<string>>(new Set());
  const [rejectionOther, setRejectionOther] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableSlots = [
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "02:30 PM - 03:30 PM",
    "04:30 PM - 05:30 PM",
  ];

  const interviewRounds: { round: number; label: string }[] = mandate?.interviewRounds?.length
    ? mandate.interviewRounds
    : [
        { round: 1, label: "Interview 1" },
        { round: 2, label: "Interview 2" },
        { round: 3, label: "Final Interview" },
      ];

  const toggleRejectionReason = (reason: string) => {
    const next = new Set(rejectionReasons);
    if (next.has(reason)) next.delete(reason); else next.add(reason);
    setRejectionReasons(next);
  };

  const handleSubmit = async () => {
    if (!selectedCandidate) {
      toast.error("Please select a candidate.");
      return;
    }
    if (decision === "Reject" && rejectionReasons.size === 0) {
      toast.error("Please select at least one rejection reason.");
      return;
    }
    if (decision === "Interview" && !selectedDate) {
      toast.error("Please select an interview date.");
      return;
    }

    setIsSubmitting(true);
    try {
      const mandateCandidateId = selectedCandidate?.mandateCandidateId || selectedCandidate?.id;
      if (!mandateCandidateId) throw new Error("Missing mandate candidate ID");

      if (decision === "Interview") {
        const round = interviewRounds.find(r => r.round === selectedRound) || interviewRounds[0];
        await scheduleInterviewAction({
          mandateId: mandate.id,
          mandateCandidateId,
          round: round.round,
          roundLabel: round.label,
          interviewerName: interviewerName || undefined,
          scheduledDate: selectedDate,
          scheduledTime: selectedSlot,
        });
        toast.success(`${round.label} scheduled for ${selectedCandidate?.name} on ${selectedDate}!`);
      } else {
        await submitClientDecisionAction({
          mandateCandidateId,
          decision,
          rejectionReasons: decision === "Reject" ? Array.from(rejectionReasons) : [],
          rejectionOther: decision === "Reject" && rejectionReasons.has("Other") ? rejectionOther : undefined,
        });
        const labels: Record<string, string> = {
          Hold: `${selectedCandidate?.name} placed on Hold.`,
          Reject: `${selectedCandidate?.name} rejected.`,
          MoreInfo: `More information requested for ${selectedCandidate?.name}.`,
        };
        toast.success(labels[decision] || "Decision submitted.");
      }

      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#D8B15B]" />
            <h2 className="text-lg font-bold text-slate-900">5. Client Decisions & Interview Scheduling</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Structured candidate decision platform: schedule interviews, place candidates on hold, or record calibrated rejection feedback.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Selector Column */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Candidate ({candidates.length})</h3>
          
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {candidates.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No candidates available for decision.</div>
            ) : (
              candidates.map((c: any) => {
                const isSelected = c.id === selectedCandId;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCandId(c.id)}
                    className={`p-3.5 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? "bg-[#133255] text-white border-[#133255] shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${isSelected ? "bg-[#D8B15B] text-[#133255]" : "bg-slate-200 text-slate-700"}`}>
                      {c.initials || "MK"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{c.name}</div>
                      <div className={`text-[11px] truncate ${isSelected ? "text-slate-200" : "text-slate-500"}`}>{c.role || "Executive Leader"}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Decision Form Column */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          {selectedCandidate ? (
            <>
              {/* Selected Candidate Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Decision For</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">{selectedCandidate.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{selectedCandidate.role || "Executive Leader"} — {selectedCandidate.company || mandate.company}</div>
                </div>
                <div className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200 capitalize">
                  Current: {selectedCandidate.stage || "Engaged"}
                </div>
              </div>

              {/* Decision Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Select Decision</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: "Interview" as const, label: "Interview", icon: CheckCircle2, color: "emerald" },
                    { key: "Hold" as const, label: "Hold", icon: Clock, color: "amber" },
                    { key: "Reject" as const, label: "Reject", icon: XCircle, color: "rose" },
                    { key: "MoreInfo" as const, label: "More Info", icon: HelpCircle, color: "blue" },
                  ].map(({ key, label, icon: Icon, color }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDecision(key)}
                      className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                        decision === key
                          ? color === "emerald" ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : color === "amber"   ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                          : color === "rose"    ? "bg-rose-500 text-white border-rose-600 shadow-sm"
                          : "bg-blue-600 text-white border-blue-700 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Decision Configuration Panel */}
              {decision === "Interview" && (
                <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Interview Details</h4>
                  
                  {/* Round Picker */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Interview Round</label>
                    <div className="flex gap-2 flex-wrap">
                      {interviewRounds.map(r => (
                        <button
                          key={r.round}
                          type="button"
                          onClick={() => setSelectedRound(r.round)}
                          className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                            selectedRound === r.round
                              ? "bg-[#133255] text-white border-[#133255]"
                              : "bg-white text-slate-700 border-slate-200 hover:border-[#133255]"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interviewer Name */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Interviewer Name / Panel (optional)</label>
                    <input
                      type="text"
                      value={interviewerName}
                      onChange={e => setInterviewerName(e.target.value)}
                      placeholder="e.g. Rohan Mehta, VP HR"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#133255]"
                    />
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Date</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#133255]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Time Slot</label>
                      <select
                        value={selectedSlot}
                        onChange={e => setSelectedSlot(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#133255]"
                      >
                        {availableSlots.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {decision === "Hold" && (
                <div className="flex items-start gap-3 bg-amber-50/80 p-4 rounded-2xl border border-amber-200 text-amber-900 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>Candidate will be placed on hold. Outreach for this candidate will be paused across this mandate.</p>
                </div>
              )}

              {decision === "Reject" && (
                <div className="space-y-3 bg-rose-50/70 p-5 rounded-2xl border border-rose-200">
                  <h4 className="font-bold text-rose-900 text-xs uppercase tracking-wider">Select Rejection Reasons (CP-39)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {REJECTION_REASONS.map(reason => {
                      const checked = rejectionReasons.has(reason);
                      return (
                        <div
                          key={reason}
                          onClick={() => toggleRejectionReason(reason)}
                          className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer flex items-center justify-between transition-colors ${
                            checked
                              ? "bg-rose-500/10 border-rose-400 text-rose-800"
                              : "bg-white border-rose-100 text-slate-700 hover:border-rose-200"
                          }`}
                        >
                          <span>{reason}</span>
                          {checked ? <CheckSquare className="w-4 h-4 text-rose-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                        </div>
                      );
                    })}
                  </div>
                  {rejectionReasons.has("Other") && (
                    <textarea
                      placeholder="Please specify additional feedback..."
                      value={rejectionOther}
                      onChange={e => setRejectionOther(e.target.value)}
                      className="w-full p-2.5 bg-white border border-rose-200 rounded-xl text-xs outline-none focus:border-rose-400 resize-none h-16"
                    />
                  )}
                </div>
              )}

              {decision === "MoreInfo" && (
                <div className="flex items-start gap-3 bg-blue-50/80 p-4 rounded-2xl border border-blue-200 text-blue-900 text-xs">
                  <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p>Mauna Kea search team will gather requested candidate clarifications prior to interview scheduling.</p>
                </div>
              )}

              {/* Submit Action */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`px-6 py-3 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors shadow-sm ${
                    decision === "Reject"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : decision === "Hold"
                      ? "bg-amber-500 hover:bg-amber-600"
                      : decision === "MoreInfo"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {isSubmitting ? "Submitting..." : "Submit Candidate Decision"}
                </button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">No candidate selected.</div>
          )}
        </div>
      </div>
    </div>
  );
}
