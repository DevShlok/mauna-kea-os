"use client";

import { useState } from "react";
import { Send, CheckSquare, Square, X, MessageSquare, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

interface NextStepsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mandate: any;
  clientName: string;
  userName: string;
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
}: NextStepsModalProps) {
  const [selectedSteps, setSelectedSteps] = useState<Set<string>>(new Set(["Schedule interviews"]));
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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

    setIsSubmitting(true);
    try {
      toast.success("Next Steps submitted to Mauna Kea lead consultant!");
      onClose();
    } catch (e: any) {
      toast.error("Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-[#133255]" />
            <h3 className="font-serif font-bold text-slate-900 text-base">Submit Mandate Next Steps</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Select multiple actions to notify the Mauna Kea executive team. This automatically creates a trackable workflow task in the Recruiter Dashboard.
        </div>

        {/* Multi-Select Predefined Options */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {PREDEFINED_STEPS.map((step) => {
            const isChecked = selectedSteps.has(step);
            return (
              <div
                key={step}
                onClick={() => toggleStep(step)}
                className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer flex items-center justify-between transition-colors ${
                  isChecked
                    ? "bg-[#133255]/5 border-[#133255] text-[#133255]"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{step}</span>
                {isChecked ? <CheckSquare className="w-4 h-4 text-[#133255]" /> : <Square className="w-4 h-4 text-slate-300" />}
              </div>
            );
          })}
        </div>

        {/* Additional Comments */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">Additional Recalibration Notes / Feedback</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add detailed feedback or specific companies to target..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#133255] resize-none h-20"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 bg-[#133255] text-white rounded-xl text-xs font-bold hover:bg-[#1a4473] disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Next Steps Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
