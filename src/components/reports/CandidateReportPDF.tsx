"use client";

import React, { useState } from "react";

interface CandidateReportPDFProps {
  candidate: any;
  frameworkName: string;
  reportData: Record<string, any>;
  onReportDataChange?: (newData: Record<string, any>) => void;
  onGeneratePdf?: (format: "format1" | "format2") => void;
  onGeneratePptx?: (format: "format1" | "format2") => void;
}

export default function CandidateReportPDF({ candidate, frameworkName, reportData, onReportDataChange, onGeneratePdf, onGeneratePptx }: CandidateReportPDFProps) {
  const { scores, ...allSections } = reportData;
  // Fields entirely hidden from UI (fetched from DB directly or internal)
  const hiddenFields = ["Former Company", "Pedigree", "CTC", "Expected CTC", "Revenue Ownership", "Team Size Led", "_rawInputs", "error", "_format1", "_format2"];
  
  // All visible sections
  const sections = Object.fromEntries(Object.entries(allSections).filter(([k]) => !hiddenFields.includes(k)));

  // Track editing state per section
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({});
  const [acceptedSections, setAcceptedSections] = useState<Record<string, boolean>>({});
  const [editedContent, setEditedContent] = useState<Record<string, any>>({});
  
  // Custom Section State
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionHeading, setNewSectionHeading] = useState("");

  const handleEdit = (key: string) => {
    setEditingSections(prev => ({ ...prev, [key]: true }));
    setAcceptedSections(prev => ({ ...prev, [key]: false }));
    
    // Initialize editedContent with the current value
    const val = reportData[key];
    setEditedContent(prev => ({
      ...prev,
      [key]: Array.isArray(val) ? val.join('\n') : (typeof val === "string" ? val : JSON.stringify(val))
    }));
  };

  const handleAccept = (key: string) => {
    setEditingSections(prev => ({ ...prev, [key]: false }));
    setAcceptedSections(prev => ({ ...prev, [key]: true }));

    // Persist changes back only if the user actually edited it
    if (onReportDataChange && editedContent[key] !== undefined) {
      const newSections = { ...reportData };
      const currentVal = editedContent[key] || "";
      // Keep arrays as arrays if the original was an array (for legacy sections) 
      // or if we detect multiple newlines in a new section that we want to be bullet points
      const wasArray = Array.isArray(reportData[key]);
      const isBulletList = ["Notes Summary", "Key Strengths", "Areas to Probe"].includes(key);
      
      if (wasArray || isBulletList) {
        newSections[key] = currentVal.split('\n').filter((s: string) => s.trim() !== '');
      } else {
        newSections[key] = currentVal;
      }
      onReportDataChange(newSections);
    }
  };

  const handleRemove = (key: string) => {
    setEditingSections(prev => ({ ...prev, [key]: false }));
    setAcceptedSections(prev => ({ ...prev, [key]: false }));
    setEditedContent(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    if (onReportDataChange) {
      const newSections = { ...reportData };
      delete newSections[key];
      onReportDataChange(newSections);
    }
  };

  const handleAddCustomSection = () => {
    if (!newSectionHeading.trim()) {
      setIsAddingSection(false);
      return;
    }
    const heading = newSectionHeading.trim();
    if (onReportDataChange) {
      onReportDataChange({
        ...reportData,
        [heading]: ""
      });
    }
    // Auto-open in edit mode
    setEditingSections(prev => ({ ...prev, [heading]: true }));
    setEditedContent(prev => ({ ...prev, [heading]: "" }));
    setNewSectionHeading("");
    setIsAddingSection(false);
  };

  const renderContent = (content: any) => {
    if (Array.isArray(content)) {
      return (
        <div className="flex flex-col gap-2 mt-1">
          {content.map((item, idx) => {
            const hasNumber = /^\d+[\.\)]\s/.test(item);
            // Bold the prefix if it ends with a colon
            const formattedItem = item.replace(/^(.*?:)/, '<strong>$1</strong>');
            return (
              <div key={idx} className="text-[14px] text-[#334155] leading-relaxed font-normal flex gap-1">
                {!hasNumber && <span className="font-bold shrink-0">{idx + 1}.</span>}
                <span dangerouslySetInnerHTML={{ __html: formattedItem }} />
              </div>
            );
          })}
        </div>
      );
    }
    return <p className="text-[14px] text-[#334155] leading-relaxed mt-1 whitespace-pre-wrap font-normal">{content}</p>;
  };

  return (
    <div className="bg-white max-w-[750px] mx-auto border border-gray-200 shadow-sm font-sans rounded-lg overflow-hidden">
      {/* HEADER */}
      <div className="flex justify-between items-start p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-blue-900 text-white flex items-center justify-center text-3xl font-bold shrink-0 border-4 border-white shadow-md relative">
            {candidate.initials}
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#0a66c2] text-white rounded flex items-center justify-center text-[10px] font-bold border-2 border-white">
              in
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-900 font-serif">{candidate.name}</h1>
            <p className="text-[14px] font-bold text-gray-500 mt-0.5 uppercase tracking-wide">
              {candidate.designation || candidate.role || "Candidate"} at {candidate.company || "Unknown Company"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <img src="/maunakea-logo.jpg" alt="Mauna Kea" className="h-6 object-contain ml-auto" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 text-right block w-full">{frameworkName} Assessment</p>
        </div>
      </div>

      {/* AI Draft badge */}
      <div className="px-6 pb-3 flex items-center justify-between border-b border-gray-100 mb-5">
        <h2 className="text-[16px] font-bold text-gray-900 font-serif tracking-tight">AI-Generated Assessment Draft</h2>
        <span className="text-[10px] bg-[#d1fae5] text-[#065f46] px-2 py-0.5 rounded-full font-bold shadow-sm">AI Draft</span>
      </div>

      <div className="px-6 pb-6 space-y-4">
        {/* DYNAMIC TEXT SECTIONS — each with Accept / Edit / Remove */}
        {Object.entries(sections).map(([title, content], i) => {
          const isEditing = editingSections[title];
          const isAccepted = acceptedSections[title];
          const displayTitle = title.replace(/([A-Z])/g, " $1").trim();
          
          let icon = "📝";
          if (title.toLowerCase().includes("experience")) icon = "💼";
          else if (title.toLowerCase().includes("motivation") || title.toLowerCase().includes("fit")) icon = "🎯";
          else if (title.toLowerCase().includes("strength")) icon = "⭐";
          else if (title.toLowerCase().includes("recommendation") || title.toLowerCase().includes("mk")) icon = "✅";

          return (
            <div
              key={i}
              className={`border rounded-xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] transition-all mb-4 ${
                isAccepted
                  ? "border-green-200 bg-green-50/10"
                  : isEditing
                  ? "border-blue-300 ring-1 ring-blue-200 bg-white"
                  : "border-[#e2e8f0] bg-white"
              }`}
            >
              {/* Section header bar */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <span className="text-[15px] font-bold text-[#00174f] flex items-center gap-1.5">
                  <span className="text-base">{icon}</span>
                  {displayTitle}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAccept(title)}
                    className={`px-3 py-1.5 border rounded-md text-[13px] font-semibold transition-colors shadow-sm ${
                      isAccepted
                        ? "bg-green-50 border-green-200 text-green-700 cursor-default"
                        : "bg-white border-[#e2e8f0] text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {isAccepted ? "Accepted ✓" : "Accept"}
                  </button>
                  <button
                    onClick={() => handleEdit(title)}
                    className={`px-3 py-1.5 border rounded-md text-[13px] font-semibold transition-colors shadow-sm ${
                      isEditing
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-white border-[#e2e8f0] text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRemove(title)}
                    className="px-3 py-1.5 border border-[#e2e8f0] bg-white rounded-md text-[13px] font-semibold text-red-600 shadow-sm hover:bg-red-50 transition-colors flex items-center gap-1"
                  >
                    <span>✕</span> Remove
                  </button>
                </div>
              </div>

              {/* Section body */}
              <div className="px-5 pb-5 pt-1 transition-colors">
                {isEditing ? (
                  <textarea
                    className="w-full text-[14px] border border-blue-200 rounded p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y transition-colors min-h-[100px] leading-relaxed"
                    value={editedContent[title] !== undefined ? editedContent[title] : ""}
                    onChange={(e) => setEditedContent(prev => ({ ...prev, [title]: e.target.value }))}
                  />
                ) : (
                  renderContent(content)
                )}
              </div>
            </div>
          );
        })}

        {/* Add Section Functionality */}
        <div className="mt-8 flex justify-center">
          {isAddingSection ? (
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 w-full max-w-md shadow-sm">
              <input 
                type="text" 
                placeholder="New Section Heading (e.g. Technical Skills)"
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-[14px] outline-none focus:border-blue-500"
                value={newSectionHeading}
                onChange={(e) => setNewSectionHeading(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCustomSection();
                  if (e.key === 'Escape') setIsAddingSection(false);
                }}
                autoFocus
              />
              <button 
                onClick={handleAddCustomSection}
                className="bg-blue-900 text-white px-4 py-2 rounded text-[14px] font-semibold hover:bg-blue-800 transition-colors"
              >
                Add
              </button>
              <button 
                onClick={() => setIsAddingSection(false)}
                className="text-gray-500 hover:text-gray-700 px-2"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAddingSection(true)}
              className="flex items-center gap-2 text-blue-700 font-bold hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors border border-dashed border-blue-300"
            >
              <span>+</span> Add Custom Section
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
