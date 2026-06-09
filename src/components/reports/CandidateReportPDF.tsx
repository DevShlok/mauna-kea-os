"use client";

import React, { useState, useRef } from "react";

interface CandidateReportPDFProps {
  candidate: any;
  frameworkName: string;
  reportData: Record<string, any>;
  onReportDataChange?: (newData: Record<string, any>) => void;
}

export default function CandidateReportPDF({ candidate, frameworkName, reportData, onReportDataChange }: CandidateReportPDFProps) {
  const { scores, ...sections } = reportData;

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
        <ul className="list-disc pl-5 space-y-2 mt-2">
          {content.map((item, idx) => (
            <li key={idx} className="text-[13px] text-gray-700 leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      );
    }
    return <p className="text-[13px] text-gray-700 leading-relaxed mt-2 whitespace-pre-wrap">{content}</p>;
  };

  return (
    <div className="bg-white max-w-[800px] mx-auto border border-gray-200 shadow-sm font-sans" style={{ minHeight: "1056px" }}>
      {/* HEADER */}
      <div className="flex justify-between items-start p-10 pb-6">
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 rounded-full bg-blue-900 text-white flex items-center justify-center text-4xl font-bold shrink-0 border-4 border-white shadow-lg relative">
            {candidate.initials}
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#0a66c2] text-white rounded flex items-center justify-center text-sm font-bold border-2 border-white">
              in
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-900 font-serif">{candidate.name}</h1>
            <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-wide">
              {candidate.designation || candidate.role || "Candidate"} at {candidate.company || "Unknown Company"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-blue-900 font-serif">Mauna Kea <span className="text-[#0d2f6e]">International</span></h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 text-right block w-full">{frameworkName} Assessment</p>
        </div>
      </div>

      {/* AI Draft badge */}
      <div className="px-10 pb-2 flex items-center justify-between border-b border-gray-100 mb-6">
        <div className="text-[15px] font-bold text-gray-900 font-serif">AI-Generated Assessment Draft</div>
        <span className="text-[11px] bg-[#d1fae5] text-[#065f46] px-2 py-0.5 rounded-full font-bold">AI Draft</span>
      </div>

      <div className="px-10 pb-10 space-y-6">
        
        {/* DYNAMIC TEXT SECTIONS — each with Accept / Edit / Redo */}
        {Object.entries(sections).map(([title, content], i) => {
          const isEditing = editingSections[title];
          const isAccepted = acceptedSections[title];
          const displayTitle = title.replace(/([A-Z])/g, " $1").trim();

          return (
            <div
              key={i}
              className={`border rounded-lg overflow-hidden transition-all ${
                isAccepted
                  ? "border-green-200 bg-green-50/30"
                  : isEditing
                  ? "border-blue-300 bg-blue-50/20 ring-1 ring-blue-200"
                  : "border-gray-200"
              }`}
            >
              {/* Section header bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <span className="text-[14px] font-bold text-blue-900 font-serif flex items-center gap-2">
                  {isAccepted && <span className="text-green-600">✓</span>}
                  {displayTitle}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAccept(title)}
                    className={`px-3 py-1 rounded text-[11px] font-bold transition-colors ${
                      isAccepted
                        ? "bg-green-100 text-green-700 cursor-default"
                        : "text-gray-500 hover:bg-green-50 hover:text-green-700"
                    }`}
                  >
                    {isAccepted ? "Accepted ✓" : "Accept"}
                  </button>
                  <button
                    onClick={() => handleEdit(title)}
                    className={`px-3 py-1 rounded text-[11px] font-bold transition-colors ${
                      isEditing
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-500 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRedo(title)}
                    className="px-3 py-1 rounded text-[11px] font-bold text-gray-500 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                  >
                    ↺ Redo
                  </button>
                </div>
              </div>

              {/* Section body — becomes contentEditable on Edit */}
              <div
                ref={(el) => { bodyRefs.current[title] = el; }}
                className={`px-4 py-3 outline-none transition-colors ${
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
          <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-[15px] font-bold text-blue-900 font-serif mb-6 border-b border-blue-200 pb-2">
              Evaluation against key criterion
            </h3>
            
            <div className="space-y-6">
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
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => alert("Report submitted for approval")}
            className="flex-1 py-2.5 bg-yellow-500 text-blue-900 rounded font-bold text-xs hover:bg-yellow-400 transition-colors"
          >
            Submit for Approval
          </button>
          <button
            onClick={() => alert("PDF generated")}
            className="py-2.5 px-4 bg-blue-900 text-white rounded font-bold text-xs hover:bg-blue-800 transition-colors"
          >
            Generate PDF
          </button>
          <button
            onClick={() => alert("PPTX generated")}
            className="py-2.5 px-4 border border-gray-200 text-gray-500 rounded font-bold text-xs hover:bg-gray-50 transition-colors"
          >
            Generate PPTX
          </button>
        </div>

      </div>
    </div>
  );
}
