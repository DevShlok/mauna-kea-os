"use client";

import { useState } from "react";
import { Send, CheckSquare, Square, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { submitNextStepsAction } from "@/actions/client-command-centre";

interface NextStepsScreenProps {
  mandate: any;
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

export default function NextStepsScreen({
  mandate,
  clientName,
  userName,
  onSuccess,
}: NextStepsScreenProps) {
  const [selectedSteps, setSelectedSteps] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleStep = (step: string) => {
    const next = new Set(selectedSteps);
    if (next.has(step)) next.delete(step);
    else next.add(step);
    setSelectedSteps(next);
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
    } catch (e: any) {
      toast.error(e.message || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200/80 shadow-sm flex flex-col items-center gap-4 text-center max-w-md mx-auto my-8">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Next Steps Task Created</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Your request has been logged as a trackable workflow task and forwarded to your lead Mauna Kea search consultant.
          </p>
        </div>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-2 px-5 py-2.5 bg-[#133255] text-white text-xs font-bold rounded-xl hover:bg-[#1a4473] transition-colors"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-[#D8B15B]" />
            <h2 className="text-lg font-bold text-slate-900">6. Next Steps & Recalibration Feedback Loop</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Submit multi-select next steps and recalibration requests directly to your assigned Mauna Kea executive search team.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6 max-w-3xl">
        <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-200/80">
          Select all actions that apply for <span className="font-bold text-slate-900">{mandate.company} — {mandate.role}</span>. Submitting this form automatically logs a trackable consultant task with instant email notification.
        </div>

        {/* Multi-Select Action Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {PREDEFINED_STEPS.map((step) => {
            const isChecked = selectedSteps.has(step);
            return (
              <div
                key={step}
                onClick={() => toggleStep(step)}
                className={`p-3.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center justify-between transition-all ${
                  isChecked
                    ? "bg-[#133255]/5 border-[#133255] text-[#133255] ring-1 ring-[#133255]/20"
                    : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100"
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

        {/* Notes Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Additional Recalibration Notes / Context <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add specific target companies, location preferences, compensation adjustments, or search feedback..."
            className="w-full p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs outline-none focus:border-[#133255] resize-none h-24 transition-colors"
          />
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-xs font-bold text-[#133255]">
            {selectedSteps.size > 0 ? `${selectedSteps.size} next step(s) selected` : "No actions selected"}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedSteps.size === 0}
            className="px-6 py-3 bg-[#133255] hover:bg-[#1a4473] text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-colors flex items-center gap-2 shadow-xs"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isSubmitting ? "Submitting Request..." : "Submit Next Steps Task"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
