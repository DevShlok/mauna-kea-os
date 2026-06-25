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
  
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);

  // Load notes from local storage on candidate change
  useEffect(() => {
    if (!selectedCandidateId) return;
    
    // Uncheck all boxes when loading a candidate
    setSelectedFileIds([]);

    setInterviewNotes("");
    setSuperiorRef("");
    setPeerRef("");
  }, [selectedCandidateId]);
  
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
  const [selectedFormat, setSelectedFormat] = useState<"format1" | "format2">("format1");

  const [candidateFilesHistory, setCandidateFilesHistory] = useState<any[]>([]);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [isUploadingLinkedin, setIsUploadingLinkedin] = useState(false);

  const fetchCandidateFiles = async (candId: string) => {
    try {
      const res = await fetch(`/api/candidate-files?candId=${candId}`);
      const data = await res.json();
      if (data.success) {
        setCandidateFilesHistory(data.files);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!selectedCandidateId) {
      setCandidateFilesHistory([]);
      return;
    }
    const candidateRef = allCandidates.find(c => c.searchId === selectedCandidateId);
    if (candidateRef) {
      const candId = candidateRef.externalId || candidateRef.id;
      fetchCandidateFiles(candId);
    }
  }, [selectedCandidateId, allCandidates]);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cv' | 'linkedin') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const candidateRef = allCandidates.find(c => c.searchId === selectedCandidateId);
    if (!candidateRef) return;
    const candId = candidateRef.externalId || candidateRef.id;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("candId", candId);

    if (type === 'cv') setIsUploadingCv(true);
    else setIsUploadingLinkedin(true);

    try {
      const endpoint = type === 'cv' ? "/api/upload-cv" : "/api/upload-linkedin-pdf";
      const res = await fetch(endpoint, { method: "POST", body: fd });
      if (res.ok) {
        await fetchCandidateFiles(candId);
        // We could also refresh the router to get the updated candidate master record
        router.refresh();
      } else {
        alert(`Failed to upload ${type.toUpperCase()}`);
      }
    } catch (err) {
      console.error(err);
      alert(`Error uploading ${type.toUpperCase()}`);
    } finally {
      if (type === 'cv') setIsUploadingCv(false);
      else setIsUploadingLinkedin(false);
    }
    
    // Clear input
    e.target.value = '';
  };

  const [isUploadingNotes, setIsUploadingNotes] = useState(false);
  const [isUploadingSupRef, setIsUploadingSupRef] = useState(false);
  const [isUploadingPeerRef, setIsUploadingPeerRef] = useState(false);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{fileId: number, fileName: string} | null>(null);

  const handleDeleteFile = async (fileId: number, fileName: string) => {
    setDeleteConfirmation({ fileId, fileName });
  };

  const confirmDeleteFile = async () => {
    if (!deleteConfirmation) return;
    const { fileId } = deleteConfirmation;
    try {
      const res = await fetch(`/api/candidate-files?id=${fileId}`, { method: 'DELETE' });
      if (res.ok) {
        setCandidateFilesHistory(prev => prev.filter(f => f.id !== fileId));
        setSelectedFileIds(prev => prev.filter(id => id !== fileId));
      } else {
        alert("Failed to delete file");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting file");
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const handleUploadReference = async (e: React.ChangeEvent<HTMLInputElement>, type: 'Interview Notes' | 'Superior Reference' | 'Peer Reference') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const candidateRef = allCandidates.find(c => c.searchId === selectedCandidateId);
    if (!candidateRef) return;
    const candId = candidateRef.externalId || candidateRef.id;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("candId", candId);
    fd.append("type", type);

    if (type === 'Interview Notes') setIsUploadingNotes(true);
    else if (type === 'Superior Reference') setIsUploadingSupRef(true);
    else if (type === 'Peer Reference') setIsUploadingPeerRef(true);

    try {
      const res = await fetch("/api/upload-reference", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          if (type === 'Interview Notes') setInterviewNotes(prev => prev ? prev + "\n\n" + data.text : data.text);
          else if (type === 'Superior Reference') setSuperiorRef(prev => prev ? prev + "\n\n" + data.text : data.text);
          else if (type === 'Peer Reference') setPeerRef(prev => prev ? prev + "\n\n" + data.text : data.text);
        }
        await fetchCandidateFiles(candId);
      } else {
        alert(`Failed to upload ${type}`);
      }
    } catch (err) {
      console.error(err);
      alert(`Error uploading ${type}`);
    } finally {
      if (type === 'Interview Notes') setIsUploadingNotes(false);
      else if (type === 'Superior Reference') setIsUploadingSupRef(false);
      else if (type === 'Peer Reference') setIsUploadingPeerRef(false);
    }
    
    e.target.value = '';
  };

  const handleGenerateFormat = async (format: "format1" | "format2", type: 'pdf' | 'pptx') => {
    if (reportData) {
      const emptyFields = [];
      
      // Check top-level generated fields
      const hiddenFields = ["Former Company", "Pedigree", "CTC", "Expected CTC", "Revenue Ownership", "Team Size Led", "Career Aspiration"];
      for (const [key, value] of Object.entries(reportData)) {
        if (key === '_rawInputs' || key === 'error' || key === 'scores' || key.startsWith('_format') || hiddenFields.includes(key)) continue;
        if (!value || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0)) {
          emptyFields.push(key);
        }
      }
      
      // Check scores
      if (reportData.scores) {
        for (const [category, criteria] of Object.entries(reportData.scores as Record<string, any>)) {
          for (const [criterion, score] of Object.entries(criteria)) {
             if (score === undefined || score === null) {
               emptyFields.push(`${criterion} (Score)`);
             }
          }
        }
      }

      if (emptyFields.length > 0) {
        alert(`Please fill in all empty fields in the drafted assessment before generating the final report:\n\n- ${emptyFields.join('\n- ')}`);
        return;
      }
    }

    setIsGeneratingFormat(true);
    try {
      const candId = selectedCandidate?.externalId || selectedCandidate?.id;
      
      // We will ALWAYS regenerate the format to pick up any recent manual edits
      const res = await fetch("/api/generate-format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candId,
          format: format,
          reportData: reportData
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          // Update the local state with the newly generated format data
          setReportData((prev: any) => ({
            ...prev,
            [`_${format}`]: data.data
          }));
        }
      } else {
        alert("Failed to synthesize the final report format using AI.");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating final report format.");
    } finally {
      setIsGeneratingFormat(false);
      setActiveView(format);
      if (type === 'pptx') {
         alert("PPTX downloaded!");
      }
    }
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

  // Scores default to 7 in the UI if undefined.

  // Recalculate Overall Score
  useEffect(() => {
    if (!selectedFramework) return;
    let totalCatScores = 0;
    let numCats = 0;
    let actualWeightSum = 0;

    selectedFramework.categories.forEach((cat: any) => {
      let catWeightedScore = 0;
      let catWeight = 0;
      
      cat.criteria.forEach((cr: any) => {
        // Default to 5 since scale is now 0-10
        const val = scores[cr.id] !== undefined ? scores[cr.id] : 5;
        const w = Number(cr.weight) || 1; // fallback to 1 if weight is 0 or missing
        catWeightedScore += (val * w);
        catWeight += w;
      });
      
      if (catWeight > 0) {
        const categoryScore = (catWeightedScore / catWeight);
        const cw = Number(cat.weight) || (100 / selectedFramework.categories.length);
        totalCatScores += (categoryScore * cw);
        actualWeightSum += cw;
        numCats++;
      }
    });
    
    if (actualWeightSum > 0) {
      // Calculate final overall score using actual weight sum
      setOverallScore((totalCatScores / actualWeightSum).toFixed(1));
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
          // We deliberately do not restore interviewNotes to keep it clean on reload, 
          // but we DO restore Superior and Peer references!
          setSuperiorRef(data.report.reportData._rawInputs?.superiorRef || data.report.reportData["Superior Reference"] || "");
          setPeerRef(data.report.reportData._rawInputs?.peerRef || data.report.reportData["Peer Reference"] || "");
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
    if (!frameworkId) return alert("Please select a Competency Framework or Mandate first.");
    setIsGenerating(true);
    setReportData(null);

    let manualScoresText = "MANUAL SCORES ASSIGNED:\\n";
    if (selectedFramework) {
      selectedFramework.categories.forEach((cat: any) => {
        cat.criteria.forEach((cr: any) => {
          manualScoresText += `- ${cr.name}: ${scores[cr.id] !== undefined ? scores[cr.id] : 7}/10\n`;
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
          interviewNotes,
          selectedFileIds,
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
    <div className="max-w-screen-xl mx-auto pb-10 print:pb-0">
      <div className="print:hidden">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="text-[12px] text-gray-500 mb-1">Home / AI Workbench</div>
            <h1 className="text-3xl font-serif font-bold text-[#133255] tracking-tight">AI Workbench</h1>
            {selectedFramework && <div className="text-[13px] text-gray-500 mt-2">{selectedFramework.name} — {mandates.find(m => m.id.toString() === mandateId)?.company || "General Assessment"}</div>}
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
        <div className="flex flex-col max-w-4xl mx-auto gap-8 items-stretch">
          {/* Single Column Flow */}
          <div className="flex flex-col gap-6 w-full">
            
            {/* Candidate Files */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Candidate Files</h3>
              
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 rounded-md text-[13px] font-bold border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer">
                  {isUploadingCv ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Uploading...
                    </span>
                  ) : "➕ Add CV / Resume"}
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => handleUploadFile(e, 'cv')} disabled={isUploadingCv} />
                </label>

                <label className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 rounded-md text-[13px] font-bold border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer">
                  {isUploadingLinkedin ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Uploading...
                    </span>
                  ) : "➕ Add LinkedIn Profile"}
                  <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleUploadFile(e, 'linkedin')} disabled={isUploadingLinkedin} />
                </label>
              </div>

              {candidateFilesHistory.filter(f => f.fileType !== 'Superior Reference' && f.fileType !== 'Peer Reference' && f.fileType !== 'Team/Subordinate Reference').length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold">
                      <tr>
                        <th className="px-4 py-2 border-r border-gray-200 w-10 text-center">Select</th>
                        <th className="px-4 py-2 border-r border-gray-200">Document</th>
                        <th className="px-4 py-2 border-r border-gray-200">Last updated on</th>
                        <th className="px-4 py-2 border-r border-gray-200">File</th>
                        <th className="px-4 py-2 w-16 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {candidateFilesHistory.filter(f => f.fileType !== 'Superior Reference' && f.fileType !== 'Peer Reference' && f.fileType !== 'Team/Subordinate Reference').map((file) => {
                        const dateStr = new Date(file.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-');
                        return (
                          <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2 border-r border-gray-200 text-center">
                              <input 
                                type="checkbox" 
                                className="cursor-pointer"
                                checked={selectedFileIds.includes(file.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedFileIds(prev => [...prev, file.id]);
                                    if (file.fileType === 'Interview Notes') {
                                      if (file.extractedText) {
                                        setInterviewNotes(prev => prev ? prev + "\n\n" + file.extractedText : file.extractedText);
                                      } else {
                                        alert("No text could be found for this document. If this is an older file, please delete it and re-upload it so the system can extract its text.");
                                      }
                                    }
                                  } else {
                                    setSelectedFileIds(prev => prev.filter(id => id !== file.id));
                                    if (file.fileType === 'Interview Notes' && file.extractedText) {
                                      setInterviewNotes(prev => prev.replace("\n\n" + file.extractedText, "").replace(file.extractedText + "\n\n", "").replace(file.extractedText, "").trim());
                                    }
                                  }
                                }}
                              />
                            </td>
                            <td className="px-4 py-2 border-r border-gray-200 font-medium text-gray-900">{file.fileType}</td>
                            <td className="px-4 py-2 border-r border-gray-200 text-gray-600">
                              {dateStr}
                            </td>
                            <td className="px-4 py-2 border-r border-gray-200">
                              <a href={file.fileUrl} target="_blank" rel="noreferrer" className="text-[#133255] hover:underline hover:text-[#133255] break-all">
                                {file.fileName}
                              </a>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button 
                                onClick={() => handleDeleteFile(file.id, file.fileName)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
                                title="Delete File"
                              >
                                ❌
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
{/* Notes & Feedback */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex-1">
              <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                <h3 className="font-bold text-gray-900">Interview Notes</h3>
                <label className="cursor-pointer text-xs font-bold text-[#133255] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors flex items-center gap-1">
                  {isUploadingNotes ? "Uploading..." : "📎 Upload File"}
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => handleUploadReference(e, 'Interview Notes')} disabled={isUploadingNotes} />
                </label>
              </div>
              <textarea 
                rows={12} 
                value={interviewNotes}
                onChange={e => setInterviewNotes(e.target.value)}
                placeholder="Paste interview notes here..."
                className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] outline-none focus:border-[#133255] resize-y"
              ></textarea>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex-1">
              <h3 className="font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Reference Feedback</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-xs font-bold text-gray-500">Superior Reference</div>
                    <label className="cursor-pointer text-xs font-bold text-[#133255] hover:underline flex items-center gap-1">
                      {isUploadingSupRef ? "Uploading..." : "📎 Upload File"}
                      <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => handleUploadReference(e, 'Superior Reference')} disabled={isUploadingSupRef} />
                    </label>
                  </div>
                  <textarea rows={5} value={superiorRef} onChange={e => setSuperiorRef(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] outline-none focus:border-[#133255] resize-y" placeholder="Enter superior reference..."></textarea>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-xs font-bold text-gray-500">Peer Reference</div>
                    <label className="cursor-pointer text-xs font-bold text-[#133255] hover:underline flex items-center gap-1">
                      {isUploadingPeerRef ? "Uploading..." : "📎 Upload File"}
                      <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => handleUploadReference(e, 'Peer Reference')} disabled={isUploadingPeerRef} />
                    </label>
                  </div>
                  <textarea rows={5} value={peerRef} onChange={e => setPeerRef(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] outline-none focus:border-[#133255] resize-y" placeholder="Enter peer reference..."></textarea>
                </div>
              </div>
            </div>

            
</div>

            {/* Criteria & Manual Scores */}
            {selectedFramework && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
                <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Assessment Criteria & Scores</h3>
                
                <div className="space-y-6">
                  {selectedFramework.categories.map((cat: any) => (
                    <div key={cat.id}>
                      <div className="text-xs font-bold text-[#133255] uppercase tracking-wide border-b-2 border-blue-100 pb-2 mb-3">
                        {cat.name}
                      </div>
                      <div className="space-y-3">
                        {cat.criteria.map((cr: any) => {
                          const val = scores[cr.id] !== undefined ? scores[cr.id] : 5;
                          return (
                            <div key={cr.id} className="flex items-center gap-4 group">
                              <div className="w-[180px]">
                                <div className="text-[13px] font-bold text-gray-800">{cr.name}</div>
                                <div className="text-[10px] text-gray-500 uppercase">{cr.weight}% Weight</div>
                              </div>
                              
                              <div className="flex-1 flex items-center gap-3">
                                <input 
                                  type="range" 
                                  min="0" max="10" 
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
                  <span className="font-bold text-[#133255]">Overall Score</span>
                  <span className={`text-xl font-bold px-3 py-1 rounded ${Number(overallScore) >= 8 ? 'bg-green-100 text-green-700' : Number(overallScore) >= 6.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {overallScore} / 10
                  </span>
                </div>
              </div>
            )}

<div className="flex flex-col gap-2">
              {reportExistsInDb && !isGenerating && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded text-[12px] text-green-700 font-semibold">
                  ✅ Assessment draft loaded from database
                </div>
              )}
              {isLoadingReport && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded text-[12px] text-[#133255]">
                  <span className="w-3 h-3 border-2 border-[#133255] border-t-transparent rounded-full animate-spin"></span>
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

          {/* Output Preview */}
          <div className="w-full">
            {isGeneratingFormat ? (
              <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm flex flex-col items-center justify-center text-center h-[600px] sticky top-6">
                <div className="w-12 h-12 border-4 border-[#133255] border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="text-lg font-bold text-[#133255] mb-2">AI is Generating Report</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Formatting the assessment into the selected layout...
                </p>
              </div>
            ) : reportData ? (
              <div className="flex flex-col gap-4">
                {activeView === "draft" && (
                  <>


                    <CandidateReportPDF 
                      candidate={selectedCandidate} 
                      frameworkName={selectedFramework?.name || "Assessment"} 
                      reportData={reportData}
                      onReportDataChange={(newData) => setReportData(newData)}
                      onGeneratePdf={(format) => handleGenerateFormat(format, 'pdf')}
                      onGeneratePptx={(format) => handleGenerateFormat(format, 'pptx')}
                    />
                  </>
                )}

                    {/* Format Selection Dropdown */}
                    <div className="flex flex-col items-center justify-center gap-3 mt-8 pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full shadow-sm border border-gray-200">
                        <span className="font-bold text-gray-700 text-sm">Select final format:</span>
                        <select 
                          value={selectedFormat}
                          onChange={e => setSelectedFormat(e.target.value as "format1" | "format2")}
                          className="bg-transparent text-[#133255] font-bold outline-none cursor-pointer"
                        >
                          <option value="format1">Format 1</option>
                          <option value="format2">Format 2</option>
                        </select>
                      </div>
                    </div>

                    {/* Generate Buttons */}
                    <div className="flex justify-center gap-4 mt-6">
                      <button onClick={() => handleGenerateFormat(selectedFormat, 'pdf')} className="px-6 py-3 bg-[#133255] text-white font-bold rounded shadow hover:bg-[#133255] transition-colors">
                        Generate PDF
                      </button>
                      <button onClick={() => handleGenerateFormat(selectedFormat, 'pptx')} className="px-6 py-3 bg-[#133255] text-white font-bold rounded shadow hover:bg-[#133255] transition-colors">
                        Generate PPTX
                      </button>
                    </div>

              </div>
            ) : isGenerating ? (
              <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm flex flex-col items-center justify-center text-center h-[600px] sticky top-6">
                <div className="w-12 h-12 border-4 border-[#133255] border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="text-lg font-bold text-[#133255] mb-2">Analyzing Candidate</h3>
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
      </div>

      {/* Full Screen Report Preview Modal */}
      {(activeView === "format1" || activeView === "format2") && reportData && selectedMandate && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex flex-col items-center overflow-y-auto print:static print:bg-white print:overflow-visible print:block">
          
          {/* Modal Header */}
          <div className="w-[794px] flex justify-between items-center bg-white mt-10 mb-6 p-4 rounded-xl shadow-xl border border-gray-200 print:hidden shrink-0 animate-in slide-in-from-top-4 duration-300">
            <span className="text-sm font-bold text-[#133255] uppercase ml-2">Final Report Preview</span>
            <div className="flex gap-4 items-center">
              <button onClick={() => window.print()} className="px-5 py-2 bg-yellow-500 text-[#133255] rounded-lg text-sm font-bold hover:bg-yellow-400 shadow-sm transition-colors">
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
          <div className="print:absolute print:left-0 print:top-0 print:w-full print:bg-white print:z-[9999] print:overflow-visible print:block pb-20 print:pb-0 animate-in fade-in zoom-in-95 duration-300 shrink-0">
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
                <h2 className="text-xl font-bold text-gray-900">Candidate Database</h2>
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#133255] focus:ring-1 focus:ring-[#133255] transition-all"
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
                            <div className="w-9 h-9 rounded bg-[#133255] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                              {c.initials || c.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="font-semibold text-gray-900 group-hover:text-[#133255] transition-colors">{c.name}</div>
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
                          <button className="px-4 py-2 bg-white border border-gray-200 text-[#133255] font-bold text-xs rounded-lg group-hover:bg-[#133255] group-hover:text-white group-hover:border-[#133255] transition-all shadow-sm">
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
    {deleteConfirmation && (
      <div className="fixed inset-0 bg-[#111]/50 flex items-center justify-center z-[100] backdrop-blur-sm">
        <div className="bg-white rounded-[10px] shadow-lg w-[400px] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#D4E0F0] font-serif text-[18px] font-bold text-[#111] flex justify-between items-center">
            Delete File
            <button onClick={() => setDeleteConfirmation(null)} className="text-[#6b7a99] hover:text-[#111]">✕</button>
          </div>
          <div className="p-5">
            <p className="text-[14px] text-[#4a5568] mb-6">
              Are you sure you want to permanently delete <strong>{deleteConfirmation.fileName}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 border border-[#D4E0F0] rounded-[6px] text-[#4a5568] text-[13px] font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteFile}
                className="px-4 py-2 bg-red-600 text-white rounded-[6px] text-[13px] font-bold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    </div>
  );
}
