"use client";

import { useState } from "react";
import {
  CalendarCheck, Calendar, Clock, CheckCircle2, X, AlertCircle, HelpCircle, XCircle, CheckSquare, Square,
} from "lucide-react";
import toast from "react-hot-toast";
import { submitClientDecisionAction, scheduleInterviewAction } from "@/actions/client-command-centre";

// Structured rejection reasons per CP-39
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

interface InterviewSchedulingModalProps {
  candidate: any;         // { id, name, mandateCandidateId }
  mandate: any;           // { id, role, interviewRounds? }
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InterviewSchedulingModal({
  candidate,
  mandate,
  onClose,
  onSuccess,
}: InterviewSchedulingModalProps) {
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
      const mandateCandidateId = candidate?.mandateCandidateId;
      if (!mandateCandidateId) throw new Error("Missing mandate candidate ID");

      if (decision === "Interview") {
        // Schedule the interview
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
        toast.success(`${round.label} scheduled for ${candidate?.name} on ${selectedDate}!`);
      } else {
        // Submit decision (Hold / Reject / MoreInfo)
        await submitClientDecisionAction({
          mandateCandidateId,
          decision,
          rejectionReasons: decision === "Reject" ? Array.from(rejectionReasons) : [],
          rejectionOther: decision === "Reject" && rejectionReasons.has("Other") ? rejectionOther : undefined,
        });
        const labels: Record<string, string> = {
          Hold: `${candidate?.name} placed on Hold.`,
          Reject: `${candidate?.name} rejected.`,
          MoreInfo: `More information requested for ${candidate?.name}.`,
        };
        toast.success(labels[decision] || "Decision submitted.");
      }

      onSuccess?.();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#133255]" />
            <h3 className="font-serif font-bold text-slate-900 text-base">Client Decision</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Structured decision for <span className="font-bold text-slate-900">{candidate?.name || "Candidate"}</span>{" "}
          regarding <span className="font-bold text-slate-900">{mandate?.role}</span>.
        </div>

        {/* Decision Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                decision === key
                  ? color === "emerald" ? "bg-emerald-500 text-white border-emerald-600 shadow-md"
                  : color === "amber"   ? "bg-amber-500 text-white border-amber-600 shadow-md"
                  : color === "rose"    ? "bg-rose-500 text-white border-rose-600 shadow-md"
                  : "bg-blue-600 text-white border-blue-700 shadow-md"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Interview Panel */}
        {decision === "Interview" && (
          <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {/* Round Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Interview Round</label>
              <div className="flex gap-2 flex-wrap">
                {interviewRounds.map(r => (
                  <button
                    key={r.round}
                    type="button"
                    onClick={() => setSelectedRound(r.round)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      selectedRound === r.round
                        ? "bg-[#133255] text-white border-[#133255]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-[#133255]"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interviewer Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Interviewer Name (optional)</label>
              <input
                type="text"
                value={interviewerName}
                onChange={e => setInterviewerName(e.target.value)}
                placeholder="e.g. Rohan Mehta, VP HR"
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#133255]"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Interview Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#133255]"
              />
            </div>

            {/* Time Slots */}
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Preferred Time Slot</label>
              <div className="grid grid-cols-2 gap-2">
                {availableSlots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      selectedSlot === slot
                        ? "bg-[#133255] text-white border-[#133255]"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hold Note */}
        {decision === "Hold" && (
          <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              This candidate will be placed on hold. The Mauna Kea team will be notified and will pause active outreach for this candidate on this mandate.
            </p>
          </div>
        )}

        {/* Structured Rejection Panel (CP-39) */}
        {decision === "Reject" && (
          <div className="space-y-3 bg-rose-50/70 p-4 rounded-2xl border border-rose-200">
            <h4 className="font-bold text-rose-900 text-xs uppercase tracking-wider">Select Rejection Reasons</h4>
            <p className="text-[11px] text-rose-700">Select all that apply. This feedback helps calibrate the search.</p>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {REJECTION_REASONS.map(reason => {
                const checked = rejectionReasons.has(reason);
                return (
                  <div
                    key={reason}
                    onClick={() => toggleRejectionReason(reason)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
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
                placeholder="Please specify..."
                value={rejectionOther}
                onChange={e => setRejectionOther(e.target.value)}
                className="w-full p-2.5 bg-white border border-rose-200 rounded-xl text-xs outline-none focus:border-rose-400 resize-none h-16"
              />
            )}
          </div>
        )}

        {/* More Info Note */}
        {decision === "MoreInfo" && (
          <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-2xl border border-blue-200">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              Mauna Kea will follow up to gather the additional information you need before making a decision on this candidate.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-5 py-2 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors ${
              decision === "Reject"
                ? "bg-rose-500 hover:bg-rose-600"
                : decision === "Hold"
                ? "bg-amber-500 hover:bg-amber-600"
                : decision === "MoreInfo"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit Decision"}
          </button>
        </div>
      </div>
    </div>
  );
}
