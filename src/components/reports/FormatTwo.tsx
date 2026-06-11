"use client";

import React, { useState, useEffect } from "react";

export default function FormatTwo({ mandate, candidates, framework, scores }: { mandate: any, candidates: any[], framework?: any, scores?: Record<number, number> }) {
  return (
    <div className="flex flex-col gap-10 bg-gray-200 py-10 items-center min-h-screen print:block print:bg-white print:py-0 print:gap-0">
      {candidates.map((cand, idx) => {
        return <CandidateFormatTwo key={cand.id} cand={cand} framework={framework} scores={scores} />;
      })}
    </div>
  );
}

function CandidateFormatTwo({ cand, framework, scores }: { cand: any, framework?: any, scores?: Record<number, number> }) {
  const rp = cand.reportData || {};
  
  // State for timeline data (up to 6 items)
  const [experienceList, setExperienceList] = useState<{
    companyName: string;
    position: string;
    duration: string;
    startDate: string;
    endDate: string;
    domain: string;
  }[]>([]);

  const [isScraping, setIsScraping] = useState(false);

  // Initialize with some default if empty
  useEffect(() => {
    if (experienceList.length === 0) {
      setExperienceList([
        {
          companyName: rp["Current Company"] || cand.company || "Current Company",
          position: rp["Designation"] || cand.role || "Current Role",
          duration: "",
          startDate: "",
          endDate: "Present",
          domain: (rp["Current Company"] || cand.company || "Current Company").toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'
        }
      ]);
    }
  }, []);

  const fetchLinkedIn = async () => {
    if (!cand.linkedin) {
      alert("No LinkedIn URL found for this candidate.");
      return;
    }
    setIsScraping(true);
    try {
      const startRes = await fetch('/api/linkedin/start', {
        method: 'POST',
        body: JSON.stringify({ url: cand.linkedin }),
        headers: { 'Content-Type': 'application/json' }
      });
      const startData = await startRes.json();
      if (!startData.runId) throw new Error(startData.error || "Failed to start scraper");
      
      const poll = setInterval(async () => {
        const statusRes = await fetch(`/api/linkedin/status?runId=${startData.runId}`);
        const data = await statusRes.json();
        
        if (data.status === 'SUCCEEDED') {
          clearInterval(poll);
          setIsScraping(false);
          const exp = data.data?.experience || [];
          if (exp.length > 0) {
            const parsedExp = exp.slice(0, 6).map((e: any) => ({
              companyName: e.companyName || "Unknown",
              position: e.position || "Unknown Role",
              duration: e.duration || "",
              startDate: e.startDate?.text || "",
              endDate: e.endDate?.text || "Present",
              domain: e.companyUniversalName ? e.companyUniversalName + ".com" : (e.companyName || "company").toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'
            }));
            setExperienceList(parsedExp);
          } else {
            alert("LinkedIn scrape succeeded, but no experience data was found.");
          }
        } else if (data.status === 'FAILED') {
          clearInterval(poll);
          setIsScraping(false);
          alert("LinkedIn scraping failed! The profile may be private or invalid.");
        }
      }, 5000);
    } catch (e: any) {
      setIsScraping(false);
      alert("Error: " + e.message);
    }
  };

  const PageStyle = `
    @page { size: A4; margin: 0mm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  `;

  // Standard Serif Font styling
  const fontStyle = "font-serif text-[#1e293b]";
  const headerColor = "text-[#003366]";

  return (
    <div className="flex flex-col gap-10">
      <style type="text/css" media="print" dangerouslySetInnerHTML={{ __html: PageStyle }} />

      {/* PAGE 1 */}
      <div className={`bg-white w-[794px] h-[1122px] mx-auto shadow-2xl print:shadow-none relative box-border print:scale-100 max-w-none p-[50px] overflow-hidden print:break-after-page ${fontStyle}`}>
        {/* Header */}
        <div className="flex justify-end mb-4 border-b border-gray-200 pb-3">
          <h1 className={`text-2xl font-bold ${headerColor}`} contentEditable suppressContentEditableWarning>
            <span className="font-normal text-gray-700">Mauna Kea</span> International
          </h1>
        </div>

        {/* Top Profile + Timeline Section */}
        <div className="flex flex-row justify-between w-full h-[260px]">
          {/* Left: Profile */}
          <div className="w-[30%] flex flex-col items-center">
            <div className="relative w-[140px] h-[140px]">
              <div className={`w-[140px] h-[140px] rounded-full border-4 border-black object-cover flex items-center justify-center text-5xl font-bold text-black bg-gray-50 shadow-md overflow-hidden`}>
                {cand.profilePic ? (
                  <img src={cand.profilePic} alt={cand.name} className="w-full h-full object-cover" />
                ) : (
                  cand.initials || cand.name.substring(0, 2).toUpperCase()
                )}
              </div>
              {cand.linkedin && (
                <a href={cand.linkedin} target="_blank" rel="noopener noreferrer" className="absolute bottom-0 right-0 bg-white rounded-md p-1 shadow-md cursor-pointer">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" className="w-[28px]" />
                </a>
              )}
            </div>
            
            <button 
              onClick={fetchLinkedIn}
              disabled={isScraping}
              className="mt-3 print:hidden bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1 px-3 rounded-full flex items-center justify-center shadow-sm"
            >
              {isScraping ? "Scraping..." : "Fetch LinkedIn"}
            </button>
            
            <h2 className={`text-[20px] font-bold mt-4 text-center ${headerColor}`} contentEditable suppressContentEditableWarning>
              {cand.name}
            </h2>
          </div>

          {/* Right: Timeline Grid */}
          <div className="w-[65%] border border-gray-100 bg-gray-50/30 rounded-xl p-4 overflow-hidden relative">
            <div className="absolute left-[39%] top-6 bottom-6 w-[2px] bg-blue-100 z-0"></div>
            <div className="flex flex-col gap-5 z-10 relative">
              {experienceList.map((exp, i) => (
                <div key={i} className="flex flex-row items-center justify-between text-[11px]">
                  <div className="w-[35%] flex items-center gap-3">
                    <img 
                      src={`https://logo.clearbit.com/${exp.domain}`} 
                      alt={exp.companyName}
                      className="w-[30px] h-[30px] object-contain bg-white border border-gray-200 rounded p-0.5"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=" + exp.companyName + "&background=ffffff&color=000000";
                      }}
                    />
                    <div className="font-bold truncate" contentEditable suppressContentEditableWarning>
                      {exp.companyName}
                    </div>
                  </div>
                  
                  <div className="w-[5%] flex justify-center relative">
                    <div className="w-[10px] h-[10px] rounded-full bg-gray-400 z-10 border-2 border-white shadow-sm"></div>
                  </div>

                  <div className="w-[25%] text-gray-600 text-center" contentEditable suppressContentEditableWarning>
                    {exp.startDate ? `${exp.startDate.split(' ')[1] || exp.startDate} - ${exp.endDate?.split(' ')[1] || exp.endDate}` : exp.endDate}
                  </div>

                  <div className="w-[35%] font-medium text-gray-800" contentEditable suppressContentEditableWarning>
                    {exp.position}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Blocks */}
        <div className="mt-5 text-[14px] leading-relaxed text-justify space-y-4">
          <p contentEditable suppressContentEditableWarning>
            {rp["Notes Summary"]?.join(" ") || `${cand.name} is a finance and strategy leader with extensive experience...`}
          </p>

          <div>
            <h3 className={`text-[18px] font-bold ${headerColor} mb-2`} contentEditable suppressContentEditableWarning>
              What is {cand.name.split(' ')[0]} famous for
            </h3>
            <div className="space-y-2 ml-2">
              <p contentEditable suppressContentEditableWarning>Team feedback</p>
              <p contentEditable suppressContentEditableWarning>Superior feedback</p>
              <p contentEditable suppressContentEditableWarning>Peer feedback</p>
            </div>
          </div>

          <div>
            <h3 className={`text-[18px] font-bold ${headerColor} mb-2`} contentEditable suppressContentEditableWarning>
              Career aspiration
            </h3>
            <p contentEditable suppressContentEditableWarning>
              Details about career aspiration can be filled here...
            </p>
          </div>

          <div>
            <h3 className={`text-[18px] font-bold ${headerColor} mb-2`} contentEditable suppressContentEditableWarning>
              Relevant Experience
            </h3>
            <div className="space-y-2 ml-4 list-disc list-outside" contentEditable suppressContentEditableWarning>
              <li className="pl-1">
                <strong>{experienceList[0]?.companyName} (Current):</strong> Description of relevant achievements...
              </li>
              <li className="pl-1">
                <strong>{experienceList[1]?.companyName}:</strong> Description of relevant achievements...
              </li>
            </div>
          </div>

          <div>
            <h3 className={`text-[18px] font-bold ${headerColor} mb-2`} contentEditable suppressContentEditableWarning>
              Motivation for the role
            </h3>
            <p contentEditable suppressContentEditableWarning>
              Motivated by the opportunity to move into a broader strategic leadership role...
            </p>
          </div>
        </div>
      </div>

      {/* PAGE 2 */}
      <div className={`bg-white w-[794px] h-[1122px] mx-auto shadow-2xl print:shadow-none relative box-border print:scale-100 max-w-none p-[50px] overflow-hidden ${fontStyle}`}>
        {/* Header */}
        <div className="flex justify-end mb-2">
          <h1 className={`text-2xl font-bold ${headerColor}`} contentEditable suppressContentEditableWarning>
            <span className="font-normal text-gray-700">Mauna Kea</span> International
          </h1>
        </div>
        <div className="mb-3">
          <h2 className={`text-[20px] font-bold ${headerColor}`}>Evaluation against key criterion</h2>
        </div>

        {/* Framework Evaluation Table */}
        <div className="bg-[#f5f8fc] rounded-md p-4 mb-4 border border-[#e2e8f0]">
          {framework ? (
            framework.categories.map((cat: any, i: number) => (
              <div key={cat.id} className={i !== 0 ? "mt-4" : ""}>
                <h3 className="font-bold text-[16px] text-gray-900 mb-2">
                  {i + 1}. {cat.name}
                </h3>
                <div className="ml-6 space-y-2 text-[14px]">
                  {cat.criteria.map((c: any, j: number) => {
                    // Calculate left percentage based on 1-10 score (default 5 if not set)
                    const score = scores?.[c.id] || 5;
                    const leftPercent = `${((score - 1) / 9) * 100}%`;
                    const letter = String.fromCharCode(65 + j); // A, B, C...
                    
                    return (
                      <div key={c.id} className="flex justify-between items-center text-gray-800">
                        <div className="w-[55%]">
                          {letter}. {c.name}
                        </div>
                        <div className="w-[45%] flex items-center justify-between text-[11px] text-gray-500 font-sans tracking-wide">
                          <span className="mr-3">Low</span>
                          <div className="flex-grow relative h-[1px] bg-gray-400">
                            <div 
                              className="absolute w-[12px] h-[12px] bg-[#003366] rounded-full top-1/2 -translate-y-1/2 shadow-sm cursor-pointer hover:scale-125 transition-transform" 
                              style={{ left: leftPercent }}
                              title={`Score: ${score}/10`}
                            ></div>
                          </div>
                          <span className="ml-3">High</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 italic text-center py-4">No framework data available to display evaluation criteria.</div>
          )}
        </div>

        {/* Remaining Content Blocks */}
        <div className="text-[14px] leading-relaxed text-justify space-y-4">
          <div>
            <h3 className={`text-[18px] font-bold ${headerColor} mb-3`} contentEditable suppressContentEditableWarning>
              Key Strengths
            </h3>
            <div className="space-y-2 ml-4 list-disc list-outside" contentEditable suppressContentEditableWarning>
              {rp["Key Strengths"]?.map((s: string, idx: number) => (
                <li key={idx} className="pl-1">{s}</li>
              )) || (
                <>
                  <li className="pl-1"><strong>Empathetic Leadership:</strong> Built a high-retention team from scratch...</li>
                  <li className="pl-1"><strong>Strategic Storytelling:</strong> Expert at translating complex financial data...</li>
                </>
              )}
            </div>
          </div>

          <div>
            <h3 className={`text-[18px] font-bold ${headerColor} mb-3`} contentEditable suppressContentEditableWarning>
              Areas to Probe
            </h3>
            <div className="space-y-2 ml-4 list-disc list-outside" contentEditable suppressContentEditableWarning>
              {rp["Risks"]?.map((r: string, idx: number) => (
                <li key={idx} className="pl-1">{r}</li>
              )) || (
                <>
                  <li className="pl-1"><strong>Delegation Balance:</strong> Due to his speed and focus on quality...</li>
                  <li className="pl-1"><strong>Proactive Insights:</strong> While collaborative, he aims to move beyond...</li>
                </>
              )}
            </div>
          </div>

          <div>
            <h3 className={`text-[18px] font-bold ${headerColor} mb-1`} contentEditable suppressContentEditableWarning>
              Compensation
            </h3>
            <p contentEditable suppressContentEditableWarning>
              ₹ 54 lakhs fixed + ~30% variable (~₹ 16 lakhs) + annual increment eligibility
            </p>
          </div>

          <div>
            <h3 className={`text-[18px] font-bold ${headerColor} mb-3`} contentEditable suppressContentEditableWarning>
              Mauna Kea Recommendation
            </h3>
            <p contentEditable suppressContentEditableWarning>
              {rp["Recommendation"]?.join(" ") || `${cand.name} is a strategic finance leader with deep expertise... His profile is best suited for organizations requiring structured financial governance and enhanced business visibility.`}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
