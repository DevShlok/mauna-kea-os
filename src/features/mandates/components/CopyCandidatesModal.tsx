"use client";
import React, { useState, useEffect } from "react";
import { X, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { getActiveMandatesListAction, copyCandidatesToMandateAction } from "@/actions";
import { useRouter } from "next/navigation";

export default function CopyCandidatesModal({
  isOpen,
  onClose,
  selectedCandidateIds,
  currentUser,
  currentMandateId,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedCandidateIds: number[];
  currentUser: { name: string };
  currentMandateId: number;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [mandates, setMandates] = useState<any[]>([]);
  const [selectedMandateId, setSelectedMandateId] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; addedCount: number; duplicateCount: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setSelectedMandateId("");
      getActiveMandatesListAction().then((data) => {
        // filter out current mandate
        setMandates(data.filter((m) => m.id !== currentMandateId));
      });
    }
  }, [isOpen, currentMandateId]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!selectedMandateId) return;
    setIsSubmitting(true);
    
    const res = await copyCandidatesToMandateAction(selectedCandidateIds, Number(selectedMandateId), currentUser.name);
    setResult(res as any);
    
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (result && result.success) {
      if (onSuccess) onSuccess();
      router.refresh();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Copy className="w-4 h-4" />
            </div>
            <h2 className="text-[16px] font-bold text-[#133255]">Copy Candidates</h2>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {result ? (
            <div className="text-center py-6">
              {result.addedCount > 0 ? (
                <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-yellow-50 text-yellow-500 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6" />
                </div>
              )}
              <h3 className="text-lg font-bold text-[#133255] mb-2">Copy Complete</h3>
              <p className="text-gray-500 text-sm mb-4">
                Successfully copied <span className="font-bold text-gray-900">{result.addedCount}</span> candidates.
                {result.duplicateCount > 0 && ` (${result.duplicateCount} were already in the target mandate pipeline and skipped).`}
              </p>
              <button 
                onClick={handleClose}
                className="w-full py-2.5 bg-[#133255] text-white rounded-xl text-sm font-bold hover:bg-[#1a406d]"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-6">
                Select a target mandate to copy the <span className="font-bold text-gray-900">{selectedCandidateIds.length}</span> selected candidates to.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Target Mandate <span className="text-red-500">*</span></label>
                  <select 
                    value={selectedMandateId}
                    onChange={(e) => setSelectedMandateId(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#133255] outline-none"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a mandate...</option>
                    {mandates.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.company} - {m.role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCopy}
                  disabled={!selectedMandateId || isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-[#133255] text-white rounded-xl text-sm font-bold hover:bg-[#1a406d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Copying...
                    </>
                  ) : (
                    "Copy Candidates"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
