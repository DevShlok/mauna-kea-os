"use client";

import { useState } from "react";
import {
  CalendarCheck,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  HelpCircle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface InterviewSchedulingModalProps {
  candidate: any;
  mandate: any;
  onClose: () => void;
}

export default function InterviewSchedulingModal({
  candidate,
  mandate,
  onClose,
}: InterviewSchedulingModalProps) {
  const [decision, setDecision] = useState<"interview" | "hold" | "reject" | "more_info">("interview");
  const [selectedDate, setSelectedDate] = useState("2026-08-18");
  const [selectedSlot, setSelectedSlot] = useState("11:00 AM - 12:00 PM");
  const [rejectionReason, setRejectionReason] = useState("Experience mismatch");
  const [otherText, setOtherText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableSlots = [
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "02:30 PM - 03:30 PM",
    "04:30 PM - 05:30 PM",
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (decision === "interview") {
        toast.success(`Interview scheduled for ${candidate?.name || "Candidate"} on ${selectedDate} at ${selectedSlot}!`);
      } else if (decision === "hold") {
        toast.success(`Candidate ${candidate?.name || ""} placed on Hold.`);
      } else if (decision === "reject") {
        toast.success(`Candidate ${candidate?.name || ""} marked as Rejected (${rejectionReason}).`);
      } else {
        toast.success(`Requested more information for ${candidate?.name || ""}.`);
      }
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#133255]" />
            <h3 className="font-serif font-bold text-slate-900 text-base">Client Decision & Interview Scheduling</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Make a structured decision for <span className="font-bold text-slate-900">{candidate?.name || "Candidate"}</span> regarding mandate <span className="font-bold text-slate-900">{mandate?.role}</span>.
        </div>

        {/* Decision Selection Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setDecision("interview")}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              decision === "interview"
                ? "bg-emerald-500 text-white border-emerald-600 shadow-md"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Interview</span>
          </button>

          <button
            type="button"
            onClick={() => setDecision("hold")}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              decision === "hold"
                ? "bg-amber-500 text-white border-amber-600 shadow-md"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Hold</span>
          </button>

          <button
            type="button"
            onClick={() => setDecision("reject")}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              decision === "reject"
                ? "bg-rose-500 text-white border-rose-600 shadow-md"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>Reject</span>
          </button>

          <button
            type="button"
            onClick={() => setDecision("more_info")}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              decision === "more_info"
                ? "bg-blue-600 text-white border-blue-700 shadow-md"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>More Info</span>
          </button>
        </div>

        {/* Dynamic Panel based on decision */}
        {decision === "interview" && (
          <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Select Date & Time Slot</h4>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Interview Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#133255]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Available Time Slots</label>
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

        {decision === "reject" && (
          <div className="space-y-3 bg-rose-50/70 p-4 rounded-2xl border border-rose-200">
            <h4 className="font-bold text-rose-900 text-xs uppercase tracking-wider">Select Rejection Reason</h4>
            <select
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="w-full p-2.5 bg-white border border-rose-200 rounded-xl text-xs outline-none text-slate-800 font-medium"
            >
              <option value="Lesser experience">Lesser experience</option>
              <option value="Compensation mismatch">Compensation mismatch</option>
              <option value="Industry mismatch">Industry mismatch</option>
              <option value="Leadership fit">Leadership fit</option>
              <option value="Cultural fit">Cultural fit</option>
              <option value="Location mismatch">Location mismatch</option>
              <option value="Other">Other</option>
            </select>

            {rejectionReason === "Other" && (
              <textarea
                placeholder="Specify detailed reason for rejection..."
                value={otherText}
                onChange={e => setOtherText(e.target.value)}
                className="w-full p-2.5 bg-white border border-rose-200 rounded-xl text-xs outline-none resize-none h-20"
              />
            )}
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
            className="px-5 py-2 bg-[#133255] text-white rounded-xl text-xs font-bold hover:bg-[#1a4473] disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Decision"}
          </button>
        </div>
      </div>
    </div>
  );
}
