"use client";

import { useState } from "react";
import { Upload, FileText, ArrowRight, Loader2 } from "lucide-react";

export function Step1_UploadCV({ candId, onNext }: { candId: string; onNext: (data?: any, source?: "cv") => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");

    try {
      // 1. Upload CV using the existing API endpoint
      const formData = new FormData();
      formData.append("file", file);
      formData.append("candId", candId);
      
      const uploadRes = await fetch("/api/upload-cv", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload CV");
      
      // Wait, upload-cv only saves to drive. It doesn't return text currently in our stub?
      // Let's call parse-cv explicitly to get the text, or if upload-cv already parses it, use that.
      // Assuming we can parse it locally for extraction.
      const parseForm = new FormData();
      parseForm.append("file", file);
      const parseRes = await fetch("/api/parse-cv", {
        method: "POST",
        body: parseForm
      });
      
      if (!parseRes.ok) throw new Error("Failed to read CV text");
      const { text: parsedText } = await parseRes.json();

      // 2. Extract profile using AI
      const extractRes = await fetch("/api/extract-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: parsedText, source: "cv" }),
      });

      if (!extractRes.ok) throw new Error("Failed to extract profile information");
      const { profile } = await extractRes.json();

      onNext(profile, "cv");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-[#F15A29]/10 rounded-2xl flex items-center justify-center mb-6">
        <FileText className="w-8 h-8 text-[#F15A29]" />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Upload your Resume</h2>
      <p className="text-slate-600 max-w-md mb-8">
        We'll use AI to automatically extract your experience, skills, and details to build your Mauna Kea profile instantly.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm max-w-md">
          {error}
        </div>
      )}

      <div className="w-full max-w-md relative">
        <input
          type="file"
          id="cv-upload"
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        <label
          htmlFor="cv-upload"
          className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            isUploading 
              ? "border-slate-300 bg-slate-50 cursor-not-allowed" 
              : "border-[#F15A29]/30 bg-white hover:bg-[#F15A29]/5 hover:border-[#F15A29]"
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-[#F15A29] animate-spin mb-3" />
              <span className="text-slate-600 font-medium">Analyzing your Resume...</span>
              <span className="text-slate-400 text-sm mt-1">This usually takes about 10 seconds</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-8 h-8 text-[#F15A29] mb-3" />
              <span className="text-slate-800 font-medium mb-1">Click to upload or drag & drop</span>
              <span className="text-slate-500 text-sm">PDF, DOC, DOCX (Max 5MB)</span>
            </div>
          )}
        </label>
      </div>

      <div className="mt-8 flex items-center justify-center w-full max-w-md">
        <div className="h-px bg-slate-200 flex-1"></div>
        <span className="px-4 text-slate-400 text-sm font-medium">OR</span>
        <div className="h-px bg-slate-200 flex-1"></div>
      </div>

      <button
        className="mt-6 flex items-center gap-2 text-[#133255] font-medium hover:bg-[#133255]/5 px-4 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onNext()}
        disabled={isUploading}
      >
        Skip and enter manually <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
