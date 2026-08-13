"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, ArrowRight, ChevronLeft } from "lucide-react";
import { completeOnboardingAction } from "@/actions/candidate-onboarding";

export function Step4_ReviewProfile({ 
  candId, 
  candidate, 
  initialData, 
  source,
  onComplete,
  onBack,
}: { 
  candId: string; 
  candidate: any; 
  initialData: any; 
  source: "cv" | "linkedin" | "manual";
  onComplete?: () => void;
  onBack?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Merge AI extracted data with whatever we already knew about the candidate
  const [formData, setFormData] = useState({
    name: initialData.name || candidate.name || "",
    designation: initialData.designation || candidate.designation || "",
    company: initialData.company || candidate.company || "",
    location: initialData.location || candidate.location || "",
    exp: initialData.expYears || candidate.exp || "",
    summary: initialData.summary || candidate.notes || "",
    careerTimeline: initialData.careerTimeline || [],
    ctc: initialData.ctc || candidate.ctc || "",
    expected: initialData.expected || candidate.expected || "",
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const result = await completeOnboardingAction(candId, formData, source);
      if (result.success) {
        // Notify shell to clear localStorage + trigger router.refresh()
        // Button stays in "Finalizing..." — component unmounts on success, no state leak
        onComplete?.();
      } else {
        console.error("Onboarding failed:", result.error);
        setIsSubmitting(false);
      }
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Review your Profile</h2>
      <p className="text-slate-600 max-w-md mb-8 text-center">
        We've put everything together. Make sure it looks good, and you can edit any fields right here.
      </p>

      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8 text-left space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input 
              type="text"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133255]/50"
              value={formData.name} 
              onChange={e => handleChange("name", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <input 
              type="text"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133255]/50"
              value={formData.location} 
              onChange={e => handleChange("location", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current Role</label>
            <input 
              type="text"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133255]/50"
              value={formData.designation} 
              onChange={e => handleChange("designation", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current Company</label>
            <input 
              type="text"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133255]/50"
              value={formData.company} 
              onChange={e => handleChange("company", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Years of Exp</label>
            <input 
              type="number"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133255]/50"
              value={formData.exp} 
              onChange={e => handleChange("exp", parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Professional Summary</label>
          <textarea 
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133255]/50 resize-none"
            value={formData.summary} 
            onChange={e => handleChange("summary", e.target.value)}
            rows={4}
          />
        </div>

        {formData.careerTimeline && formData.careerTimeline.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-slate-800 mb-3">Extracted Experience</h3>
            <div className="space-y-3">
              {formData.careerTimeline.map((job: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="font-medium text-slate-800">{job.roleTitle}</div>
                  <div className="text-sm text-slate-600">{job.companyName}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {job.startDate} to {job.isCurrent || !job.endDate ? "Present" : job.endDate}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">You can fully edit your timeline from your profile dashboard later.</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-100 text-slate-700 px-6 py-4 rounded-xl text-lg font-semibold disabled:opacity-50 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        )}
        <button 
          onClick={handleFinish} 
          disabled={isSubmitting}
          className="flex items-center bg-[#133255] hover:bg-[#133255]/90 text-white px-8 py-4 rounded-xl text-lg font-semibold min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : null}
          {isSubmitting ? "Finalizing..." : "Go to my Dashboard"}
          {!isSubmitting && <ArrowRight className="w-5 h-5 ml-2" />}
        </button>
      </div>
    </div>
  );
}
