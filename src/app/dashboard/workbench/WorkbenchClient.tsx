"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import CandidateReportPDF from "@/components/reports/CandidateReportPDF";
import { updateCandidateStatusAction } from "@/app/actions";
import FormatOne from "@/components/reports/FormatOne";
import FormatTwo from "@/components/reports/FormatTwo";

interface WorkbenchClientProps {
  initialCandidate: any;
  frameworks: any[];
  candidates: any[];
  mandateCandidates: any[];
  mandates: any[];
}

export default function WorkbenchClient({ initialCandidate, frameworks, candidates, mandateCandidates, mandates }: WorkbenchClientProps) {
  const router = useRouter();
  
  const allCandidates = useMemo(() => {
    return candidates.map(c => ({
      ...c,
      searchId: c.id.toString(),
    }));
  }, [candidates]);

  const [selectedCandidateId, setSelectedCandidateId] = useState(
    initialCandidate ? (initialCandidate.externalId || initialCandidate.id).toString() : ""
  );
  const [frameworkId, setFrameworkId] = useState("");
  const [mandateId, setMandateId] = useState("");
  
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const sortedAndFilteredCandidates = useMemo(() => {
    let result = allCandidates.filter(c => 
      c.name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.company?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.designation?.toLowerCase().includes(candidateSearch.toLowerCase())
    );

    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key] || "";
        const bVal = b[sortConfig.key] || "";
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [allCandidates, candidateSearch, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const [interviewNotes, setInterviewNotes] = useState("");
  const [superiorRef, setSuperiorRef] = useState("");
  const [peerRef, setPeerRef] = useState("");
  
  // Scoring state: { [criterionId]: number }
  const [scores, setScores] = useState<Record<number, number>>({});
  const [overallScore, setOverallScore] = useState("0.0");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingFormat, setIsGeneratingFormat] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [reportExistsInDb, setReportExistsInDb] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Toggle between Assessment Draft and Final Reports
  const [activeView, setActiveView] = useState<"draft" | "format1" | "format2">("draft");

  const handleGenerateFormat = (format: "format1" | "format2", type: 'pdf' | 'pptx') => {
    setIsGeneratingFormat(true);
    setTimeout(() => {
      setIsGeneratingFormat(false);
      setActiveView(format);
      if (type === 'pptx') {
         alert("PPTX downloaded!");
      }
    }, 2000);
  };

  const selectedCandidate = allCandidates.find(c => c.searchId === selectedCandidateId);
  const selectedFramework = frameworks.find(f => f.id === frameworkId);
  const selectedMandate = mandates.find(m => m.id.toString() === mandateId) || { role: "Candidate Profile", company: "" };

  const filteredMandates = frameworkId ? mandates.filter(m => m.frameworkId?.toString() === frameworkId) : mandates;

  // Auto-load framework when a mandate is selected
  useEffect(() => {
    if (mandateId) {
      const selectedMandateForFramework = mandates.find(m => m.id.toString() === mandateId);
      if (selectedMandateForFramework && selectedMandateForFramework.frameworkId) {
        setFrameworkId(selectedMandateForFramework.frameworkId.toString());
      } else {
        setFrameworkId(""); // unlock if mandate has no framework
      }
    } else {
      setFrameworkId(""); // clear framework if mandate is cleared
    }
  }, [mandateId, mandates]);

  // Initialize scores to 7 when framework changes
  useEffect(() => {
    if (selectedFramework) {
      const initialScores: Record<number, number> = {};
      selectedFramework.categories.forEach((cat: any) => {
        cat.criteria.forEach((cr: any) => {
          initialScores[cr.id] = 7; // Default neutral score
        });
      });
      setScores(initialScores);
    }
  }, [frameworkId, selectedFramework]);

  // Recalculate Overall Score
  useEffect(() => {
    if (!selectedFramework) return;
    let totalWeightedScore = 0;
    let totalWeight = 0;
    selectedFramework.categories.forEach((cat: any) => {
      cat.criteria.forEach((cr: any) => {
        const val = scores[cr.id] || 0;
        const w = Number(cr.weight) || 10;
        totalWeightedScore += (val * w);
        totalWeight += w;
      });
    });
    
    if (totalWeight > 0) {
      setOverallScore((totalWeightedScore / totalWeight).toFixed(1));
    } else {
      setOverallScore("0.0");
    }
  }, [scores, selectedFramework]);

  // Auto-load existing report when candidate changes
  useEffect(() => {
    if (!selectedCandidateId) {
      setReportData(null);
      setReportExistsInDb(false);
      return;
    }

    const candidateRef = allCandidates.find(c => c.searchId === selectedCandidateId);
    if (!candidateRef) return;

    const candidateId = candidateRef.externalId || candidateRef.id;

    setIsLoadingReport(true);
    setReportData(null);
    setReportExistsInDb(false);
    setScores({});

    // Auto-select mandate if the candidate is attached to one
    if (candidateRef.mandateId) {
      setMandateId(candidateRef.mandateId.toString());
    } else {
      setMandateId("");
      setFrameworkId("");
    }

    fetch(`/api/latest-report?candidateId=${candidateId}`)
      .then(res => res.json())
      .then(data => {
        if (data.exists && data.report?.reportData) {
          setReportData(data.report.reportData);
          setInterviewNotes("");
          setSuperiorRef(data.report.reportData["Superior Reference"] || "");
          setPeerRef(data.report.reportData["Peer Reference"] || "");
          setReportId(data.report.id);
          setReportExistsInDb(true);
          
          if (data.report.frameworkId) {
            setFrameworkId(data.report.frameworkId.toString());
            
            // Map the AI-generated nested scores back to the UI's flat scores object
            const fw = frameworks.find((f: any) => f.id.toString() === data.report.frameworkId.toString());
            if (fw && data.report.reportData.scores) {
              const newScores: Record<number, number> = {};
              fw.categories.forEach((cat: any) => {
                cat.criteria.forEach((cr: any) => {
                  const val = data.report.reportData.scores[cat.name]?.[cr.name];
                  if (val !== undefined) {
                    newScores[cr.id] = val;
                  }
                });
              });
              setScores(newScores);
            }
          }
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingReport(false));
  }, [selectedCandidateId]);

  // Handle Polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating && reportId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/reports/${reportId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === "Completed") {
              setReportData(data.reportData);
              setIsGenerating(false);
              clearInterval(interval);
            } else if (data.status === "Failed") {
              alert("Report generation failed");
              setIsGenerating(false);
              clearInterval(interval);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGenerating, reportId]);

  const handleGenerate = async () => {
    if (!selectedCandidate) return alert("Please select a candidate first.");
    setIsGenerating(true);
    setReportData(null);

    let manualScoresText = "MANUAL SCORES ASSIGNED:\\n";
    if (selectedFramework) {
      selectedFramework.categories.forEach((cat: any) => {
        cat.criteria.forEach((cr: any) => {
          manualScoresText += `- ${cr.name}: ${scores[cr.id] || 0}/10\\n`;
        });
      });
    }

    // Combine notes to send to AI
    const combinedTranscript = `
      CANDIDATE CV TEXT:
      ${selectedCandidate.cvText || "No CV uploaded for this candidate."}

      ${manualScoresText}

      INTERVIEW NOTES:
      ${interviewNotes}

      SUPERIOR REFERENCE:
      ${superiorRef}

      PEER REFERENCE:
      ${peerRef}
    `;

    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: selectedCandidate.externalId || selectedCandidate.id,
          frameworkId,
          mandateId: mandateId || undefined,
          transcript: combinedTranscript,
          feedback: {
            superior: superiorRef,
            peer: peerRef
          }
        })
      });

      if (!res.ok) throw new Error("Failed to start generation");
      const data = await res.json();
      setReportId(data.reportId);
    } catch (e) {
      console.error(e);
      alert("Error starting generation");
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">AI Workbench</h1>
          {selectedFramework && <div className="text-[13px] text-gray-500">{selectedFramework.name} — {mandates.find(m => m.id.toString() === mandateId)?.company || "General Assessment"}</div>}
        </div>
      </div>

      {/* TOP CONFIG BAR */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6 flex gap-6 items-end">
        <div className="flex-1 relative">
          <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Select Candidate</label>
          <button 
            onClick={() => setIsCandidateModalOpen(true)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white text-left flex justify-between items-center hover:border-blue-500 transition-colors"
          >
            {selectedCandidate ? selectedCandidate.name : "-- Choose Candidate --"}
          </button>
        </div>
        
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Link Mandate</label>
          <select 
            value={mandateId} 
            onChange={e => setMandateId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
          >
            <option value="">-- None --</option>
            {filteredMandates.map(m => (
              <option key={m.id} value={m.id}>{m.role} @ {m.company}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Assessment Framework</label>
          <select 
            value={frameworkId} 
            onChange={e => setFrameworkId(e.target.value)}
            disabled={!!(mandateId && selectedMandate?.frameworkId)}
            className={`w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white ${!!(mandateId && selectedMandate?.frameworkId) ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
          >
            <option value="">-- Select Framework --</option>
            {frameworks.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedCandidate ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm flex flex-col items-center justify-center text-center h-[400px] text-gray-400">
          <div className="text-6xl mb-4 opacity-50">🤖</div>
          <p className="text-sm">Select a candidate from the dropdown above to begin their assessment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 items-start">
          {/* LEFT COLUMN: Evaluation Setup */}
          <div className="flex flex-col gap-6">
            
            {/* Candidate Files */}
            {(selectedCandidate.cvFileName || selectedCandidate.linkedinPdf) && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-3">
                <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Candidate Files</h3>
                <div className="flex gap-4">
                  {selectedCandidate.cvFileName && (
                    <a 
                      href={selectedCandidate.cvFileName?.startsWith('http') ? selectedCandidate.cvFileName : "#"} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-2 px-3 py-2 bg-[#f4f7fd] text-[#123D8D] rounded-md text-[13px] font-bold border border-[#D4E0F0] hover:bg-[#e6ebf5] transition-colors"
                      onClick={(e) => {
                        if (!selectedCandidate.cvFileName?.startsWith('http')) {
                          e.preventDefault();
                          alert("This candidate's CV failed to upload to the cloud previously. Please re-upload it from the Float List.");
                        }
                      }}
                    >
                      📄 View CV / Resume
                    </a>
                  )}
                  {selectedCandidate.linkedinPdf && (
                    <a 
                      href={selectedCandidate.linkedinPdf?.startsWith('http') ? selectedCandidate.linkedinPdf : "#"} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-2 px-3 py-2 bg-[#f0f9ff] text-[#0369a1] rounded-md text-[13px] font-bold border border-[#bae6fd] hover:bg-[#e0f2fe] transition-colors"
                      onClick={(e) => {
                        if (!selectedCandidate.linkedinPdf?.startsWith('http')) {
                          e.preventDefault();
                          alert("This candidate's LinkedIn PDF failed to upload to the cloud previously. Please re-upload it from the Float List.");
                        }
                      }}
                    >
                      📘 View LinkedIn PDF
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Criteria & Manual Scores */}
            {selectedFramework && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Assessment Criteria & Scores</h3>
                
                <div className="space-y-6">
                  {selectedFramework.categories.map((cat: any) => (
                    <div key={cat.id}>
                      <div className="text-xs font-bold text-blue-900 uppercase tracking-wide border-b-2 border-blue-100 pb-2 mb-3">
                        {cat.name}
                      </div>
                      <div className="space-y-3">
                        {cat.criteria.map((cr: any) => {
                          const val = scores[cr.id] || 1;
                          return (
                            <div key={cr.id} className="flex items-center gap-4 group">
                              <div className="w-[180px]">
                                <div className="text-[13px] font-bold text-gray-800">{cr.name}</div>
                                <div className="text-[10px] text-gray-500 uppercase">{cr.weight}% Weight</div>
                              </div>
                              
                              <div className="flex-1 flex items-center gap-3">
                                <input 
                                  type="range" 
                                  min="1" max="10" 
                                  value={val}
                                  onChange={(e) => setScores({ ...scores, [cr.id]: parseInt(e.target.value) })}
                                  className="w-full accent-blue-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="w-6 text-right font-bold text-gray-900 text-sm">{val}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
                  <span className="font-bold text-blue-900">Overall Score</span>
                  <span className={`text-xl font-bold px-3 py-1 rounded ${Number(overallScore) >= 8 ? 'bg-green-100 text-green-700' : Number(overallScore) >= 6.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {overallScore} / 10
                  </span>
                </div>
              </div>
            )}

            {/* Notes & Feedback */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Interview Notes</h3>
              <textarea 
                rows={4} 
                value={interviewNotes}
                onChange={e => setInterviewNotes(e.target.value)}
                placeholder="Paste interview notes here..."
                className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] outline-none focus:border-blue-900 resize-none"
              ></textarea>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Reference Feedback</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold text-gray-500 mb-1">Superior Reference</div>
                  <textarea rows={2} value={superiorRef} onChange={e => setSuperiorRef(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] outline-none focus:border-blue-900 resize-none" placeholder="Enter superior reference..."></textarea>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 mb-1">Peer Reference</div>
                  <textarea rows={2} value={peerRef} onChange={e => setPeerRef(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] outline-none focus:border-blue-900 resize-none" placeholder="Enter peer reference..."></textarea>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {reportExistsInDb && !isGenerating && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded text-[12px] text-green-700 font-semibold">
                  ✅ Assessment draft loaded from database
                </div>
              )}
              {isLoadingReport && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded text-[12px] text-blue-700">
                  <span className="w-3 h-3 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></span>
                  Loading existing assessment...
                </div>
              )}
              <button 
                onClick={handleGenerate} 
                disabled={isGenerating || isLoadingReport}
                className={`w-full py-3 rounded font-bold flex justify-center items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  reportExistsInDb
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300 text-sm"
                    : "bg-amber-600 text-white hover:bg-amber-700"
                }`}
              >
                {isGenerating ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span> : null}
                {isGenerating ? "AI is thinking..." : reportExistsInDb ? "🔄 Regenerate Assessment" : "Generate Assessment Draft"}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Output Preview */}
          <div>
            {isGeneratingFormat ? (
              <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm flex flex-col items-center justify-center text-center h-[600px] sticky top-6">
                <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="text-lg font-bold text-blue-900 mb-2">AI is Generating Report</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Formatting the assessment into the selected layout...
                </p>
              </div>
            ) : reportData ? (
              <div className="flex flex-col gap-4">
                {activeView === "draft" && (
                  <CandidateReportPDF 
                    candidate={selectedCandidate} 
                    frameworkName={selectedFramework?.name || "Assessment"} 
                    reportData={reportData}
                    onReportDataChange={(newData) => setReportData(newData)}
                    onGeneratePdf={(format) => handleGenerateFormat(format, 'pdf')}
                    onGeneratePptx={(format) => handleGenerateFormat(format, 'pptx')}
                  />
                )}
              </div>
            ) : isGenerating ? (
              <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm flex flex-col items-center justify-center text-center h-[600px] sticky top-6">
                <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="text-lg font-bold text-blue-900 mb-2">Analyzing Candidate</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Synthesizing interview notes and reference feedback against the {selectedFramework?.name} criteria.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm flex flex-col items-center justify-center text-center h-[600px] text-gray-400 sticky top-6">
                <div className="text-6xl mb-4 opacity-50">🤖</div>
                <p className="text-sm text-gray-500">Click <strong>Generate Assessment Draft</strong> to create the assessment draft.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Screen Report Preview Modal */}
      {(activeView === "format1" || activeView === "format2") && reportData && selectedMandate && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex flex-col items-center overflow-y-auto print:static print:bg-white print:overflow-visible print:block">
          
          {/* Modal Header */}
          <div className="w-[794px] flex justify-between items-center bg-white mt-10 mb-6 p-4 rounded-xl shadow-xl border border-gray-200 print:hidden shrink-0 animate-in slide-in-from-top-4 duration-300">
            <span className="text-sm font-bold text-blue-900 uppercase ml-2">Final Report Preview</span>
            <div className="flex gap-4 items-center">
              <button onClick={() => window.print()} className="px-5 py-2 bg-yellow-500 text-blue-900 rounded-lg text-sm font-bold hover:bg-yellow-400 shadow-sm transition-colors">
                Print / Download PDF
              </button>
              <button 
                onClick={() => setActiveView("draft")} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors font-bold text-lg"
                title="Close Preview"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Modal Body / Report */}
          <div className="print:absolute print:left-0 print:top-0 print:w-full print:bg-white print:z-[9999] print:overflow-visible print:block pb-20 animate-in fade-in zoom-in-95 duration-300 shrink-0">
            {activeView === "format1" && (
              <FormatTwo 
                mandate={selectedMandate} 
                candidates={[{ ...selectedCandidate, reportData }]} 
                framework={selectedFramework}
                scores={scores}
              />
            )}
            {activeView === "format2" && (
              <FormatOne mandate={selectedMandate} candidates={[{...selectedCandidate, reportData}]} />
            )}
          </div>
        </div>
      )}

      {/* Candidate Selection Modal */}
      {isCandidateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-[1000px] h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Float Database</h2>
                <p className="text-xs text-gray-500 mt-1">Select a candidate to assess in the AI Workbench</p>
              </div>
              <button onClick={() => setIsCandidateModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors">✕</button>
            </div>
            
            <div className="p-4 border-b border-gray-100 bg-white">
              <div className="relative">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search candidates by name, company, or designation..." 
                  value={candidateSearch}
                  onChange={e => setCandidateSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50/30">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('name')}>
                      Candidate {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('company')}>
                      Company {sortConfig?.key === 'company' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('designation')}>
                      Designation {sortConfig?.key === 'designation' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {sortedAndFilteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-gray-400">
                        <div className="text-sm">No candidates found matching "{candidateSearch}"</div>
                      </td>
                    </tr>
                  ) : (
                    sortedAndFilteredCandidates.map(c => (
                      <tr key={c.searchId} className="hover:bg-blue-50/50 transition-colors group cursor-pointer" onClick={() => {
                        setSelectedCandidateId(c.searchId);
                        setIsCandidateModalOpen(false);
                      }}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded bg-blue-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                              {c.initials || c.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">{c.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">{c.company || "-"}</td>
                        <td className="px-6 py-4 text-gray-600">{c.designation || c.role || "-"}</td>
                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                          <select
                            value={c.status || "Active"}
                            onChange={async (e) => {
                              try {
                                await updateCandidateStatusAction(c.searchId, e.target.value);
                                router.refresh();
                              } catch(err) {
                                console.error(err);
                              }
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border cursor-pointer outline-none ${
                              c.status === 'Active' || !c.status ? 'bg-green-50 text-green-700 border-green-200' : 
                              c.status === 'Passive' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              c.status === 'Not Interested' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-gray-50 text-gray-600 border-gray-200'
                            }`}
                          >
                            <option value="Active" className="bg-white text-gray-900">Active</option>
                            <option value="Passive" className="bg-white text-gray-900">Passive</option>
                            <option value="Not Interested" className="bg-white text-gray-900">Not Interested</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="px-4 py-2 bg-white border border-gray-200 text-blue-900 font-bold text-xs rounded-lg group-hover:bg-blue-900 group-hover:text-white group-hover:border-blue-900 transition-all shadow-sm">
                            Select
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
