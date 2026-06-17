import re

filepath = r"c:\Users\LENOVO\OneDrive\Desktop\Mauna Kea OS\mauna-kea-os\src\app\dashboard\candidates\CandidatesClient.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add new states at the top of CandidatesClient component
state_insertion = """
  // Import States
  const [isImporting, setIsImporting] = useState(false);
  const [importMapping, setImportMapping] = useState<any>(null);
  const [importFileData, setImportFileData] = useState<any[]>([]);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error("No worksheet found");

      const rows: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        const rowData: any[] = [];
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          rowData[colNumber - 1] = cell.value?.toString() || "";
        });
        rows.push(rowData);
      });

      if (rows.length < 2) {
        alert("File appears to be empty or missing data.");
        setIsImporting(false);
        return;
      }

      // Headers is first row
      const headers = rows[0].map(h => h ? h.trim() : "").filter(h => h !== "");
      
      // Sample data is next 2 rows mapped to headers
      const sampleData = rows.slice(1, 3).map(row => {
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] || "";
        });
        return obj;
      });

      // Parse all data to be ready for import
      const allData = rows.slice(1).map(row => {
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] || "";
        });
        return obj;
      });
      setImportFileData(allData);
      setImportHeaders(headers);

      // Call mapping API
      const res = await fetch("/api/import-candidates/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headers, sampleData })
      });

      if (!res.ok) throw new Error("Failed to map columns");
      
      const data = await res.json();
      setImportMapping(data.data);
      
    } catch (err) {
      console.error(err);
      alert("Error processing file. Please ensure it is a valid Excel file.");
    } finally {
      setIsImporting(false);
      e.target.value = ''; // clear input
    }
  };

  const confirmImport = async () => {
    if (!importMapping || importFileData.length === 0) return;
    setIsImporting(true);
    try {
      const mappedCandidates = importFileData.map(row => {
        const cand: any = {};
        Object.keys(importMapping).forEach(dbKey => {
          const excelHeader = importMapping[dbKey];
          if (excelHeader && row[excelHeader] !== undefined) {
            cand[dbKey] = row[excelHeader];
          }
        });
        return cand;
      });

      const res = await fetch("/api/import-candidates/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: mappedCandidates })
      });

      if (!res.ok) throw new Error("Failed to process import");

      alert("Successfully imported candidates!");
      setImportMapping(null);
      setImportFileData([]);
      router.refresh(); // Or reload window
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Error importing candidates.");
    } finally {
      setIsImporting(false);
    }
  };
"""

# Insert state after `const [search, setSearch] = useState("");`
content = content.replace('const [search, setSearch] = useState("");', 'const [search, setSearch] = useState("");\n' + state_insertion)

# Replace buttons in header
old_buttons = """        <div className="flex gap-3">
          <button onClick={exportToExcel} className="px-5 py-2.5 bg-white border border-[#e4e8f0] text-[#4a5568] rounded-lg text-sm font-bold shadow-sm hover:bg-[#f8fafc] transition-colors inline-flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export
          </button>
          <Link href="/dashboard/candidates/new" className="px-5 py-2.5 bg-[#D8B15B] text-[#0d2f6e] rounded-lg text-sm font-bold shadow-sm hover:bg-[#e8c97a] transition-colors inline-block">
            + Add Candidate
          </Link>
        </div>"""

new_buttons = """        <div className="flex gap-3 items-center">
          {isImporting && <span className="text-sm text-gray-500 font-bold animate-pulse">Processing...</span>}
          <label className={`px-5 py-2.5 bg-white border border-[#e4e8f0] text-[#4a5568] rounded-lg text-sm font-bold shadow-sm hover:bg-[#f8fafc] transition-colors inline-flex items-center gap-2 cursor-pointer ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Import
            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
          </label>

          <button onClick={exportToExcel} className="px-5 py-2.5 bg-white border border-[#e4e8f0] text-[#4a5568] rounded-lg text-sm font-bold shadow-sm hover:bg-[#f8fafc] transition-colors inline-flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export
          </button>
          <Link href="/dashboard/candidates/new" className="px-5 py-2.5 bg-[#D8B15B] text-[#0d2f6e] rounded-lg text-sm font-bold shadow-sm hover:bg-[#e8c97a] transition-colors inline-block">
            + Add Candidate
          </Link>
        </div>"""

content = content.replace(old_buttons, new_buttons)

# Add mapping modal before the final closing div
modal_code = """
      {importMapping && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#f8fafc] rounded-t-xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-serif">Confirm Column Mapping</h2>
                <p className="text-sm text-gray-500 mt-1">AI has proposed the following mapping based on your file.</p>
              </div>
              <button onClick={() => setImportMapping(null)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-4 font-bold text-xs text-gray-500 uppercase tracking-wider px-2">
                <div>Database Field</div>
                <div>Your Excel Column</div>
              </div>
              <div className="space-y-3">
                {Object.keys(importMapping).map((dbKey) => (
                  <div key={dbKey} className="grid grid-cols-2 gap-4 items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="font-semibold text-gray-700 text-sm capitalize">{dbKey.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <select 
                      className="w-full text-sm border-gray-300 rounded-md bg-white p-2 outline-none focus:border-blue-500 border"
                      value={importMapping[dbKey] || ""}
                      onChange={(e) => setImportMapping({...importMapping, [dbKey]: e.target.value === "" ? null : e.target.value})}
                    >
                      <option value="">-- Ignore this field --</option>
                      {importHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-[#f8fafc] rounded-b-xl">
              <button onClick={() => setImportMapping(null)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900">Cancel</button>
              <button onClick={confirmImport} disabled={isImporting} className="px-6 py-2 bg-[#123D8D] text-white rounded-lg text-sm font-bold shadow-md hover:bg-[#0d2f6e] transition-colors disabled:opacity-50">
                {isImporting ? "Importing..." : `Import ${importFileData.length} Candidates`}
              </button>
            </div>
          </div>
        </div>
      )}
"""

content = content.replace('    </div>\n  );\n}\n', modal_code + '    </div>\n  );\n}\n')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
