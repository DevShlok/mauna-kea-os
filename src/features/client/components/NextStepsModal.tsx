"use client";

import { useState } from "react";
import { Send, CheckSquare, Square, X, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { submitNextStepsAction } from "@/actions/client-command-centre";

interface NextStepsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mandate: any;          // { id, role }
  clientName: string;
  userName: string;
  onSuccess?: () => void;
}

const PREDEFINED_STEPS = [
  "Schedule interviews",
  "Request additional candidates",
  "Request candidates from a specific company/industry",
  "Request deeper assessment",
  "Change candidate priorities",
  "Change competency criteria",
  "Discuss mandate / recalibrate search",
  "Delivery is on track",
  "Delivery needs improvement",
  "Other feedback",
];

export default function NextStepsModal({
  isOpen,
  onClose,
  mandate,
  clientName,
  userName,
  onSuccess,
}: NextStepsModalProps) {
  const [selectedSteps, setSelectedSteps] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const toggleStep = (step: string) => {
    const next = new Set(selectedSteps);
    if (next.has(step)) next.delete(step);
    else next.add(step);
    setSelectedSteps(next);
  };

  const handleClose = () => {
    setSelectedSteps(new Set());
    setComments("");
    setSubmitted(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (selectedSteps.size === 0) {
      toast.error("Please select at least one next step action.");
      return;
    }
    if (!mandate?.id) {
      toast.error("Mandate context is missing.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitNextStepsAction({
        mandateId: mandate.id,
        selectedSteps: Array.from(selectedSteps),
        freeTextComment: comments || undefined,
      });
      setSubmitted(true);
      toast.success("Next Steps submitted! The Mauna Kea team has been notified.");
      onSuccess?.();
      setTimeout(handleClose, 1800);
    } catch (e: any) {
      toast.error(e.message || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl border border-slate-100 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-slate-900 text-lg">Task Created</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your request has been forwarded to the Mauna Kea executive team and logged as a trackable task.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-[#133255]" />
            <h3 className="font-serif font-bold text-slate-900 text-base">Submit Mandate Next Steps</h3>
          </div>
          <button onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {mandate?.role && (
          <div className="text-xs text-slate-500">
            Regarding mandate: <span className="font-bold text-slate-900">{mandate.role}</span>
          </div>
        )}

        <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-100">
          Select multiple actions to notify the Mauna Kea executive team. This automatically creates a trackable workflow task visible to your lead consultant.
        </div>

        {/* Multi-Select Options */}
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {PREDEFINED_STEPS.map((step) => {
            const isChecked = selectedSteps.has(step);
            return (
              <div
                key={step}
                onClick={() => toggleStep(step)}
                className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer flex items-center justify-between transition-all ${
                  isChecked
                    ? "bg-[#133255]/5 border-[#133255] text-[#133255]"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <span>{step}</span>
                {isChecked
                  ? <CheckSquare className="w-4 h-4 text-[#133255] shrink-0" />
                  : <Square className="w-4 h-4 text-slate-300 shrink-0" />
                }
              </div>
            );
          })}
        </div>

        {/* Selected Count Badge */}
        {selectedSteps.size > 0 && (
          <div className="text-xs text-[#133255] font-bold">
            {selectedSteps.size} action{selectedSteps.size > 1 ? "s" : ""} selected
          </div>
        )}

        {/* Additional Comments */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            Additional Notes / Recalibration Feedback <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add specific company targets, geographic requirements, or detailed feedback..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#133255] resize-none h-20 transition-colors"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedSteps.size === 0}
            className="px-5 py-2 bg-[#133255] text-white rounded-xl text-xs font-bold hover:bg-[#1a4473] disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isSubmitting ? "Submitting..." : "Submit Next Steps Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
