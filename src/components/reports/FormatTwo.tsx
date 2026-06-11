"use client";

import React from "react";

export default function FormatTwo({ mandate, candidates }: { mandate: any, candidates: any[] }) {
  return (
    <div className="flex flex-col gap-10 bg-gray-100 py-10 items-center min-h-screen">
      {candidates.map((cand, idx) => {
        const rp = cand.reportData || {};
        const notes = rp["Notes Summary"] || rp["Key Strengths"] || ["17+ years of leadership experience across luxury retail and hospitality, currently leading the people and culture agenda..."];
        
        return (
          <div key={cand.id} className="bg-white w-[794px] h-[1122px] mx-auto shadow-xl print:shadow-none relative overflow-hidden flex flex-col font-sans break-after-page mb-10 print:mb-0 box-border print:scale-100 max-w-none">
            <style type="text/css" media="print">
              {`
                @page { size: A4; margin: 0mm; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              `}
            </style>
            
            {/* Header / Name Bar */}
            <div className="flex h-[60px] mx-10 mt-12 rounded-lg overflow-hidden shadow-sm">
              <div className="bg-[#e28723] w-[80px] flex items-center justify-center font-bold text-[36px] text-white shrink-0 pr-1">
                {String(idx + 1).padStart(2, '0')}
              </div>
              <div className="bg-[#00174f] flex-1 flex items-center pl-6 text-white text-[28px] font-bold uppercase tracking-wide" contentEditable suppressContentEditableWarning>
                {cand.name}
              </div>
            </div>

            {/* Profile Info Section */}
            <div className="flex px-[60px] pt-[40px] gap-12 items-center">
              {/* Photo & LinkedIn */}
              <div className="flex flex-col items-center gap-6 w-[260px] shrink-0">
                <div className="w-[260px] h-[260px] rounded-full bg-blue-50 flex items-center justify-center text-7xl font-bold text-[#00174f] border-[6px] border-white shadow-lg overflow-hidden shrink-0" style={{ boxShadow: "0 0 0 2px #f0f0f0, 0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}>
                  {cand.initials || cand.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex items-center gap-2 text-[#0077b5] font-bold text-[15px] cursor-pointer" contentEditable suppressContentEditableWarning>
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  LinkedIn
                </div>
              </div>

              {/* Info Fields */}
              <div className="flex-1 flex flex-col gap-6 pt-2 pr-6">
                <DetailRow icon={
                  <svg className="w-7 h-7 text-[#e28723]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                } label="Current Company" value={rp["Current Company"] || cand.company || "N/A"} />
                <DetailRow icon={
                  <svg className="w-7 h-7 text-[#e28723]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                } label="Designation" value={rp["Designation"] || cand.role || "N/A"} />
                <DetailRow icon={
                  <svg className="w-7 h-7 text-[#e28723]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                } label="Former Company" value={rp["Former Company"] || "N/A"} />
                <DetailRow icon={
                  <svg className="w-7 h-7 text-[#e28723]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                  </svg>
                } label="CTC" value={rp["CTC"] || "N/A"} />
                <DetailRow icon={
                  <svg className="w-7 h-7 text-[#e28723]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                  </svg>
                } label="ECTC" value={rp["Expected CTC"] || "N/A"} />
                <DetailRow icon={
                  <svg className="w-7 h-7 text-[#e28723]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                } label="Pedigree" value={rp["Pedigree"] || "N/A"} />
              </div>
            </div>

            <div className="mx-10 mt-[40px] border-t border-dashed border-gray-400"></div>

            <div className="px-10 mt-6 flex-1">
              <h3 className="text-[#e28723] text-[22px] font-bold uppercase tracking-wider mb-5">NOTES</h3>
              <ul className="list-none space-y-4">
                {Array.isArray(notes) ? notes.map((item: string, i: number) => (
                  <li key={i} className="flex items-start text-[14px] text-[#333] font-medium leading-relaxed">
                    <svg className="w-5 h-5 text-[#e28723] mr-4 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span contentEditable suppressContentEditableWarning className="flex-1 outline-none focus:bg-yellow-50">{item}</span>
                  </li>
                )) : (
                  <li className="flex items-start text-[14px] text-[#333] font-medium leading-relaxed">
                    <svg className="w-5 h-5 text-[#e28723] mr-4 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span contentEditable suppressContentEditableWarning className="flex-1 outline-none focus:bg-yellow-50">{notes}</span>
                  </li>
                )}
              </ul>
            </div>

          </div>
        );
      })}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-5">
      <div className="w-12 h-12 flex items-center justify-center shrink-0 border border-gray-100 rounded shadow-sm">
        {icon}
      </div>
      <div className="flex flex-col border-b border-gray-200 pb-2 w-full">
        <div className="text-[14px] font-bold text-[#00174f]">{label}</div>
        <div className="text-[15px] text-gray-800 leading-tight mt-[2px]" contentEditable suppressContentEditableWarning>{value}</div>
      </div>
    </div>
  );
}
