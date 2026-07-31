"use client";

import React, { useState, useRef } from "react";
import { X, Upload, CheckCircle2, AlertCircle, ChevronRight, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { mapCandidatesAction, checkCandidateDuplicatesAction, finalizeCandidatesImportAction } from "@/actions/candidates";

export function CandidatesImportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  
  const [step, setStep] = useState<"upload" | "mapping" | "duplicates">("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [importMapping, setImportMapping] = useState<any>(null);
  const [importFileData, setImportFileData] = useState<any[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  
  // Duplicate Resolution States
  const [duplicateQueue, setDuplicateQueue] = useState<any[]>([]);
  const [currentDuplicateIndex, setCurrentDuplicateIndex] = useState(0);
  const [resolvedUpdates, setResolvedUpdates] = useState<any[]>([]);
  const [newCandidatesQueue, setNewCandidatesQueue] = useState<any[]>([]);
  const [fieldSelections, setFieldSelections] = useState<any>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setStep("upload");
    setImportMapping(null);
    setImportFileData([]);
    setFileHeaders([]);
    setDuplicateQueue([]);
    setCurrentDuplicateIndex(0);
    setResolvedUpdates([]);
    setNewCandidatesQueue([]);
    setFieldSelections({});
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const isCsv = fileExt === 'csv' || file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
      let rows: any[] = [];

      const parseAsCsv = async () => {
        const text = await file.text();
        let row: string[] = [];
        let inQuotes = false;
        let val = '';
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === '"') {
            if (inQuotes && text[i+1] === '"') {
              val += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            row.push(val);
            val = '';
          } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && text[i+1] === '\n') i++;
            row.push(val);
            if (row.some(c => c.trim() !== '')) rows.push(row);
            row = [];
            val = '';
          } else {
            val += char;
          }
        }
        if (val || row.length > 0) {
          row.push(val);
          if (row.some(c => c.trim() !== '')) rows.push(row);
        }
      };

      if (isCsv) {
        await parseAsCsv();
      } else {
        try {
          const ExcelJS = (await import('exceljs')).default;
          const workbook = new ExcelJS.Workbook();
          const arrayBuffer = await file.arrayBuffer();
          await workbook.xlsx.load(arrayBuffer);
          
          const worksheet = workbook.worksheets[0];
          if (!worksheet) throw new Error("No worksheet found");

          worksheet.eachRow((row, rowNumber) => {
            const rowData: any[] = [];
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              let val: any = cell.value;
              if (val !== null && typeof val === 'object') {
                if ('hyperlink' in val) val = val.hyperlink;
                else if ('text' in val) val = val.text;
                else if ('result' in val) val = val.result;
                else if ('richText' in val && Array.isArray(val.richText)) {
                  val = val.richText.map((rt: any) => rt.text).join('');
                }
              }
              rowData[colNumber - 1] = val?.toString() || "";
            });
            rows.push(rowData);
          });
        } catch (excelErr: any) {
          console.warn("Excel parsing failed, attempting CSV fallback:", excelErr);
          await parseAsCsv();
        }
      }

      if (rows.length < 2) {
        toast.error("File appears to be empty or missing data.");
        setIsProcessing(false);
        return;
      }

      const headers = rows[0].map((h: any) => h ? String(h).trim() : "");
      
      const sampleData = rows.slice(1, 3).map(row => {
        const obj: any = {};
        headers.forEach((h: string, i: number) => {
          if (h) obj[h] = row[i] || "";
        });
        return obj;
      });

      const allData = rows.slice(1).map(row => {
        const obj: any = {};
        headers.forEach((h: string, i: number) => {
          if (h) obj[h] = row[i] || "";
        });
        return obj;
      });
      setImportFileData(allData);

      const data: any = await mapCandidatesAction(headers.filter((h: string) => h), sampleData);
      
      if (!data || !data.mapping) {
        throw new Error("Failed to map candidates: AI returned empty response.");
      }
      
      const expectedKeys = [
        "name", "designation", "company", "phone", "email", "linkedin",
        "previousCompany", "location", "industry", "ctc", "totalExperience",
        "qualification", "yearQualified"
      ];
      
      const sanitizedMapping: any = {};
      expectedKeys.forEach(k => sanitizedMapping[k] = null);
      
      const validHeaders = headers.filter((h: string) => h);
      setFileHeaders(validHeaders);
      
      Object.keys(data.mapping || {}).forEach(key => {
        if (!expectedKeys.includes(key)) return;
        
        const aiValue = (data.mapping as any)[key];
        if (!aiValue) return;
        
        let matchedHeader = validHeaders.find((h: string) => h === aiValue);
        if (!matchedHeader) {
          matchedHeader = validHeaders.find((h: string) => h.toLowerCase() === String(aiValue).toLowerCase());
        }
        
        if (matchedHeader) {
          sanitizedMapping[key] = matchedHeader;
        }
      });
      
      setImportMapping(sanitizedMapping);
      setStep("mapping");
      
    } catch (err) {
      console.error(err);
      toast.error("Error processing file. The AI mapping service might be overloaded.");
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const confirmMapping = async () => {
    setIsProcessing(true);
    try {
      const mappedCandidates = importFileData.map(row => {
        const cand: any = { metadata: {} };
        const mappedHeaders = Object.values(importMapping);
        
        Object.keys(row).forEach(excelHeader => {
          if (mappedHeaders.includes(excelHeader)) {
             const dbKey = Object.keys(importMapping).find(k => importMapping[k] === excelHeader);
             if (dbKey) cand[dbKey] = row[excelHeader];
          } else {
             if (row[excelHeader] !== undefined && row[excelHeader] !== null && row[excelHeader] !== "") {
               cand.metadata[excelHeader] = row[excelHeader];
             }
          }
        });
        return cand;
      });

      const { duplicates, newCandidates } = await checkCandidateDuplicatesAction(mappedCandidates);

      if (duplicates && duplicates.length > 0) {
        setDuplicateQueue(duplicates);
        setNewCandidatesQueue(newCandidates || []);
        setCurrentDuplicateIndex(0);
        setResolvedUpdates([]);
        
        const initSelections: any = {};
        const first = duplicates[0].incomingCandidate;
        Object.keys(first).forEach(k => {
          if (first[k]) initSelections[k] = true;
        });
        setFieldSelections(initSelections);
        setStep("duplicates");
      } else {
        const res = await finalizeCandidatesImportAction(newCandidates || [], []);
        if (!res.success) throw new Error("Failed to process import");
        if (res.failedCount && res.failedCount > 0) {
          toast.error(`Imported with errors. Failed ${res.failedCount} rows.`);
        } else {
          toast.success("Successfully imported candidates!");
        }
        handleClose();
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error confirming mapping.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextDuplicate = async (action: 'replace' | 'keep' | 'update' | 'new') => {
    const currentDuplicate = duplicateQueue[currentDuplicateIndex];
    const updatedList = [...resolvedUpdates];
    const newCandList = [...newCandidatesQueue];

    if (action === 'replace') {
      const fullUpdate: any = {};
      Object.keys(currentDuplicate.incomingCandidate).forEach(k => fullUpdate[k] = true);
      updatedList.push({
        incomingCandidate: currentDuplicate.incomingCandidate,
        existingId: currentDuplicate.existingCandidate.id,
        fieldsToUpdate: fullUpdate
      });
    } else if (action === 'update') {
      updatedList.push({
        incomingCandidate: currentDuplicate.incomingCandidate,
        existingId: currentDuplicate.existingCandidate.id,
        fieldsToUpdate: fieldSelections
      });
    } else if (action === 'new') {
      newCandList.push(currentDuplicate.incomingCandidate);
    }

    setResolvedUpdates(updatedList);
    setNewCandidatesQueue(newCandList);

    if (currentDuplicateIndex < duplicateQueue.length - 1) {
      const nextIdx = currentDuplicateIndex + 1;
      setCurrentDuplicateIndex(nextIdx);
      const nextInc = duplicateQueue[nextIdx].incomingCandidate;
      const nextSelections: any = {};
      Object.keys(nextInc).forEach(k => {
        if (nextInc[k]) nextSelections[k] = true;
      });
      setFieldSelections(nextSelections);
    } else {
      setIsProcessing(true);
      try {
        const res = await finalizeCandidatesImportAction(newCandList, updatedList);
        if (!res.success) throw new Error("Failed to finalize import");
        if (res.failedCount && res.failedCount > 0) {
          toast.error(`Imported with errors. Failed to import ${res.failedCount} rows.`);
        } else {
          toast.success("Successfully imported candidates!");
        }
        handleClose();
        router.refresh();
      } catch (err) {
        toast.error("Error finalizing import");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0E2150]/20 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-4xl shadow-[0_20px_60px_-15px_rgba(19,50,85,0.12)] border border-white/50 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#e4e8f0]/80 flex justify-between items-center bg-white/50 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#133255]/5 to-transparent pointer-events-none" />
          <div className="relative">
            <h3 className="text-2xl font-bold text-[#133255] tracking-tight flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-[#D8B15B]" />
              Import Candidates
            </h3>
            <p className="text-[#64748b] text-sm mt-1 ml-9">
              {step === "upload" && "Upload your Excel or CSV file to begin"}
              {step === "mapping" && "Review AI-generated column mapping"}
              {step === "duplicates" && "Resolve duplicate entries found in your database"}
            </p>
          </div>
          <button 
            onClick={handleClose}
            disabled={isProcessing}
            className="w-10 h-10 rounded-full bg-white border border-[#e4e8f0] flex items-center justify-center text-[#64748b] hover:bg-[#f8fafc] hover:text-[#133255] transition-all shadow-sm z-10 disabled:opacity-50"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 relative bg-[#fafbfd]">
          {isProcessing && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-[#133255]/20 border-t-[#D8B15B] rounded-full animate-spin mb-4" />
              <p className="text-[#133255] font-semibold">Processing Data...</p>
            </div>
          )}

          {step === "upload" && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-lg border-2 border-dashed border-[#cfd6e4] bg-white rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-[#D8B15B] hover:bg-[#D8B15B]/5 transition-all group shadow-sm"
              >
                <div className="w-20 h-20 bg-[#133255]/5 text-[#133255] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#133255] group-hover:text-white transition-all duration-300">
                  <Upload size={36} strokeWidth={1.5} />
                </div>
                <h4 className="text-[19px] font-bold text-[#133255] mb-2">Click to Upload File</h4>
                <p className="text-[#64748b] text-center max-w-[280px]">
                  Support for .xlsx and .csv formats. Our AI will automatically map your columns.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          )}

          {step === "mapping" && importMapping && (
            <div className="w-full">
              <div className="bg-white rounded-2xl border border-[#e4e8f0] overflow-hidden shadow-sm">
                <div className="grid grid-cols-2 bg-[#f8fafc] border-b border-[#e4e8f0] font-bold text-[#133255] text-sm">
                  <div className="px-6 py-4 border-r border-[#e4e8f0]">System Field</div>
                  <div className="px-6 py-4">Matched Column from File</div>
                </div>
                <div className="divide-y divide-[#eef1f7]">
                  {Object.entries(importMapping).map(([sysKey, fileKey]) => (
                    <div key={sysKey} className="grid grid-cols-2 text-sm hover:bg-[#fafbfd] transition-colors">
                      <div className="px-6 py-4 font-medium text-[#475569] capitalize">
                        {sysKey.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="px-6 py-4">
                        <select
                          className="w-full h-10 px-3 bg-white border border-[#e4e8f0] rounded-lg text-sm text-[#111] focus:ring-2 focus:ring-[#133255] outline-none shadow-sm cursor-pointer hover:border-[#cfd6e4] transition-all"
                          value={(fileKey as string) || ""}
                          onChange={(e) => {
                            setImportMapping({
                              ...importMapping,
                              [sysKey]: e.target.value || null
                            });
                          }}
                        >
                          <option value="">-- Map to Additional Fields --</option>
                          {fileHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button 
                  onClick={resetState}
                  className="px-6 py-3 bg-white border border-[#e4e8f0] text-[#475569] rounded-xl font-bold hover:bg-[#f8fafc] transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmMapping}
                  className="px-6 py-3 bg-[#133255] text-white rounded-xl font-bold hover:bg-[#1a4473] transition-all flex items-center gap-2 shadow-sm"
                >
                  Confirm Mapping
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === "duplicates" && duplicateQueue.length > 0 && (
            <div className="w-full">
              <div className="bg-[#D8B15B]/10 border border-[#D8B15B]/30 text-[#133255] px-6 py-4 rounded-2xl mb-8 flex items-start gap-4">
                <AlertCircle className="text-[#D8B15B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[15px] mb-1">Duplicate Found ({currentDuplicateIndex + 1} of {duplicateQueue.length})</h4>
                  <p className="text-sm opacity-80">Reason: {duplicateQueue[currentDuplicateIndex]?.reason}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                {/* Existing */}
                <div className="bg-white rounded-2xl border border-[#e4e8f0] overflow-hidden shadow-sm">
                  <div className="bg-[#f8fafc] px-6 py-4 border-b border-[#e4e8f0]">
                    <div className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-1">Existing Candidate</div>
                    <div className="text-[#133255] font-bold">In Database</div>
                  </div>
                  <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {Object.entries(duplicateQueue[currentDuplicateIndex]?.existingCandidate || {}).map(([k, v]) => {
                      if (!v || typeof v === 'object' || ['id', 'createdAt', 'updatedAt', 'isDeleted', 'initials'].includes(k)) return null;
                      return (
                        <div key={k}>
                          <div className="text-xs text-[#64748b] capitalize mb-1">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                          <div className="font-semibold text-[#133255]">{String(v)}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Incoming */}
                <div className="bg-white rounded-2xl border border-[#D8B15B]/30 overflow-hidden shadow-sm relative">
                  <div className="absolute top-0 right-0 bottom-0 w-1 bg-[#D8B15B]" />
                  <div className="bg-[#D8B15B]/5 px-6 py-4 border-b border-[#D8B15B]/20">
                    <div className="text-xs font-bold text-[#D8B15B] uppercase tracking-wider mb-1">Incoming Candidate</div>
                    <div className="text-[#133255] font-bold">From Excel/CSV</div>
                  </div>
                  <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {Object.entries(duplicateQueue[currentDuplicateIndex]?.incomingCandidate || {}).map(([k, v]) => {
                      if (!v || typeof v === 'object') return null;
                      return (
                        <label key={k} className="flex items-start gap-3 cursor-pointer group">
                          <div className="mt-1">
                            <input 
                              type="checkbox"
                              checked={!!fieldSelections[k]}
                              onChange={(e) => setFieldSelections({...fieldSelections, [k]: e.target.checked})}
                              className="w-4 h-4 rounded text-[#D8B15B] focus:ring-[#D8B15B] border-[#cfd6e4]"
                            />
                          </div>
                          <div>
                            <div className="text-xs text-[#64748b] capitalize mb-1">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                            <div className="font-semibold text-[#133255] group-hover:text-[#D8B15B] transition-colors">{String(v)}</div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#e4e8f0] flex items-center justify-between">
                <button 
                  onClick={() => handleNextDuplicate('keep')}
                  className="px-6 py-3 bg-white border border-[#e4e8f0] text-[#64748b] rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm"
                >
                  Skip & Keep Existing
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleNextDuplicate('new')}
                    className="px-6 py-3 bg-white border border-[#e4e8f0] text-[#133255] rounded-xl font-bold hover:bg-[#f8fafc] transition-all shadow-sm"
                  >
                    Add as New
                  </button>
                  <button 
                    onClick={() => handleNextDuplicate('update')}
                    className="px-6 py-3 bg-[#D8B15B] text-[#133255] rounded-xl font-bold hover:bg-[#c49f4c] hover:shadow-md transition-all shadow-sm"
                  >
                    Update Selected Fields
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
