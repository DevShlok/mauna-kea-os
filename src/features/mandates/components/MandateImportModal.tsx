"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { X, Upload, Loader2, ArrowRight } from "lucide-react";
import { mapMandatesAction, bulkInsertMandatesAction } from "@/actions/imports";
import { useRouter } from "next/navigation";

export default function MandateImportModal({ isOpen, onClose, clientId, clientName }: { isOpen: boolean, onClose: () => void, clientId: string, clientName: string }) {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);
  const [importMapping, setImportMapping] = useState<any>(null);
  const [importFileData, setImportFileData] = useState<any[]>([]);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);

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

      const data: any = await mapMandatesAction(headers.filter((h: string) => h), sampleData);
      
      if (!data || !data.mapping) {
        throw new Error("Failed to map mandates: AI returned empty response.");
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
      const mappedMandates = importFileData.map(row => {
        const m: any = {};
        Object.keys(importMapping).forEach(dbKey => {
          const excelHeader = importMapping[dbKey];
          if (excelHeader && row[excelHeader] !== undefined) {
            m[dbKey] = row[excelHeader];
          }
        });
        return m;
      });

      const res = await bulkInsertMandatesAction(mappedMandates, clientId, clientName);

      if (res.failedCount && res.failedCount > 0) {
        toast.error(`Imported with errors. Failed to import ${res.failedCount} rows: ${res.failedRows?.join(', ')}`);
      } else {
        toast.success("Successfully imported mandates!");
      }
      setImportMapping(null);
      setImportFileData([]);
      onClose();
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Error importing mandates.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-[#133255]">Import Mandates</h2>
            <p className="text-sm text-gray-500">For client: <span className="font-semibold text-gray-700">{clientName}</span></p>
          </div>
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
                  Import {importFileData.length} Mandates
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
