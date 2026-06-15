"use client";

import React, { useState, useRef } from "react";

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
  // Fields entirely hidden from UI (fetched from DB directly)
  const hiddenFields = ["Former Company", "Pedigree", "CTC", "Expected CTC", "Revenue Ownership", "Team Size Led", "Career Aspiration", "_rawInputs", "error"];
  
  // Fields shown as small textareas
  const metadataKeys = ["Notes Summary", "Interviewer Feedback", "Superior Feedback", "Peer Feedback"];
  
  const sections = Object.fromEntries(Object.entries(allSections).filter(([k]) => !hiddenFields.includes(k) && !metadataKeys.includes(k)));
  const metadataFields = Object.fromEntries(Object.entries(allSections).filter(([k]) => metadataKeys.includes(k)));

  // Track editing state per section
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({});
  const [acceptedSections, setAcceptedSections] = useState<Record<string, boolean>>({});
  const [editedContent, setEditedContent] = useState<Record<string, any>>({});
  const bodyRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleEdit = (key: string) => {
    setEditingSections(prev => ({ ...prev, [key]: true }));
    setAcceptedSections(prev => ({ ...prev, [key]: false }));
    // Focus the section body after state update
    setTimeout(() => {
      const el = bodyRefs.current[key];
      if (el) {
        el.setAttribute("contenteditable", "true");
        el.focus();
      }
    }, 50);
  };

  const handleAccept = (key: string) => {
    // Save edits from contenteditable
    const el = bodyRefs.current[key];
    if (el) {
      el.setAttribute("contenteditable", "false");
    }
    setEditingSections(prev => ({ ...prev, [key]: false }));
    setAcceptedSections(prev => ({ ...prev, [key]: true }));

    // Persist changes back
    if (el && onReportDataChange) {
      const newSections = { ...reportData };
      // Get the text content from the edited div
      const updatedText = el.innerText.trim();
      newSections[key] = updatedText;
      onReportDataChange(newSections);
    }
  };

  const handleRedo = (key: string) => {
    // Reset back to original content
    const el = bodyRefs.current[key];
    if (el) {
      el.setAttribute("contenteditable", "false");
    }
    setEditingSections(prev => ({ ...prev, [key]: false }));
    setAcceptedSections(prev => ({ ...prev, [key]: false }));
    setEditedContent(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const renderContent = (content: any) => {
    if (Array.isArray(content)) {
      return (
        <div className="flex flex-col gap-2.5 mt-1">
          {content.map((item, idx) => {
            const hasNumber = /^\d+[\.\)]\s/.test(item);
            // Bold the prefix if it ends with a colon
            const formattedItem = item.replace(/^(.*?:)/, '<strong>$1</strong>');
            return (
              <div key={idx} className="text-[12px] text-[#334155] leading-relaxed font-normal flex gap-1">
                {!hasNumber && <span className="font-bold shrink-0">{idx + 1}.</span>}
                <span dangerouslySetInnerHTML={{ __html: formattedItem }} />
              </div>
            );
          })}
        </div>
      );
    }
    return <p className="text-[12px] text-[#334155] leading-relaxed mt-1 whitespace-pre-wrap font-normal">{content}</p>;
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
            <p className="text-[12px] font-bold text-gray-500 mt-0.5 uppercase tracking-wide">
              {candidate.designation || candidate.role || "Candidate"} at {candidate.company || "Unknown Company"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold text-blue-900 font-serif">Mauna Kea <span className="text-[#0d2f6e]">International</span></h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 text-right block w-full">{frameworkName} Assessment</p>
        </div>
      </div>

      {/* AI Draft badge */}
      <div className="px-6 pb-3 flex items-center justify-between border-b border-gray-100 mb-5">
        <h2 className="text-[16px] font-bold text-gray-900 font-serif tracking-tight">AI-Generated Assessment Draft</h2>
        <span className="text-[10px] bg-[#d1fae5] text-[#065f46] px-2 py-0.5 rounded-full font-bold shadow-sm">AI Draft</span>
      </div>

      <div className="px-6 pb-6 space-y-4">
        
        {/* FEEDBACK & SUMMARY FIELDS (Editable) */}
        {Object.keys(metadataFields).length > 0 && (
          <div className="border border-[#e2e8f0] rounded-xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] bg-white mb-6">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-[#00174f] flex items-center gap-1.5">
                <span className="text-base">📋</span> AI Feedback & Summaries
              </h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {Object.entries(metadataFields).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">{key}</label>
                  {Array.isArray(value) ? (
                    <textarea 
                      className="w-full text-[13px] border border-gray-200 rounded p-2 focus:border-blue-500 outline-none resize-none transition-colors" 
                      rows={4} 
                      value={value.join('\n')} 
                      onChange={(e) => {
                        const newReportData = { ...reportData, [key]: e.target.value.split('\n') };
                        if (onReportDataChange) onReportDataChange(newReportData);
                      }}
                    />
                  ) : (
                    <textarea 
                      className="w-full text-[13px] border border-gray-200 rounded p-2 focus:border-blue-500 outline-none resize-none transition-colors" 
                      rows={3}
                      value={value} 
                      onChange={(e) => {
                        const newReportData = { ...reportData, [key]: e.target.value };
                        if (onReportDataChange) onReportDataChange(newReportData);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DYNAMIC TEXT SECTIONS — each with Accept / Edit / Redo */}
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
                <span className="text-[13px] font-bold text-[#00174f] flex items-center gap-1.5">
                  <span className="text-base">{icon}</span>
                  {displayTitle}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAccept(title)}
                    className={`px-3 py-1.5 border rounded-md text-[12px] font-semibold transition-colors shadow-sm ${
                      isAccepted
                        ? "bg-green-50 border-green-200 text-green-700 cursor-default"
                        : "bg-white border-[#e2e8f0] text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {isAccepted ? "Accepted ✓" : "Accept"}
                  </button>
                  <button
                    onClick={() => handleEdit(title)}
                    className={`px-3 py-1.5 border rounded-md text-[12px] font-semibold transition-colors shadow-sm ${
                      isEditing
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-white border-[#e2e8f0] text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRedo(title)}
                    className="px-3 py-1.5 border border-[#e2e8f0] bg-white rounded-md text-[12px] font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-1"
                  >
                    <span>↺</span> Redo
                  </button>
                </div>
              </div>

              {/* Section body — becomes contentEditable on Edit */}
              <div
                ref={(el) => { bodyRefs.current[title] = el; }}
                className={`px-5 pb-5 pt-1 outline-none transition-colors ${
                  isEditing ? "bg-white cursor-text" : ""
                }`}
                suppressContentEditableWarning
                onBlur={() => {
                  // Auto-save on blur if editing
                  if (isEditing) {
                    const el = bodyRefs.current[title];
                    if (el) {
                      setEditedContent(prev => ({ ...prev, [title]: el.innerText.trim() }));
                    }
                  }
                }}
              >
                {renderContent(editedContent[title] !== undefined ? editedContent[title] : content)}
              </div>
            </div>
          );
        })}

        {/* DYNAMIC SCORING FRAMEWORK */}
        {scores && (
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
            <h3 className="text-[13px] font-bold text-blue-900 font-serif mb-4 border-b border-blue-200 pb-2">
              Evaluation against key criterion
            </h3>
            
            <div className="space-y-4">
              {Object.entries(scores).map(([categoryName, criteria]: [string, any], catIdx) => (
                <div key={catIdx}>
                  <div className="flex justify-between mb-3">
                    <h4 className="text-sm font-bold text-gray-900">
                      {catIdx + 1}. {categoryName}
                    </h4>
                    <div className="flex text-[10px] text-gray-400 font-bold w-[150px] justify-between px-2">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pl-4">
                    {Object.entries(criteria).map(([critName, score]: [string, any], critIdx) => {
                      const scoreNum = Number(score) || 1;
                      const percentage = ((scoreNum - 1) / 9) * 100;
                      
                      return (
                        <div key={critIdx} className="flex justify-between items-center group">
                          <div className="text-[13px] text-gray-700 w-[250px] truncate pr-4">
                            {String.fromCharCode(65 + critIdx)}. {critName}
                          </div>
                          
                          {/* Slider Track */}
                          <div className="w-[150px] h-1 bg-gray-300 relative rounded-full">
                            <div 
                              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                            <div 
                              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full shadow-sm"
                              style={{ left: `calc(${percentage}% - 6px)` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom action bar */}
        <div className="flex gap-4 pt-6 border-t border-gray-200 items-center">
          <button
            onClick={() => alert("Report submitted for approval")}
            className="flex-1 py-3 bg-[#dfb259] text-[#1e3a8a] rounded-md font-bold text-[14px] hover:bg-[#cca24e] transition-colors shadow-sm"
          >
            Submit
          </button>
          
          <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 bg-white h-11">
            <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Format:</span>
            <select 
              className="py-1 text-[14px] outline-none bg-transparent font-bold text-[#1e3a8a] cursor-pointer"
              id="reportFormatSelect"
            >
              <option value="format1">Format 1</option>
              <option value="format2">Format 2</option>
            </select>
          </div>

          <button
            onClick={() => {
              const format = (document.getElementById('reportFormatSelect') as HTMLSelectElement).value as "format1" | "format2";
              if (onGeneratePdf) onGeneratePdf(format);
            }}
            className="py-3 px-6 bg-[#1e3a8a] text-white rounded-md font-bold text-[14px] hover:bg-[#1e40af] transition-colors shadow-sm flex items-center justify-center min-w-[140px]"
          >
            Preview PDF
          </button>
          <button
            onClick={() => {
              const format = (document.getElementById('reportFormatSelect') as HTMLSelectElement).value as "format1" | "format2";
              if (onGeneratePptx) onGeneratePptx(format);
            }}
            className="py-3 px-6 border border-gray-300 bg-white text-gray-700 rounded-md font-bold text-[14px] hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center min-w-[140px]"
          >
            Generate PPTX
          </button>
        </div>

      </div>
    </div>
  );
}
