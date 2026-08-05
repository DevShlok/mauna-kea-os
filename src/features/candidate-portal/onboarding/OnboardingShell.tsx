"use client";

import { useState } from "react";
import { Step1_UploadCV } from "./Step1_UploadCV";
import { Step2_LinkedInUpload } from "./Step2_LinkedInUpload";
import { Step3_Conversational } from "./Step3_Conversational";
import { Step4_ReviewProfile } from "./Step4_ReviewProfile";
import { Check } from "lucide-react";

type Step = 1 | 2 | 3 | 4;

interface OnboardingShellProps {
  candId: string;
  candidate: any;
}

export function OnboardingShell({ candId, candidate }: OnboardingShellProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [extractedData, setExtractedData] = useState<any>({});
  const [source, setSource] = useState<"cv" | "linkedin" | "manual">("manual");

  const steps = [
    { num: 1, title: "Resume" },
    { num: 2, title: "LinkedIn" },
    { num: 3, title: "About You" },
    { num: 4, title: "Review" },
  ];

  const handleNext = (data?: any, src?: "cv" | "linkedin") => {
    if (data) {
      setExtractedData((prev: any) => ({ ...prev, ...data }));
    }
    if (src) {
      setSource(src);
    }
    
    // Auto-skip logic:
    // If CV upload succeeded (data exists), skip LinkedIn and go to conversational.
    if (currentStep === 1 && data) {
      setCurrentStep(3);
    } 
    // If CV upload was skipped, go to LinkedIn (Step 2)
    else if (currentStep === 1 && !data) {
      setCurrentStep(2);
    }
    // If LinkedIn upload succeeded or was skipped, go to conversational (Step 3)
    else if (currentStep === 2) {
      setCurrentStep(3);
    }
    // Normal linear progression
    else if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      {/* Progress Stepper */}
      <div className="mb-12">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#F15A29] rounded-full z-0 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
          
          {steps.map((step) => (
            <div key={step.num} className="relative z-10 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors duration-300 ${
                currentStep > step.num 
                  ? 'bg-[#F15A29] text-white shadow-md' 
                  : currentStep === step.num
                    ? 'bg-white border-2 border-[#F15A29] text-[#F15A29] shadow-md'
                    : 'bg-white border-2 border-slate-200 text-slate-400'
              }`}>
                {currentStep > step.num ? <Check className="w-5 h-5" /> : step.num}
              </div>
              <span className={`mt-3 text-xs font-medium uppercase tracking-wider ${
                currentStep >= step.num ? 'text-slate-700' : 'text-slate-400'
              }`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div 
        className="p-8 rounded-2xl relative overflow-hidden"
        style={{
          background: "#eef2f7",
          boxShadow: "6px 6px 12px #cbd5e1, -6px -6px 12px #ffffff",
        }}
      >
        {currentStep === 1 && <Step1_UploadCV candId={candId} onNext={handleNext} />}
        {currentStep === 2 && <Step2_LinkedInUpload candId={candId} onNext={handleNext} />}
        {currentStep === 3 && <Step3_Conversational candId={candId} onNext={handleNext} />}
        {currentStep === 4 && (
          <Step4_ReviewProfile 
            candId={candId} 
            candidate={candidate}
            initialData={extractedData}
            source={source}
          />
        )}
      </div>
    </div>
  );
}
