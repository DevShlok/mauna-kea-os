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

  // Drag and Drop State using Refs for stability
  const [page1Blocks, setPage1Blocks] = useState([
    'notes_summary', 'famous_for', 'career_aspiration', 'relevant_experience', 'motivation'
  ]);
  const [page2Blocks, setPage2Blocks] = useState([
    'key_strengths', 'areas_to_probe', 'compensation', 'recommendation'
  ]);



  const moveBlock = (page: number, index: number, direction: 'up' | 'down') => {
    const isPage1 = page === 1;
    const blocks = isPage1 ? [...page1Blocks] : [...page2Blocks];
    
    if (direction === 'up' && index > 0) {
      const temp = blocks[index - 1];
      blocks[index - 1] = blocks[index];
      blocks[index] = temp;
    } else if (direction === 'down' && index < blocks.length - 1) {
      const temp = blocks[index + 1];
      blocks[index + 1] = blocks[index];
      blocks[index] = temp;
    } else {
      return;
    }
    
    if (isPage1) setPage1Blocks(blocks);
    else setPage2Blocks(blocks);
  };

  const hasInterviewer = rp["Interviewer Feedback"] && rp["Interviewer Feedback"].trim() !== "" && !rp["Interviewer Feedback"].toLowerCase().includes("not provided");
  const hasSuperior = rp["Superior Feedback"] && rp["Superior Feedback"].trim() !== "" && !rp["Superior Feedback"].toLowerCase().includes("not provided");
  const hasPeer = rp["Peer Feedback"] && rp["Peer Feedback"].trim() !== "" && !rp["Peer Feedback"].toLowerCase().includes("not provided");
  const hasTeam = rp["Team/Subordinate Feedback"] && rp["Team/Subordinate Feedback"].trim() !== "" && !rp["Team/Subordinate Feedback"].toLowerCase().includes("not provided");

  const renderBlock = (blockId: string) => {
    const f2 = rp._format2 || {};
    
    switch(blockId) {
      case 'notes_summary':
        return (
          <p contentEditable suppressContentEditableWarning>
            {f2.notes_summary || rp["Notes Summary"]?.join(" ") || `${cand.name} is a finance and strategy leader with extensive experience...`}
          </p>
        );
      case 'famous_for':
        if (f2.famous_for && f2.famous_for.length > 0) {
          return (
            <div>
              <h3 className={`text-[17px] font-bold ${headerColor} mb-2`} contentEditable suppressContentEditableWarning>
                What is {cand.name.split(' ')[0]} famous for
              </h3>
              <div className="space-y-1 ml-4 list-disc list-outside" contentEditable suppressContentEditableWarning>
                {f2.famous_for.map((item: string, i: number) => (
                  <li key={i} className="pl-1 leading-snug">{item}</li>
                ))}
              </div>
            </div>
          );
        }
        if (!hasInterviewer && !hasSuperior && !hasPeer && !hasTeam) return null;
        return (
          <div>
            <h3 className={`text-[17px] font-bold ${headerColor} mb-2`} contentEditable suppressContentEditableWarning>
              What is {cand.name.split(' ')[0]} famous for
            </h3>
            <div className="space-y-2 ml-2">
              {hasInterviewer && (
                <p contentEditable suppressContentEditableWarning>
                  <strong>Interviewer Feedback:</strong> {rp["Interviewer Feedback"]}
                </p>
              )}
              {hasTeam && (
                <p contentEditable suppressContentEditableWarning>
                  <strong>Team/Subordinate Feedback:</strong> {rp["Team/Subordinate Feedback"]}
                </p>
              )}
              {hasSuperior && (
                <p contentEditable suppressContentEditableWarning>
                  <strong>Superior Feedback:</strong> {rp["Superior Feedback"]}
                </p>
              )}
              {hasPeer && (
                <p contentEditable suppressContentEditableWarning>
                  <strong>Peer Feedback:</strong> {rp["Peer Feedback"]}
                </p>
              )}
            </div>
          </div>
        );
      case 'career_aspiration':
        const aspirationText = f2.career_aspiration || rp["Career Aspiration"] || [
          cand.dreamRoles && cand.dreamRoles.length > 0 ? `Target Roles: ${cand.dreamRoles.join(', ')}` : '',
          cand.dreamCos && cand.dreamCos.length > 0 ? `Target Companies: ${cand.dreamCos.join(', ')}` : ''
        ].filter(Boolean).join('. ');
        
        return (
          <div>
            <h3 className={`text-[17px] font-bold ${headerColor} mb-2`} contentEditable suppressContentEditableWarning>
              Career aspiration
            </h3>
            <p contentEditable suppressContentEditableWarning>
              {aspirationText}
            </p>
          </div>
        );
      case 'relevant_experience':
        const exps = f2.relevant_experience || experienceList;
        return (
          <div>
            <h3 className={`text-[17px] font-bold ${headerColor} mb-2`} contentEditable suppressContentEditableWarning>
              Relevant Experience
            </h3>
            <div className="space-y-2 ml-4 list-disc list-outside" contentEditable suppressContentEditableWarning>
              {exps && exps.length > 0 ? exps.map((e: any, i: number) => (
                <li key={i} className="pl-1">
                  <strong>{e.companyName} {e.duration ? `(${e.duration})` : ''}</strong>
                  {e.position ? ` - ${e.position}` : ''}
                  {e.highlights && e.highlights.map((hl: string, j: number) => (
                    <div key={j} className="text-[13px] text-gray-700 mt-1 ml-2">• {hl}</div>
                  ))}
                </li>
              )) : (
                <li className="pl-1">
                  <strong>{cand.company || "Current Company"} (Current)</strong> 
                </li>
              )}
            </div>
          </div>
        );
      case 'motivation':
        return (
          <div>
            <h3 className={`text-[17px] font-bold ${headerColor} mb-2`} contentEditable suppressContentEditableWarning>
              Motivation for the role
            </h3>
            <p contentEditable suppressContentEditableWarning>
              {f2.motivation || rp["Motivation"] || ""}
            </p>
          </div>
        );
      case 'key_strengths':
        const strengths = f2.key_strengths || rp["Key Strengths"] || [];
        return (
          <div>
            <h3 className={`text-[16px] font-bold ${headerColor} mb-1`} contentEditable suppressContentEditableWarning>
              Key Strengths
            </h3>
            <div className="space-y-1 ml-4 list-disc list-outside" contentEditable suppressContentEditableWarning>
              {strengths.map((item: string, i: number) => (
                <li key={i} className="pl-1 leading-snug">{item}</li>
              ))}
            </div>
          </div>
        );
      case 'areas_to_probe':
        const areas = f2.areas_to_probe || rp["Areas to Probe"] || [];
        return (
          <div>
            <h3 className={`text-[16px] font-bold ${headerColor} mb-1`} contentEditable suppressContentEditableWarning>
              Areas to Probe
            </h3>
            <div className="space-y-1 ml-4 list-disc list-outside" contentEditable suppressContentEditableWarning>
              {areas.map((item: string, i: number) => (
                <li key={i} className="pl-1 leading-snug">{item}</li>
              ))}
            </div>
          </div>
        );
      case 'compensation':
        const comp = f2.compensation || { current: rp["CTC"] || cand.ctc || "Not Disclosed", expected: rp["Expected CTC"] || cand.expectedCtc || "Not Disclosed" };
        return (
          <div>
            <h3 className={`text-[16px] font-bold ${headerColor} mb-1`} contentEditable suppressContentEditableWarning>
              Compensation
            </h3>
            <div className="space-y-1 ml-4 list-disc list-outside" contentEditable suppressContentEditableWarning>
              <li className="pl-1"><strong>Current:</strong> {comp.current}</li>
              <li className="pl-1"><strong>Expected:</strong> {comp.expected}</li>
            </div>
          </div>
        );
      case 'recommendation':
        return (
          <div>
            <h3 className={`text-[16px] font-bold ${headerColor} mb-1`} contentEditable suppressContentEditableWarning>
              Recommendation
            </h3>
            <p contentEditable suppressContentEditableWarning className="text-[13px] leading-relaxed">
              {f2.recommendation || rp["Recommendation"] || rp["MK Recommendation"] || ""}
            </p>
          </div>
        );
      default: return null;
    }
  };

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
      const startRes = await fetch('/api/apify-linkedin', {
        method: 'POST',
        body: JSON.stringify({ url: cand.linkedin }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await startRes.json();
      setIsScraping(false);
      
      if (data.error) throw new Error(data.error);
      
      const exp = data.data?.experiences || data.data?.experience || [];
      if (exp.length > 0) {
        const parsedExp = exp.slice(0, 6).map((e: any) => ({
          companyName: e.company || e.company_name || e.companyName || "Unknown",
          position: e.title || e.position || "Unknown Role",
          duration: e.starts_at ? `${e.starts_at} - ${e.ends_at || 'Present'}` : (e.dateRange || e.duration || ""),
          startDate: "",
          endDate: "",
          domain: (e.company || "Unknown").toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'
        }));
        setExperienceList(parsedExp);
      } else {
        alert("No experience records found on this profile.");
      }
    } catch (e: any) {
      setIsScraping(false);
      alert(e.message);
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
    <div className="flex flex-col gap-10 print:gap-0">
      <style type="text/css" media="print" dangerouslySetInnerHTML={{ __html: PageStyle }} />

      {/* PAGE 1 */}
      <div className={`bg-white w-[794px] h-[1122px] mx-auto shadow-2xl print:shadow-none relative box-border print:scale-100 max-w-none px-[40px] py-[35px] overflow-hidden print:break-after-page ${fontStyle}`}>
        {/* Header */}
        <div className="flex justify-end w-full mb-4 pb-2 border-b border-gray-200">
          <h1 className="text-3xl font-serif font-medium text-black tracking-[0.4em] uppercase" contentEditable suppressContentEditableWarning>
            MAUNA KEA
          </h1>
        </div>

        {/* Top Profile + Timeline Section */}
        <div className="flex flex-row justify-between w-full min-h-[160px]">
          {/* Left: Profile */}
          <div className="w-[30%] flex flex-col items-center">
            <div className="relative w-[120px] h-[120px]">
              <div className={`w-[120px] h-[120px] rounded-full border-4 border-black object-cover flex items-center justify-center text-4xl font-bold text-black bg-gray-50 shadow-md overflow-hidden`}>
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
              className="mt-3 print:hidden bg-[#133255] hover:bg-[#133255] text-white text-[10px] font-bold py-1 px-3 rounded-full flex items-center justify-center shadow-sm"
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
            <div className="flex flex-col gap-4 z-10 relative">
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
        <div className="mt-6 text-[14px] leading-relaxed text-justify space-y-5">
          {page1Blocks.map((blockId, index) => {
            const content = renderBlock(blockId);
            if (!content) return null;
            return (
              <div 
                key={blockId}
                className="group relative"
              >
                {/* Move Controls (visible on hover) */}
                <div className="absolute -left-9 top-0 opacity-0 group-hover:opacity-100 flex flex-col gap-1 print:hidden z-50">
                  <button 
                    onClick={() => moveBlock(1, index, 'up')}
                    disabled={index === 0}
                    className="p-1 bg-white rounded shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-[#133255] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move Up"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7"></path></svg>
                  </button>
                  <button 
                    onClick={() => moveBlock(1, index, 'down')}
                    disabled={index === page1Blocks.length - 1}
                    className="p-1 bg-white rounded shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-[#133255] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move Down"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                </div>
                {content}
              </div>
            );
          })}
        </div>
      </div>

      {/* PAGE 2 */}
      <div className={`bg-white w-[794px] h-[1122px] mx-auto shadow-2xl print:shadow-none relative box-border print:scale-100 max-w-none px-[40px] py-[35px] overflow-hidden ${fontStyle}`}>
        {/* Header */}
        <div className="flex justify-end w-full mb-3 pb-2 border-b border-gray-200">
          <h1 className="text-3xl font-serif font-medium text-black tracking-[0.4em] uppercase" contentEditable suppressContentEditableWarning>
            MAUNA KEA
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
                    // Calculate left percentage based on 0-10 score (default 5 if not set)
                    const score = scores?.[c.id] !== undefined ? scores[c.id] : 5;
                    const leftPercent = `${(score / 10) * 100}%`;
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
        <div className="text-[13px] leading-snug text-justify space-y-3">
          {page2Blocks.map((blockId, index) => {
            const content = renderBlock(blockId);
            if (!content) return null;
            return (
              <div 
                key={blockId}
                className="group relative"
              >
                {/* Move Controls (visible on hover) */}
                <div className="absolute -left-9 top-0 opacity-0 group-hover:opacity-100 flex flex-col gap-1 print:hidden z-50">
                  <button 
                    onClick={() => moveBlock(2, index, 'up')}
                    disabled={index === 0}
                    className="p-1 bg-white rounded shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-[#133255] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move Up"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7"></path></svg>
                  </button>
                  <button 
                    onClick={() => moveBlock(2, index, 'down')}
                    disabled={index === page2Blocks.length - 1}
                    className="p-1 bg-white rounded shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-[#133255] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move Down"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                </div>
                {content}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
