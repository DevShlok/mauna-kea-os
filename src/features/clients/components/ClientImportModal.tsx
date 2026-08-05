"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { X, Upload, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { mapClientsAction, checkClientDuplicatesAction, finalizeClientsImportAction } from "@/actions/imports";
import { useRouter } from "next/navigation";
import { parseFileToRows } from "@/lib/parseFile";

type Step = "upload" | "mapping" | "duplicates";

function StepIndicator({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "upload", label: "Upload" },
    { id: "mapping", label: "AI Mapping" },
    { id: "duplicates", label: "Duplicates" },
  ];
  const stepOrder = { upload: 0, mapping: 1, duplicates: 2 };
  const currentIdx = stepOrder[step];

  return (
    <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50/60">
      {steps.map((s, i) => {
        const isActive = s.id === step;
        const isPast = stepOrder[s.id] < currentIdx;
        return (
          <div key={s.id} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className={`flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${isActive ? "text-[#133255]" : isPast ? "text-[#D8B15B]" : "text-gray-400"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? "bg-[#133255] text-white" : isPast ? "bg-[#D8B15B] text-[#133255]" : "bg-gray-200 text-gray-500"}`}>
                {isPast ? "✓" : i + 1}
              </div>
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px min-w-[16px] ${isPast ? "bg-[#D8B15B]" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ClientImportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [isImporting, setIsImporting] = useState(false);
  const [importMapping, setImportMapping] = useState<any>(null);
  const [importFileData, setImportFileData] = useState<any[]>([]);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);

  const importLockRef = useRef(false);
  const [duplicateQueue, setDuplicateQueue] = useState<any[]>([]);
  const [newClientsQueue, setNewClientsQueue] = useState<any[]>([]);
  const [resolvedUpdates, setResolvedUpdates] = useState<any[]>([]);
  const [currentDuplicateIndex, setCurrentDuplicateIndex] = useState(0);
  const [fieldSelections, setFieldSelections] = useState<Record<string, boolean>>({});

  const isResolvingDuplicates = step === "duplicates";

  const handleClose = () => {
    setStep("upload");
    setImportMapping(null);
    setImportFileData([]);
    setImportHeaders([]);
    setDuplicateQueue([]);
    setNewClientsQueue([]);
    setResolvedUpdates([]);
    setCurrentDuplicateIndex(0);
    onClose();
  };

  if (!isOpen && step === "upload") return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMapping(null);
    setImportFileData([]);

    try {
      const rawRows = await parseFileToRows(file);
      const headers = rawRows[0].map((h) => h ? String(h).trim() : "");
      const validHeaders = headers.filter((h) => h);

      const sampleData = rawRows.slice(1, 3).map((row) => {
        const obj: any = {};
        headers.forEach((h, i) => { if (h) obj[h] = row[i] || ""; });
        return obj;
      });

      const allData = rawRows.slice(1).map((row) => {
        const obj: any = {};
        headers.forEach((h, i) => { if (h) obj[h] = row[i] || ""; });
        return obj;
      });

      setImportFileData(allData);
      setImportHeaders(validHeaders);

      const data: any = await mapClientsAction(validHeaders, sampleData);
      if (!data || !data.mapping) throw new Error("AI returned empty mapping response.");

      const sanitizedMapping: any = {};
      Object.keys(data.mapping).forEach((key) => {
        const aiValue = (data.mapping as any)[key];
        if (!aiValue) { sanitizedMapping[key] = null; return; }
        let matched = validHeaders.find((h) => h === aiValue);
        if (!matched) matched = validHeaders.find((h) => h.toLowerCase() === String(aiValue).toLowerCase());
        sanitizedMapping[key] = matched || null;
      });

      setImportMapping(sanitizedMapping);
      setStep("mapping");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error processing file. Check format and try again.");
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };

  const confirmImport = async () => {
    if (importLockRef.current) return;
    if (!importMapping || importFileData.length === 0) return;
    importLockRef.current = true;
    setIsImporting(true);
    try {
      const mappedClients = importFileData.map((row) => {
        const cl: any = { metadata: {} };
        const mappedExcelHeaders = Object.values(importMapping);
        Object.keys(importMapping).forEach((dbKey) => {
          const excelHeader = importMapping[dbKey];
          if (excelHeader && row[excelHeader] !== undefined) cl[dbKey] = row[excelHeader];
        });
        Object.keys(row).forEach((header) => {
          if (!mappedExcelHeaders.includes(header) && row[header] !== undefined && row[header] !== "") {
            cl.metadata[header] = row[header];
          }
        });
        return cl;
      });

      const { duplicates, newClients } = await checkClientDuplicatesAction(mappedClients);

      if (duplicates && duplicates.length > 0) {
        setDuplicateQueue(duplicates);
        setNewClientsQueue(newClients || []);
        setCurrentDuplicateIndex(0);
        setResolvedUpdates([]);
        const initSelections: any = {};
        const first = duplicates[0].incomingRecord;
        Object.keys(first).forEach((k) => { if (first[k]) initSelections[k] = true; });
        setFieldSelections(initSelections);
        setStep("duplicates");
      } else {
        const res = await finalizeClientsImportAction(newClients || [], []);
        if (!res.success) throw new Error("Failed to process import");
        res.failedCount && res.failedCount > 0
          ? toast.error(`Imported with errors. ${res.failedCount} rows failed: ${res.failedRows?.join(", ")}`)
          : toast.success("Successfully imported clients!");
        handleClose();
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error importing clients.");
    } finally {
      setIsImporting(false);
      importLockRef.current = false;
    }
  };

  const handleNextDuplicate = async (action: "replace" | "keep" | "update" | "new") => {
    const currentDuplicate = duplicateQueue[currentDuplicateIndex];
    const updatedList = [...resolvedUpdates];
    const newList = [...newClientsQueue];

    if (action === "replace") {
      updatedList.push({ action: "replace", id: currentDuplicate.existingRecord.id, existing: currentDuplicate.existingRecord, data: currentDuplicate.incomingRecord });
    } else if (action === "update") {
      const partialUpdate: any = {};
      Object.keys(fieldSelections).forEach((k) => { if (fieldSelections[k]) partialUpdate[k] = currentDuplicate.incomingRecord[k]; });
      updatedList.push({ action: "update", id: currentDuplicate.existingRecord.id, existing: currentDuplicate.existingRecord, data: partialUpdate });
    } else if (action === "new") {
      newList.push(currentDuplicate.incomingRecord);
    }

    setResolvedUpdates(updatedList);
    setNewClientsQueue(newList);

    if (currentDuplicateIndex < duplicateQueue.length - 1) {
      const nextIdx = currentDuplicateIndex + 1;
      setCurrentDuplicateIndex(nextIdx);
      const nextInc = duplicateQueue[nextIdx].incomingRecord;
      const nextSelections: any = {};
      Object.keys(nextInc).forEach((k) => { if (nextInc[k]) nextSelections[k] = true; });
      setFieldSelections(nextSelections);
    } else {
      setIsImporting(true);
      try {
        const res = await finalizeClientsImportAction(newList, updatedList);
        if (!res.success) throw new Error("Failed to finalize import");
        res.failedCount && res.failedCount > 0
          ? toast.error(`Imported with errors. ${res.failedCount} rows failed: ${res.failedRows?.join(", ")}`)
          : toast.success("Successfully imported clients!");
        handleClose();
        router.refresh();
      } catch (err) {
        toast.error("Error finalizing import");
      } finally {
        setIsImporting(false);
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-xl font-bold text-[#133255]">Import Clients</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {step === "upload" && "Upload your Excel or CSV file to begin"}
                {step === "mapping" && "Review AI-generated column mapping"}
                {step === "duplicates" && `Resolve duplicates — ${currentDuplicateIndex + 1} of ${duplicateQueue.length}`}
              </p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <StepIndicator step={step} />

          <div className="p-6 overflow-y-auto flex-1">
            {/* Step 1: Upload */}
            {step === "upload" && (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center bg-gray-50/50">
                {isImporting ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#D8B15B] animate-spin" />
                    <p className="text-sm font-medium text-gray-600">AI is mapping your columns...</p>
                    <p className="text-xs text-gray-400">This may take a few seconds</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-400 mb-4" />
                    <p className="text-sm font-semibold text-gray-700 mb-1">Upload Excel or CSV file</p>
                    <p className="text-xs text-gray-500 mb-6 text-center max-w-sm">
                      Our AI will automatically map your columns to the required fields. Supports .csv, .xlsx, .xls
                    </p>
                    <label className="cursor-pointer bg-[#133255] hover:bg-[#1b4370] text-white px-5 py-2.5 rounded-md text-sm font-medium transition-colors">
                      Select File
                      <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                    </label>
                  </>
                )}
              </div>
            )}

            {/* Step 2: AI Mapping */}
            {step === "mapping" && importMapping && (
              <div className="space-y-6">
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm flex gap-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                  <div>
                    <p className="font-semibold mb-1">AI Mapping Complete — {importFileData.length} rows detected</p>
                    <p>Review how your columns map to system fields. Use the dropdowns to correct any mismatches. Fields set to "Ignored" will not be imported.</p>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium text-gray-500 w-1/3">System Field</th>
                        <th className="px-4 py-3 font-medium text-gray-500 w-12 text-center"></th>
                        <th className="px-4 py-3 font-medium text-gray-500">Your Column</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {Object.keys(importMapping).map((dbKey) => (
                        <tr key={dbKey} className={importMapping[dbKey] ? "" : "bg-orange-50/40"}>
                          <td className="px-4 py-3 font-medium text-gray-700 capitalize">{dbKey.replace(/([A-Z])/g, " $1").trim()}</td>
                          <td className="px-4 py-3 text-center">
                            <ArrowRight className={`w-4 h-4 inline-block ${importMapping[dbKey] ? "text-[#D8B15B]" : "text-gray-200"}`} />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={importMapping[dbKey] || ""}
                              onChange={(e) => setImportMapping({ ...importMapping, [dbKey]: e.target.value || null })}
                              className="w-full h-9 px-3 border rounded-md bg-white text-sm focus:border-[#133255] outline-none"
                            >
                              <option value="">-- Ignored (Leave blank) --</option>
                              {importHeaders.map((h) => (<option key={h} value={h}>{h}</option>))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between gap-3 pt-4 border-t">
                  <button onClick={() => { setImportMapping(null); setStep("upload"); }} className="px-5 py-2.5 rounded-md border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors text-sm" disabled={isImporting}>
                    ← Back
                  </button>
                  <button onClick={confirmImport} disabled={isImporting} className="px-5 py-2.5 rounded-md bg-[#D8B15B] text-[#133255] font-bold hover:bg-[#e8c97a] transition-colors text-sm flex items-center gap-2">
                    {isImporting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Check Duplicates & Import {importFileData.length} Clients
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 3: Duplicate Resolution (separate overlay) */}
      {isResolvingDuplicates && duplicateQueue.length > 0 && (
        <div className="fixed inset-0 bg-[#0d162e]/50 backdrop-blur-sm z-50 flex items-center justify-center p-5">
          <div className="bg-white rounded-[20px] shadow-[0_30px_80px_rgba(0,0,0,0.3)] w-full max-w-[800px] flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-[#e4e8f0] flex justify-between items-center bg-[#f8fafc] rounded-t-[20px]">
              <div>
                <h3 className="font-serif text-[21px] font-bold text-gray-900">Resolve Duplicates</h3>
                <p className="text-sm text-[#5a6679] mt-1">Client {currentDuplicateIndex + 1} of {duplicateQueue.length}</p>
              </div>
              <button onClick={handleClose} className="text-[#8a93a3] text-xl hover:text-gray-900">✕</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-[#fff9e6] border border-[#fdebb4] text-[#b7791f] px-4 py-3 rounded-[10px] mb-6 text-[14px]">
                <b>Duplicate Match:</b> {duplicateQueue[currentDuplicateIndex]?.reason}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="border border-[#e4e8f0] rounded-[12px] p-5">
                  <div className="text-[12px] font-bold text-[#8a93a3] uppercase tracking-wider mb-4 border-b border-[#e4e8f0] pb-2">Existing Client (Database)</div>
                  <div className="space-y-4">
                    {Object.entries(duplicateQueue[currentDuplicateIndex]?.existingRecord || {}).map(([k, v]) => {
                      if (!v || typeof v === "object" || k === "id" || k === "createdAt" || k === "updatedAt") return null;
                      return (
                        <div key={k}>
                          <div className="text-[12px] text-[#8a93a3] capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</div>
                          <div className="font-semibold text-gray-900 text-[14px]">{String(v)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border border-[#1d4ed8] rounded-[12px] p-5 bg-[#f8faff]">
                  <div className="text-[12px] font-bold text-[#1d4ed8] uppercase tracking-wider mb-4 border-b border-[#cfd6e4] pb-2 flex justify-between">
                    <span>Incoming Client (File)</span>
                    <span>Select to merge</span>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(duplicateQueue[currentDuplicateIndex]?.incomingRecord || {}).map(([k, v]) => {
                      if (!v || typeof v === "object") return null;
                      return (
                        <label key={k} className="flex items-start justify-between cursor-pointer group">
                          <div>
                            <div className="text-[12px] text-[#5a6679] capitalize group-hover:text-[#1d4ed8] transition-colors">{k.replace(/([A-Z])/g, " $1").trim()}</div>
                            <div className="font-semibold text-[#133255] text-[14px]">{String(v)}</div>
                          </div>
                          <input type="checkbox" checked={fieldSelections[k] || false} onChange={(e) => setFieldSelections({ ...fieldSelections, [k]: e.target.checked })} className="w-4 h-4 mt-1 accent-[#1d4ed8]" />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#e4e8f0] bg-gray-50 flex flex-wrap gap-3 justify-end rounded-b-[20px]">
              <button onClick={() => handleNextDuplicate("keep")} className="px-4 py-2 neo-btn text-gray-900 text-[14px] font-bold">Skip (Keep Existing)</button>
              <button onClick={() => handleNextDuplicate("new")} className="px-4 py-2 neo-btn text-gray-900 text-[14px] font-bold">Import as New</button>
              <button onClick={() => handleNextDuplicate("replace")} className="px-4 py-2 bg-[#fdf2d6] text-[#b7791f] border border-[#f0dcae] rounded-[9px] text-[14px] font-bold hover:bg-[#faeac1]">Overwrite Existing</button>
              <button onClick={() => handleNextDuplicate("update")} className="px-4 py-2 bg-[#133255] text-white rounded-[9px] text-[14px] font-bold hover:bg-[#1a4473]">Merge Selected Fields</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
