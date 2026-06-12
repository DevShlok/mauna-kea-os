"use client";

import React, { useState } from "react";

export default function FormatOne({ mandate, candidates }: { mandate: any, candidates: any[] }) {
  const [apifyData, setApifyData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const fetchLinkedInExp = async (candId: string, url: string) => {
    try {
      setIsLoading(prev => ({ ...prev, [candId]: true }));
      const res = await fetch("/api/apify-linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.data) {
        setApifyData(prev => ({ ...prev, [candId]: data.data }));
      } else {
        alert(data.error || "Failed to fetch LinkedIn data");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsLoading(prev => ({ ...prev, [candId]: false }));
    }
  };
  return (
    <div className="flex flex-col gap-10 print:gap-0 bg-gray-100 print:bg-white py-10 print:py-0 items-center min-h-screen">
      {candidates.map((cand, idx) => {
        const rp = cand.reportData || {};
        const notes = rp["Notes Summary"] || rp["Relevant Experience"] || ["Detailed notes regarding the candidate's experience and fit."];
        const assessmentNotes = rp["Key Strengths"] || rp["MK Recommendation"] || ["Strong capability demonstrated."];
        
        return (
          <div key={cand.id} className="bg-white w-[794px] h-[1122px] mx-auto shadow-xl print:shadow-none break-after-page mb-10 print:mb-0 box-border print:scale-100 max-w-none p-[20px] overflow-hidden">
            <style type="text/css" media="print">
              {`
                @page { size: A4; margin: 0mm; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              `}
            </style>
            
            <div className="w-full h-full border-[10px] border-[#00174f] p-[20px] flex flex-col font-sans relative">
              
              {/* Fetch LinkedIn Button (Hidden on Print) */}
              {cand.linkedin && !apifyData[cand.id] && (
                <div className="absolute top-2 right-2 print:hidden z-10">
                  <button 
                    onClick={() => fetchLinkedInExp(cand.id, cand.linkedin)}
                    disabled={isLoading[cand.id]}
                    className="bg-[#123D8D] text-white text-[12px] px-3 py-1.5 rounded hover:bg-[#0d2f6e] disabled:opacity-50"
                  >
                    {isLoading[cand.id] ? "Fetching Experience..." : "Fetch LinkedIn Exp"}
                  </button>
                </div>
              )}

              {/* Header / Name Bar */}
            <div className="flex h-[38px] rounded-lg overflow-hidden shadow-sm mb-4 shrink-0">
              <div className="bg-[#e28723] w-[50px] flex items-center justify-center font-bold text-[22px] text-white shrink-0 pr-1" style={{ borderBottomRightRadius: '16px', borderTopRightRadius: '16px' }}>
                {String(idx + 1).padStart(2, '0')}
              </div>
              <div className="bg-[#00174f] flex-1 flex items-center pl-4 text-white text-[18px] font-bold uppercase tracking-wide" contentEditable suppressContentEditableWarning>
                {cand.name}
              </div>
            </div>

            {/* Profile Info Section */}
            <div className="flex gap-6 items-center mb-4 shrink-0">
              {/* Photo */}
              <div className="flex flex-col items-center shrink-0 ml-1">
                <div className="w-[140px] h-[140px] rounded-full bg-blue-50 flex items-center justify-center text-5xl font-bold text-[#00174f] border-[1px] border-gray-200 overflow-hidden shadow-inner shrink-0" style={{ boxShadow: "inset 0 4px 6px rgba(0,0,0,0.1)" }}>
                  {cand.initials || cand.name.substring(0, 2).toUpperCase()}
                </div>
              </div>

              {/* Info Fields */}
              <div className="flex-1 flex flex-col gap-2">
                <DetailRow icon={
                  <svg className="w-6 h-6 text-[#e28723]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                } label="Current Company" value={rp["Current Company"] || cand.company || "N/A"} />
                <DetailRow icon={
                  <svg className="w-6 h-6 text-[#e28723]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                } label="Designation" value={rp["Designation"] || cand.role || "N/A"} />
                <DetailRow icon={
                  <svg className="w-6 h-6 text-[#e28723]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                } label="Former Company" value={rp["Former Company"] || "N/A"} />
                <DetailRow icon={
                  <svg className="w-6 h-6 text-[#e28723]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                } label="Experience" value={cand.exp ? cand.exp + " Years" : "N/A"} />
                <DetailRow icon={
                  <svg className="w-6 h-6 text-[#e28723]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                } label="Revenue Ownership" value={rp["Revenue Ownership"] || "N/A"} />
                <DetailRow icon={
                  <svg className="w-6 h-6 text-[#e28723]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                } label="Team Size Led" value={rp["Team Size Led"] || "N/A"} />
              </div>
            </div>

            {/* Notes Sections */}
            <div className="flex flex-col gap-2">
              <div className="w-full border-t border-dashed border-gray-300"></div>
              <SectionBlock title="NOTES" items={notes} />
              
              <div className="w-full border-t border-dashed border-gray-300"></div>
              <SectionBlock title="ASSESSMENT NOTES" items={assessmentNotes} />

              {/* Injected Work Experience from Apify */}
              {apifyData[cand.id] && apifyData[cand.id].experiences && (
                <>
                  <div className="w-full border-t border-dashed border-gray-300"></div>
                  <SectionBlock 
                    title="WORK EXPERIENCE (LinkedIn)" 
                    items={apifyData[cand.id].experiences.map((e: any) => `${e.title || 'Role'} at ${e.company || 'Company'} (${e.starts_at ? e.starts_at + ' - ' + (e.ends_at || 'Present') : 'Dates'})`)} 
                  />
                </>
              )}
            </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 flex items-center justify-center shrink-0 border border-[#e28723] rounded-full text-[#e28723] bg-orange-50/50">
        <div className="scale-[0.8]">{icon}</div>
      </div>
      <div className="flex flex-col border-b border-dashed border-gray-300 pb-[4px] w-full">
        <div className="text-[12px] font-bold text-[#00174f] tracking-wide leading-none mb-0.5">{label}</div>
        <div className="text-[13px] text-[#333] font-medium leading-tight" contentEditable suppressContentEditableWarning>{value}</div>
      </div>
    </div>
  );
}

function SectionBlock({ title, items }: { title: string, items: any }) {
  const list = Array.isArray(items) ? items : [items];
  return (
    <div className="flex flex-col">
      <h3 className="text-[#e28723] text-[15px] font-bold uppercase tracking-wider mb-1.5 shrink-0">{title}</h3>
      <ul className="list-none space-y-1.5">
        {list.map((item: string, i: number) => (
          <li key={i} className="flex items-start text-[13px] text-[#333] font-medium leading-snug">
            <svg className="w-4 h-4 text-[#e28723] mr-3 mt-[3px] shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span contentEditable suppressContentEditableWarning className="flex-1 outline-none focus:bg-yellow-50">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
