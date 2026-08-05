"use client";

import { useState } from "react";
import { Upload, ArrowRight, Loader2, Info } from "lucide-react";

export function Step2_LinkedInUpload({ candId, onNext }: { candId: string; onNext: (data?: any, source?: "linkedin") => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");

    try {
      // 1. Upload LinkedIn PDF to Google Drive and parse text using existing API
      const formData = new FormData();
      formData.append("file", file);
      formData.append("candId", candId);
      
      const uploadRes = await fetch("/api/upload-linkedin-pdf", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload LinkedIn PDF");
      const { text } = await uploadRes.json(); // Assuming the endpoint returns parsed text now, wait I need to check upload-linkedin-pdf

      // Wait, upload-linkedin-pdf only saves to drive. It doesn't return text currently.
      // We'll need to parse it here by calling parse-cv or modify upload-linkedin-pdf.
      // Let's call /api/parse-cv directly for the text since it's just a PDF.
      
      const parseForm = new FormData();
      parseForm.append("file", file);
      const parseRes = await fetch("/api/parse-cv", {
        method: "POST",
        body: parseForm
      });
      
      if (!parseRes.ok) throw new Error("Failed to read LinkedIn PDF text");
      const { text: parsedText } = await parseRes.json();

      // 2. Extract profile using AI
      const extractRes = await fetch("/api/extract-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: parsedText, source: "linkedin" }),
      });

      if (!extractRes.ok) throw new Error("Failed to extract profile information");
      const { profile } = await extractRes.json();

      onNext(profile, "linkedin");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-[#0077B5]/10 rounded-2xl flex items-center justify-center mb-6">
        <div className="w-8 h-8 bg-[#0077B5] text-white flex items-center justify-center font-bold text-sm rounded-sm">in</div>
      </div>
      
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Add your LinkedIn Profile</h2>
      <p className="text-slate-600 max-w-md mb-6">
        You skipped the CV upload. You can upload a PDF export of your LinkedIn profile instead.
      </p>

      <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-start text-sm text-left max-w-md mb-8">
        <Info className="w-5 h-5 mr-3 shrink-0 mt-0.5 text-blue-600" />
        <p>Go to your LinkedIn profile, click <strong>More...</strong>, and select <strong>Save to PDF</strong>. Then upload that file here.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm max-w-md">
          {error}
        </div>
      )}

      <div className="w-full max-w-md relative">
        <input
          type="file"
          id="linkedin-upload"
          className="hidden"
          accept=".pdf"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        <label
          htmlFor="linkedin-upload"
          className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            isUploading 
              ? "border-slate-300 bg-slate-50 cursor-not-allowed" 
              : "border-[#0077B5]/30 bg-white hover:bg-[#0077B5]/5 hover:border-[#0077B5]"
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-[#0077B5] animate-spin mb-3" />
              <span className="text-slate-600 font-medium">Analyzing LinkedIn Profile...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-8 h-8 text-[#0077B5] mb-3" />
              <span className="text-slate-800 font-medium mb-1">Click to upload LinkedIn PDF</span>
              <span className="text-slate-500 text-sm">PDF only (Max 5MB)</span>
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
