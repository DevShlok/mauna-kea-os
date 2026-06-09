"use client";

import { useState, useEffect, useMemo } from "react";
import CandidateReportPDF from "@/components/reports/CandidateReportPDF";

interface WorkbenchClientProps {
  initialCandidate: any;
  frameworks: any[];
  flCandidates: any[];
  mandateCandidates: any[];
  mandates: any[];
}

export default function WorkbenchClient({ initialCandidate, frameworks, flCandidates, mandateCandidates, mandates }: WorkbenchClientProps) {
  // Combine candidates for search
  const allCandidates = useMemo(() => {
    const list = [];
    for (const c of flCandidates) {
      list.push({ ...c, searchId: `fl_${c.id}`, type: "Float List" });
    }
    for (const c of mandateCandidates) {
      list.push({ ...c, searchId: `mc_${c.id}`, type: "Mandate Candidate" });
    }
    return list;
  }, [flCandidates, mandateCandidates]);

  const [selectedCandidateId, setSelectedCandidateId] = useState(initialCandidate ? `mc_${initialCandidate.id}` : "");
  const [frameworkId, setFrameworkId] = useState(frameworks[0]?.id || "");
  const [mandateId, setMandateId] = useState("");
  
  const [interviewNotes, setInterviewNotes] = useState("");
  const [superiorRef, setSuperiorRef] = useState("");
  const [peerRef, setPeerRef] = useState("");
  
  // Scoring state: { [criterionId]: number }
  const [scores, setScores] = useState<Record<number, number>>({});
  const [overallScore, setOverallScore] = useState("0.0");

  const [isGenerating, setIsGenerating] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  const selectedCandidate = allCandidates.find(c => c.searchId === selectedCandidateId);
  const selectedFramework = frameworks.find(f => f.id === frameworkId);

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
          transcript: combinedTranscript
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
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Select Candidate</label>
          <select 
            value={selectedCandidateId} 
            onChange={e => setSelectedCandidateId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
          >
            <option value="">-- Choose Candidate --</option>
            <optgroup label="Mandate Candidates">
              {allCandidates.filter(c => c.type === "Mandate Candidate").map(c => (
                <option key={c.searchId} value={c.searchId}>{c.name} ({c.company})</option>
              ))}
            </optgroup>
            <optgroup label="Float List">
              {allCandidates.filter(c => c.type === "Float List").map(c => (
                <option key={c.searchId} value={c.searchId}>{c.name} ({c.company})</option>
              ))}
            </optgroup>
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Link Mandate (Optional)</label>
          <select 
            value={mandateId} 
            onChange={e => setMandateId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
          >
            <option value="">-- None --</option>
            {mandates.map(m => (
              <option key={m.id} value={m.id}>{m.role} @ {m.company}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Assessment Framework</label>
          <select 
            value={frameworkId} 
            onChange={e => setFrameworkId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
          >
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

            <button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="w-full py-3 bg-amber-600 text-white rounded font-bold hover:bg-amber-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-colors"
            >
              {isGenerating ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : null}
              {isGenerating ? "AI is thinking..." : "Generate AI Draft"}
            </button>
          </div>

          {/* RIGHT COLUMN: Output Preview */}
          <div>
            {reportData ? (
              <CandidateReportPDF 
                candidate={selectedCandidate} 
                frameworkName={selectedFramework?.name || "Assessment"} 
                reportData={reportData}
                onReportDataChange={(newData) => setReportData(newData)}
              />
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
                <p className="text-sm text-gray-500">Click <strong>Generate AI Draft</strong> to create the assessment report.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
