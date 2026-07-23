"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { X, Upload, Loader2, ArrowRight } from "lucide-react";
import { mapFloatsAction, checkFloatDuplicatesAction, finalizeFloatImportAction } from "@/actions/imports";
import { useRouter } from "next/navigation";

export default function FloatImportModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);
  const [importMapping, setImportMapping] = useState<any>(null);
  const [importFileData, setImportFileData] = useState<any[]>([]);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const importLockRef = useRef(false);

  // Duplicate Resolution State
  const [isResolvingDuplicates, setIsResolvingDuplicates] = useState(false);
  const [duplicateQueue, setDuplicateQueue] = useState<any[]>([]);
  const [newFloatsQueue, setNewFloatsQueue] = useState<any[]>([]);
  const [currentDuplicateIndex, setCurrentDuplicateIndex] = useState(0);
  const [resolvedUpdates, setResolvedUpdates] = useState<any[]>([]);
  const [fieldSelections, setFieldSelections] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMapping(null);
    setImportFileData([]);
    
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      
      const isCsv = file.name.toLowerCase().endsWith('.csv');
      
      if (isCsv) {
        // Fallback for CSV if needed, but exceljs can also read CSV, however for simplicity we just load it via text here.
        // Actually exceljs workbook.csv.load works well too.
        await workbook.csv.read(new (window as any).ReadableStream({
            start(controller: any) {
                controller.enqueue(new Uint8Array(arrayBuffer));
                controller.close();
            }
        }));
      } else {
        await workbook.xlsx.load(arrayBuffer);
      }
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error("No worksheet found");

      const rows: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        const rowData: any[] = [];
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          let val: any = cell.value;
          if (val !== null && typeof val === 'object') {
            if ('hyperlink' in val) val = val.hyperlink;
            else if ('text' in val) val = val.text;
            else if ('result' in val) val = val.result;
            else if ('richText' in val && Array.isArray(val.richText)) val = val.richText.map((rt: any) => rt.text).join('');
          }
          rowData[colNumber - 1] = val?.toString() || "";
        });
        rows.push(rowData);
      });

      if (rows.length < 2) {
        toast.error("File appears to be empty or missing data.");
        setIsImporting(false);
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
      setImportHeaders(headers.filter((h: string) => h));

      const data: any = await mapFloatsAction(headers.filter((h: string) => h), sampleData);
      
      if (!data || !data.mapping) {
        throw new Error("Failed to map floats: AI returned empty response.");
      }
      
      const sanitizedMapping: any = {};
      const validHeaders = headers.filter((h: string) => h);
      
      Object.keys(data.mapping).forEach(key => {
        const aiValue = (data.mapping as any)[key];
        if (!aiValue) {
          sanitizedMapping[key] = null;
          return;
        }
        
        let matchedHeader = validHeaders.find((h: string) => h === aiValue);
        if (!matchedHeader) {
          matchedHeader = validHeaders.find((h: string) => h.toLowerCase() === String(aiValue).toLowerCase());
        }
        sanitizedMapping[key] = matchedHeader || null;
      });
      
      setImportMapping(sanitizedMapping);
      
    } catch (err) {
      console.error(err);
      toast.error("Error processing file. Check file format or try again.");
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const confirmImport = async () => {
    if (!importMapping || importFileData.length === 0) return;
    setIsImporting(true);
    try {
      const mappedFloats = importFileData.map(row => {
        const cl: any = {};
        const mappedExcelHeaders = Object.values(importMapping);
        const metadata: any = {};

        Object.keys(importMapping).forEach(dbKey => {
          const excelHeader = importMapping[dbKey];
          if (excelHeader && row[excelHeader] !== undefined) {
            cl[dbKey] = row[excelHeader];
          }
        });

        Object.keys(row).forEach(header => {
          if (!mappedExcelHeaders.includes(header) && row[header] !== undefined && row[header] !== "") {
            metadata[header] = row[header];
          }
        });

        cl.metadata = metadata;
        return cl;
      });

      const { duplicates, newFloats } = await checkFloatDuplicatesAction(mappedFloats);

      if (duplicates && duplicates.length > 0) {
        setDuplicateQueue(duplicates);
        setNewFloatsQueue(newFloats || []);
        setCurrentDuplicateIndex(0);
        setResolvedUpdates([]);
        setIsResolvingDuplicates(true);
        
        const initSelections: any = {};
        const first = duplicates[0].incomingRecord;
        Object.keys(first).forEach(k => {
          if (first[k]) initSelections[k] = true;
        });
        setFieldSelections(initSelections);
        setImportMapping(null);
      } else {
        const res = await finalizeFloatImportAction(newFloats || [], [], { name: "System Import" });
        if (!res.success) throw new Error("Failed to process import");
        if (res.failedCount && res.failedCount > 0) {
          toast.error(`Imported with errors. Failed to import ${res.failedCount} rows: ${res.failedRows?.join(', ')}`);
        } else {
          toast.success("Successfully imported candidates to float list!");
        }
        setImportMapping(null);
        setImportFileData([]);
        setDuplicateQueue([]);
        onClose();
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error importing floats");
    } finally {
      setIsImporting(false);
      importLockRef.current = false;
    }
  };

  const handleNextDuplicate = async (action: 'replace' | 'keep' | 'update' | 'new') => {
    const currentDuplicate = duplicateQueue[currentDuplicateIndex];
    const updatedList = [...resolvedUpdates];
    const newList = [...newFloatsQueue];

    if (action === 'replace') {
      const fullUpdate: any = {};
      Object.keys(currentDuplicate.incomingRecord).forEach(k => fullUpdate[k] = true);
      updatedList.push({
        action: 'replace',
        id: currentDuplicate.existingRecord.id,
        existing: currentDuplicate.existingRecord,
        data: currentDuplicate.incomingRecord
      });
    } else if (action === 'update') {
      const partialUpdate: any = {};
      Object.keys(fieldSelections).forEach(k => {
        if (fieldSelections[k]) partialUpdate[k] = currentDuplicate.incomingRecord[k];
      });
      updatedList.push({
        action: 'update',
        id: currentDuplicate.existingRecord.id,
        existing: currentDuplicate.existingRecord,
        data: partialUpdate
      });
    } else if (action === 'new') {
      newList.push(currentDuplicate.incomingRecord);
    }
    // if 'keep', do nothing

    setResolvedUpdates(updatedList);
    setNewFloatsQueue(newList);

    if (currentDuplicateIndex < duplicateQueue.length - 1) {
      const nextIdx = currentDuplicateIndex + 1;
      setCurrentDuplicateIndex(nextIdx);
      const nextInc = duplicateQueue[nextIdx].incomingRecord;
      const nextSelections: any = {};
      Object.keys(nextInc).forEach(k => {
        if (nextInc[k]) nextSelections[k] = true;
      });
      setFieldSelections(nextSelections);
    } else {
      setIsResolvingDuplicates(false);
      setIsImporting(true);
      try {
        const res = await finalizeFloatImportAction(newList, updatedList, { name: "System Import" });
        if (!res.success) throw new Error("Failed to finalize import");
        if (res.failedCount && res.failedCount > 0) {
          toast.error(`Imported with errors. Failed to import ${res.failedCount} rows: ${res.failedRows?.join(', ')}`);
        } else {
          toast.success("Successfully imported candidates to float list!");
        }
        setImportMapping(null);
        setImportFileData([]);
        setDuplicateQueue([]);
        onClose();
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
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-[#133255]">Import floats</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {!importMapping && (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center bg-gray-50/50">
              {isImporting ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-[#D8B15B] animate-spin" />
                  <p className="text-sm font-medium text-gray-600">AI is mapping your columns...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-400 mb-4" />
                  <p className="text-sm font-medium text-gray-700 mb-1">Upload Excel or CSV file</p>
                  <p className="text-xs text-gray-500 mb-6 text-center max-w-sm">
                    Our AI will automatically map your columns to the required fields.
                  </p>
                  <label className="cursor-pointer bg-[#133255] hover:bg-[#1b4370] text-white px-5 py-2.5 rounded-md text-sm font-medium transition-colors">
                    Select File
                    <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                  </label>
                </>
              )}
            </div>
          )}

          {importMapping && (
            <div className="space-y-6">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm flex gap-3">
                <div>
                  <p className="font-semibold mb-1">AI Mapping Complete</p>
                  <p>Please review how your columns will be imported. If a field shows 'Ignored', it means we couldn't find a matching column in your file.</p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-500 w-1/3">System Field</th>
                      <th className="px-4 py-3 font-medium text-gray-500 w-12 text-center"></th>
                      <th className="px-4 py-3 font-medium text-gray-500 flex-1">Your Column</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Object.keys(importMapping).map(dbKey => {
                      const excelHeader = importMapping[dbKey];
                      return (
                        <tr key={dbKey}>
                          <td className="px-4 py-3 font-medium text-gray-700 capitalize">{dbKey.replace(/([A-Z])/g, ' $1').trim()}</td>
                          <td className="px-4 py-3 text-center">
                            <ArrowRight className="w-4 h-4 text-gray-300 inline-block" />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={excelHeader || ""}
                              onChange={e => setImportMapping({...importMapping, [dbKey]: e.target.value || null})}
                              className="w-full h-9 px-3 border rounded-md bg-white text-sm focus:border-[#133255] outline-none"
                            >
                              <option value="">-- Ignored (Leave blank) --</option>
                              {importHeaders.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  onClick={() => { setImportMapping(null); setImportFileData([]); }}
                  className="px-5 py-2.5 rounded-md border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors text-sm"
                  disabled={isImporting}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmImport}
                  disabled={isImporting}
                  className="px-5 py-2.5 rounded-md bg-[#D8B15B] text-[#133255] font-bold hover:bg-[#e8c97a] transition-colors text-sm flex items-center gap-2"
                >
                  {isImporting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Import {importFileData.length} floats
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    
    {isResolvingDuplicates && duplicateQueue.length > 0 && (
      <div className="fixed inset-0 bg-[#0d162e]/50 backdrop-blur-sm z-50 flex items-center justify-center p-5">
        <div className="bg-white rounded-[20px] shadow-[0_30px_80px_rgba(0,0,0,0.3)] w-full max-w-[800px] flex flex-col max-h-[90vh]">
          <div className="px-6 py-5 border-b border-[#e4e8f0] flex justify-between items-center bg-[#f8fafc] rounded-t-[20px]">
            <div>
              <h3 className="font-serif text-[21px] font-bold text-gray-900">Resolve Duplicates</h3>
              <p className="text-sm text-[#5a6679] mt-1">
                Candidate {currentDuplicateIndex + 1} of {duplicateQueue.length}
              </p>
            </div>
            <button onClick={() => { setIsResolvingDuplicates(false); setIsImporting(false); onClose(); }} className="text-[#8a93a3] text-xl hover:text-gray-900">✕</button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            <div className="bg-[#fff9e6] border border-[#fdebb4] text-[#b7791f] px-4 py-3 rounded-[10px] mb-6 text-[14px]">
              <strong>Conflict:</strong> {duplicateQueue[currentDuplicateIndex].reason}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-[11px] uppercase tracking-wider font-bold text-[#8a93a3] mb-3">Incoming Record (Import)</h4>
                <div className="bg-[#f8fafc] border border-[#e4e8f0] rounded-[12px] overflow-hidden">
                  {Object.entries(duplicateQueue[currentDuplicateIndex].incomingRecord).map(([k, v], i) => v ? (
                    <div key={k} className={`px-4 py-3 text-[14px] flex justify-between items-center ${i !== 0 ? 'border-t border-[#e4e8f0]' : ''}`}>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={!!fieldSelections[k]}
                          onChange={(e) => setFieldSelections({...fieldSelections, [k]: e.target.checked})}
                          className="w-4 h-4 text-[#133255] border-gray-300 rounded focus:ring-[#133255]"
                        />
                        <span className="font-medium text-[#5a6679] capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                      </div>
                      <span className="text-gray-900 font-semibold max-w-[150px] truncate" title={String(v)}>{String(v)}</span>
                    </div>
                  ) : null)}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] uppercase tracking-wider font-bold text-[#8a93a3] mb-3">Existing Record (Database)</h4>
                <div className="bg-white border border-[#e4e8f0] rounded-[12px] overflow-hidden">
                  {Object.entries(duplicateQueue[currentDuplicateIndex].existingRecord).map(([k, v], i) => (
                    k !== 'id' && k !== 'createdAt' && k !== 'updatedAt' && v ? (
                      <div key={k} className={`px-4 py-3 text-[14px] flex justify-between items-center ${i !== 0 ? 'border-t border-[#e4e8f0]' : ''}`}>
                        <span className="font-medium text-[#5a6679] capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-gray-900 max-w-[150px] truncate" title={String(v)}>{String(v)}</span>
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 border-t border-[#e4e8f0] bg-[#f8fafc] flex justify-between items-center rounded-b-[20px]">
            <button 
              onClick={() => handleNextDuplicate('keep')}
              className="text-[#5a6679] font-medium text-[14px] hover:text-gray-900"
            >
              Skip (Keep Existing)
            </button>
            <div className="flex gap-3">
              <button 
                onClick={() => handleNextDuplicate('new')}
                className="px-4 py-2 bg-white border border-[#e4e8f0] text-gray-900 rounded-[9px] text-[14px] font-bold hover:bg-gray-50"
              >
                Import as New
              </button>
              <button 
                onClick={() => handleNextDuplicate('replace')}
                className="px-4 py-2 bg-[#fdf2d6] text-[#b7791f] border border-[#f0dcae] rounded-[9px] text-[14px] font-bold hover:bg-[#faeac1]"
              >
                Overwrite Existing
              </button>
              <button 
                onClick={() => handleNextDuplicate('update')}
                className="px-4 py-2 bg-[#133255] text-white rounded-[9px] text-[14px] font-bold hover:bg-[#1a4473]"
              >
                Merge Selected Fields
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
