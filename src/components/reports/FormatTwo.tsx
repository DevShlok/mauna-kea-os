"use client";

import React, { useState } from "react";

export default function FormatTwo({ mandate, candidates }: { mandate: any, candidates: any[] }) {
  return (
    <div className="flex flex-col gap-10 bg-gray-100 py-10 items-center min-h-screen">
      {candidates.map((cand, idx) => {
        return <CandidateFormatTwo key={cand.id} cand={cand} />;
      })}
    </div>
  );
}

function CandidateFormatTwo({ cand }: { cand: any }) {
  const rp = cand.reportData || {};
  
  // Try to parse out basic timeline data
  const currentCompany = rp["Current Company"] || cand.company || "Current Company";
  const currentRole = rp["Designation"] || cand.role || "Current Role";
  const formerCompany = rp["Former Company"] || "Former Company";

  // State for editable domains to fetch logos
  const [currentDomain, setCurrentDomain] = useState(currentCompany.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
  const [formerDomain, setFormerDomain] = useState(formerCompany.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');

  return (
    <div className="bg-white w-[794px] h-[1122px] mx-auto shadow-xl print:shadow-none relative font-sans break-after-page mb-10 print:mb-0 box-border print:scale-100 max-w-none p-[40px]">
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 0mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        `}
      </style>

      {/* Header Container */}
      <div className="flex justify-between max-w-[800px] mt-10">
        
        {/* Left Column: Profile Section */}
        <div className="text-center w-[35%] flex flex-col items-center">
          {/* Profile Photo fallback to Initials */}
          <div 
            className="w-[150px] h-[150px] rounded-full border-[3px] border-[#003366] object-cover flex items-center justify-center text-5xl font-bold text-[#003366] bg-gray-50 shadow-sm"
          >
            {cand.initials || cand.name.substring(0, 2).toUpperCase()}
          </div>
          
          {cand.linkedin && (
            <a href={cand.linkedin} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" 
                alt="LinkedIn" 
                className="w-[30px] -mt-[20px] relative z-10 bg-white rounded-sm"
              />
            </a>
          )}
          
          <h2 className="text-[#003366] text-[24px] font-bold mt-4 mb-1" contentEditable suppressContentEditableWarning>
            {cand.name}
          </h2>
          <p className="text-[14px] text-gray-600 font-semibold" contentEditable suppressContentEditableWarning>
            {rp["Pedigree"] || "Qualification / Pedigree"}
          </p>
        </div>

        {/* Right Column: Timeline Section */}
        <div className="w-[60%] border-l-2 border-[#e0e0e0] pl-6 pt-4 flex flex-col gap-10">
          
          {/* Current Role */}
          <div className="flex items-center relative">
            <div className="absolute -left-[31px] w-[10px] h-[10px] bg-[#003366] rounded-full"></div>
            
            <div className="flex flex-col items-center mr-5">
              <img 
                src={`https://logo.clearbit.com/${currentDomain}`} 
                alt={currentCompany} 
                className="w-[80px] h-[80px] object-contain bg-white rounded-md border border-gray-100 p-1 shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=" + currentCompany + "&background=f3f4f6&color=4b5563";
                }}
              />
              <input 
                value={currentDomain} 
                onChange={(e) => setCurrentDomain(e.target.value)} 
                className="text-[8px] text-gray-400 text-center w-[80px] mt-1 outline-none border-b border-dashed print:hidden" 
                placeholder="domain.com"
              />
            </div>

            <div className="flex flex-col">
              <div className="w-[150px] font-bold text-[14px] text-[#003366]" contentEditable suppressContentEditableWarning>
                Present
              </div>
              <div className="font-bold text-[16px] text-gray-900 mt-1" contentEditable suppressContentEditableWarning>
                {currentRole}
              </div>
              <div className="text-[14px] text-gray-500 mt-0.5" contentEditable suppressContentEditableWarning>
                {currentCompany}
              </div>
            </div>
          </div>

          {/* Former Role */}
          <div className="flex items-center relative">
            <div className="absolute -left-[31px] w-[10px] h-[10px] bg-[#a0a0a0] rounded-full"></div>
            
            <div className="flex flex-col items-center mr-5">
              <img 
                src={`https://logo.clearbit.com/${formerDomain}`} 
                alt={formerCompany} 
                className="w-[80px] h-[80px] object-contain bg-white rounded-md border border-gray-100 p-1 shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=" + formerCompany + "&background=f3f4f6&color=4b5563";
                }}
              />
              <input 
                value={formerDomain} 
                onChange={(e) => setFormerDomain(e.target.value)} 
                className="text-[8px] text-gray-400 text-center w-[80px] mt-1 outline-none border-b border-dashed print:hidden" 
                placeholder="domain.com"
              />
            </div>

            <div className="flex flex-col">
              <div className="w-[150px] font-bold text-[14px] text-gray-500" contentEditable suppressContentEditableWarning>
                Previous
              </div>
              <div className="font-bold text-[16px] text-gray-900 mt-1" contentEditable suppressContentEditableWarning>
                Previous Role
              </div>
              <div className="text-[14px] text-gray-500 mt-0.5" contentEditable suppressContentEditableWarning>
                {formerCompany}
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="mt-[60px] border-t border-[#e0e0e0] pt-8">
        <h3 className="text-[#003366] text-[20px] font-bold mb-4">Executive Summary</h3>
        <p className="text-[14px] text-gray-700 leading-relaxed text-justify" contentEditable suppressContentEditableWarning>
          {rp["Notes Summary"]?.join(" ") || rp["Key Strengths"]?.join(" ") || "Candidate brings extensive experience across multiple domains..."}
        </p>
      </div>

    </div>
  );
}
