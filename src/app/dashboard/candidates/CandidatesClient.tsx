"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Candidate } from "@/db/schema";
import { bulkAddSubmissionAction, bulkAssignToMandateAction, updateCandidateStatusAction } from "@/app/actions";

const MultiSelect = ({ options, selected, onChange, placeholder }: any) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter((x: string) => x !== opt));
    else onChange([...selected, opt]);
  };

  return (
    <div className="relative w-full" ref={ref}>
      <div 
        onClick={() => setOpen(!open)}
        className="w-full min-h-[42px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 py-2 text-[13px] bg-white cursor-pointer flex justify-between items-center hover:border-[#1d4ed8] transition-colors"
      >
        <span className={selected.length === 0 ? "text-[#8a93a3]" : "text-gray-900 truncate pr-4 font-medium"}>
          {selected.length === 0 ? placeholder : selected.join(", ")}
        </span>
        <span className="text-[#8a93a3] text-[10px]">▼</span>
      </div>
      {open && (
        <div className="absolute top-full mt-1 left-0 w-[240px] bg-white border border-[#e4e8f0] rounded-[10px] shadow-xl z-50 max-h-[300px] overflow-y-auto p-1">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-[12px] text-gray-500">No options</div>
          ) : (
            options.map((opt: string) => (
              <label key={opt} className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#f4f7fd] rounded-[6px] cursor-pointer text-[13px] text-gray-800 transition-colors">
                <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="w-[15px] h-[15px] accent-[#1d4ed8] cursor-pointer" />
                <span className="truncate">{opt}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
};


const DualRangeSlider = ({ min, max, step, value, onChange }: any) => {
  const minVal = value.min === '' ? min : Number(value.min);
  const maxVal = value.max === '' ? max : Number(value.max);

  const handleMinChange = (e: any) => {
    const v = Math.min(Number(e.target.value), maxVal);
    onChange({ ...value, min: v.toString() });
  };

  const handleMaxChange = (e: any) => {
    const v = Math.max(Number(e.target.value), minVal);
    onChange({ ...value, max: v.toString() });
  };

  const minPercent = ((minVal - min) / (max - min)) * 100;
  const maxPercent = ((maxVal - min) / (max - min)) * 100;

  return (
    <div className="relative w-[92%] mx-auto h-[5px] bg-[#e4e8f0] rounded-full mt-5 mb-3">
      <div 
        className="absolute h-full bg-[#1d4ed8] rounded-full" 
        style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }} 
      />
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={minVal} 
        onChange={handleMinChange}
        className="absolute w-full h-[5px] opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
        style={{ zIndex: minVal > max - (max-min)*0.1 ? 5 : 3 }}
      />
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={maxVal} 
        onChange={handleMaxChange}
        className="absolute w-full h-[5px] opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
        style={{ zIndex: 4 }}
      />
      <div className="absolute top-1/2 -translate-y-1/2 w-[14px] h-[14px] bg-white border-[2.5px] border-[#1d4ed8] rounded-full pointer-events-none shadow-sm" style={{ left: `calc(${minPercent}% - 7px)` }} />
      <div className="absolute top-1/2 -translate-y-1/2 w-[14px] h-[14px] bg-white border-[2.5px] border-[#1d4ed8] rounded-full pointer-events-none shadow-sm" style={{ left: `calc(${maxPercent}% - 7px)` }} />
    </div>
  );
};

export default function CandidatesClient({ candidates, mandates }: { candidates: Candidate[], mandates: any[] }) {
  const router = useRouter();
  
  const [search, setSearch] = useState("");

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
            if (row.some(c => c.trim() !== '')) {
              rows.push(row);
            }
            row = [];
            val = '';
          } else {
            val += char;
          }
        }
        if (val || row.length > 0) {
          row.push(val);
          if (row.some(c => c.trim() !== '')) {
            rows.push(row);
          }
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
              rowData[colNumber - 1] = cell.value?.toString() || "";
            });
            rows.push(rowData);
          });
        } catch (excelErr: any) {
          console.warn("Excel parsing failed, attempting CSV fallback:", excelErr);
          await parseAsCsv();
        }
      }

      if (rows.length < 2) {
        alert("File appears to be empty or missing data.");
        setIsImporting(false);
        return;
      }

      // Headers is first row (keep empty strings to maintain column index mapping)
      const headers = rows[0].map((h: any) => h ? String(h).trim() : "");
      
      // Sample data is next 2 rows mapped to headers
      const sampleData = rows.slice(1, 3).map(row => {
        const obj: any = {};
        headers.forEach((h: string, i: number) => {
          if (h) obj[h] = row[i] || "";
        });
        return obj;
      });

      // Parse all data to be ready for import
      const allData = rows.slice(1).map(row => {
        const obj: any = {};
        headers.forEach((h: string, i: number) => {
          if (h) obj[h] = row[i] || "";
        });
        return obj;
      });
      setImportFileData(allData);
      setImportHeaders(headers.filter((h: string) => h));

      // Call mapping API
      const res = await fetch("/api/import-candidates/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headers: headers.filter((h: string) => h), sampleData })
      });

      if (!res.ok) throw new Error("Failed to map columns");
      
      const data = await res.json();
      
      // AI sometimes returns slightly different casing. Match it exactly to the real headers.
      const sanitizedMapping: any = {};
      const validHeaders = headers.filter((h: string) => h);
      
      Object.keys(data.data).forEach(key => {
        const aiValue = data.data[key];
        if (!aiValue) {
          sanitizedMapping[key] = null;
          return;
        }
        
        // Find exact match first
        let matchedHeader = validHeaders.find((h: string) => h === aiValue);
        
        // If no exact match, find case-insensitive match
        if (!matchedHeader) {
          matchedHeader = validHeaders.find((h: string) => h.toLowerCase() === String(aiValue).toLowerCase());
        }
        
        sanitizedMapping[key] = matchedHeader || null;
      });
      
      setImportMapping(sanitizedMapping);
      
    } catch (err) {
      console.error(err);
      alert("Error processing file. If the file is valid, the AI mapping service might be temporarily overloaded. Please try again in a few moments.");
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

  const [companiesFilter, setCompaniesFilter] = useState<string[]>([]);
  const [designationsFilter, setDesignationsFilter] = useState<string[]>([]);
  const [qualsFilter, setQualsFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  
  const [expRange, setExpRange] = useState({ min: '', max: '' });
  const [tenureRange, setTenureRange] = useState({ min: '', max: '' });
  const [ctcRange, setCtcRange] = useState({ min: '', max: '' });

  const [showFilters, setShowFilters] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Bulk modals
  const [isMandateModalOpen, setIsMandateModalOpen] = useState(false);
  const [mandateIdToAssign, setMandateIdToAssign] = useState("");
  
  const [isFloatModalOpen, setIsFloatModalOpen] = useState(false);
  const [floatForm, setFloatForm] = useState({ client: "", role: "", consultant: "", status: "Shared" });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateCandidateStatusAction(id, newStatus);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to update status");
    }
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkFloatSubmit = async () => {
    setIsSubmitting(true);
    try {
      await bulkAddSubmissionAction({
        candIds: Array.from(selectedIds),
        client: "General",
        role: "N/A",
        consultant: "Sahil Bhatia",
        status: "Shared",
      });
      setSelectedIds(new Set());
      alert("Candidates added to Float List successfully!");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to float candidates.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkMandateSubmit = async () => {
    if (!mandateIdToAssign) {
      alert("Please select a mandate.");
      return;
    }
    const mandate = mandates.find(m => m.id.toString() === mandateIdToAssign);
    if (!mandate) return;

    setIsSubmitting(true);
    try {
      await bulkAssignToMandateAction({
        mandateId: Number(mandateIdToAssign),
        candIds: Array.from(selectedIds),
        role: mandate.role,
      });
      setSelectedIds(new Set());
      setIsMandateModalOpen(false);
      setMandateIdToAssign("");
      alert("Candidates added to mandate successfully!");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to assign candidates.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const uniqueCompanies = Array.from(new Set(candidates.map(c => c.company).filter(Boolean))).sort();
  const uniqueDesignations = Array.from(new Set(candidates.map(c => c.designation).filter(Boolean))).sort();
  const uniqueQuals = Array.from(new Set(candidates.flatMap(c => 
    c.qual ? c.qual.map((q: any) => typeof q === 'string' ? q : q.degree).filter(Boolean) : []
  ))).sort();
  const uniqueStatuses = Array.from(new Set(candidates.map(c => c.status).filter(Boolean))).sort();

  const maxExpData = candidates.length > 0 ? Math.max(...candidates.map(c => c.exp || 0)) : 0;
  const maxExp = Math.max(10, Math.ceil(maxExpData));

  const maxTenureData = candidates.length > 0 ? Math.max(...candidates.map(c => c.tenure || 0)) : 0;
  const maxTenure = Math.max(5, Math.ceil(maxTenureData));

  const maxCtcData = candidates.length > 0 ? Math.max(...candidates.map(c => c.ctc || 0)) : 0;
  const maxCtc = Math.max(50, Math.ceil(maxCtcData / 10) * 10);

  const filtered = candidates.filter((c) => {
    const matchSearch = search ? (c.name.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase()) || c.designation?.toLowerCase().includes(search.toLowerCase())) : true;
    const matchCompany = companiesFilter.length === 0 || companiesFilter.includes(c.company || '');
    const matchDesignation = designationsFilter.length === 0 || designationsFilter.includes(c.designation || '');
    const matchStatus = statusFilter.length === 0 || statusFilter.includes(c.status || 'Active');
    
    const matchQual = qualsFilter.length === 0 || (c.qual && c.qual.some((q: any) => qualsFilter.includes(typeof q === 'string' ? q : q.degree)));
    
    const matchExp = 
      (!expRange.min || (c.exp !== null && c.exp >= Number(expRange.min))) && 
      (!expRange.max || (c.exp !== null && c.exp <= Number(expRange.max)));

    const matchTenure = 
      (!tenureRange.min || (c.tenure !== null && c.tenure >= Number(tenureRange.min))) && 
      (!tenureRange.max || (c.tenure !== null && c.tenure <= Number(tenureRange.max)));

    const ctcLacs = c.ctc || 0;
    const matchCtc = 
      (!ctcRange.min || ctcLacs >= Number(ctcRange.min)) && 
      (!ctcRange.max || ctcLacs <= Number(ctcRange.max));

    return matchSearch && matchCompany && matchDesignation && matchStatus && matchQual && matchExp && matchTenure && matchCtc;
  });

  const clearAllFilters = () => {
    setSearch('');
    setCompaniesFilter([]);
    setDesignationsFilter([]);
    setQualsFilter([]);
    setStatusFilter([]);
    setExpRange({ min: '', max: '' });
    setTenureRange({ min: '', max: '' });
    setCtcRange({ min: '', max: '' });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)));
    }
  };

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  const exportToExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const { saveAs } = await import('file-saver');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Candidates');

    // Define columns with widths for even spacing
    worksheet.columns = [
      { header: 'Candidate ID', key: 'id', width: 20 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Mobile', key: 'mobile', width: 20 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Current Company', key: 'company', width: 25 },
      { header: 'Current Designation', key: 'designation', width: 25 },
      { header: 'Total Experience (Years)', key: 'exp', width: 25 },
      { header: 'Tenure in Current Org (Years)', key: 'tenure', width: 28 },
      { header: 'CTC (Lakhs)', key: 'ctc', width: 15 },
      { header: 'Fixed CTC (Lakhs)', key: 'fixedCtc', width: 20 },
      { header: 'Variable CTC (Lakhs)', key: 'variableCtc', width: 22 },
      { header: 'Expected CTC (Lakhs)', key: 'expected', width: 22 },
      { header: 'Notice Period (Days)', key: 'notice', width: 22 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Qualifications', key: 'qual', width: 40 },
      { header: 'Prior Employers / Exp Tags', key: 'expTags', width: 30 },
      { header: 'Dream Roles', key: 'dreamRoles', width: 25 },
      { header: 'Dream Companies', key: 'dreamCos', width: 25 },
      { header: 'LinkedIn Profile URL', key: 'linkedin', width: 25 },
      { header: 'Target Company', key: 'targetCompany', width: 25 },
      { header: 'Notes', key: 'notes', width: 40 },
      { header: 'Resume/CV (Drive Link)', key: 'cvLink', width: 25 },
      { header: 'LinkedIn PDF (Drive Link)', key: 'linkedinPdf', width: 28 }
    ];

    // Style header row: bold and centrally aligned
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    filtered.forEach(c => {
      const qualsStr = c.qual && Array.isArray(c.qual) 
        ? c.qual.map((q: any) => typeof q === 'string' ? q : `${q.degree || ''} ${q.institute ? `from ${q.institute}` : ''} ${q.year ? `(${q.year})` : ''}`).join('; ')
        : '';

      const row = worksheet.addRow({
        id: c.id,
        name: c.name,
        email: c.email || '',
        mobile: c.mobile || '',
        location: c.location || '',
        company: c.company || '',
        designation: c.designation || '',
        exp: c.exp ?? '',
        tenure: c.tenure ?? '',
        ctc: c.ctc ?? '',
        fixedCtc: c.fixedCtc ?? '',
        variableCtc: c.variableCtc ?? '',
        expected: c.expected ?? '',
        notice: c.notice ?? '',
        status: c.status || '',
        qual: qualsStr,
        expTags: (c.expTags || []).join(', '),
        dreamRoles: (c.dreamRoles || []).join(', '),
        dreamCos: (c.dreamCos || []).join(', '),
        linkedin: c.linkedin || '',
        targetCompany: c.targetCompany || '',
        notes: c.notes || '',
        cvLink: c.cvFileName || '',
        linkedinPdf: c.linkedinPdf || ''
      });

      // Align all cells centrally
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Format Hyperlinks
      if (c.linkedin && c.linkedin.startsWith('http')) {
        row.getCell('linkedin').value = { text: c.name || 'LinkedIn', hyperlink: c.linkedin };
      }
      
      const cvCell = row.getCell('cvLink');
      if (c.cvFileName && c.cvFileName.startsWith('http')) {
        cvCell.value = { text: c.name || 'Resume', hyperlink: c.cvFileName };
      } else if (c.cvFileName) {
        cvCell.value = 'Yes';
      }

      const pdfCell = row.getCell('linkedinPdf');
      if (c.linkedinPdf && c.linkedinPdf.startsWith('http')) {
        pdfCell.value = { text: c.name || 'LinkedIn PDF', hyperlink: c.linkedinPdf };
      } else if (c.linkedinPdf) {
        pdfCell.value = 'Yes';
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "Candidates_Export.xlsx");
  };

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 font-semibold mb-1">
            <Link href="/dashboard" className="hover:text-[#123D8D]">Home</Link>
            <span>/</span>
            <span className="text-gray-800">Master Database</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Candidate DB</h1>
        </div>
        <div className="flex gap-3 items-center">
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
        </div>
      </div>
      
      {/* Filters Bar */}
      <div className="mb-4 bg-white p-4 border border-[#e4e8f0] rounded-[16px] shadow-[0_1px_2px_rgba(16,33,80,0.04)]">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 flex items-center gap-2 border-[1.5px] border-[#e4e8f0] rounded-[11px] px-4 py-2.5 focus-within:border-[#1d4ed8] transition-colors">
            <span className="text-gray-400">⚲</span>
            <input type="text" placeholder="Search by name, company or designation…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full text-sm outline-none bg-transparent"/>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`px-4 py-2.5 rounded-[11px] text-[13px] font-bold border-[1.5px] transition-all flex items-center gap-2 ${showFilters ? 'bg-[#eef2fb] text-[#1d4ed8] border-[#1d4ed8]' : 'bg-white text-[#4a5568] border-[#e4e8f0] hover:bg-[#f8fafc]'}`}
          >
            <span>{showFilters ? 'Hide Filters' : 'Advanced Filters'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          </button>
          {(search || companiesFilter.length > 0 || designationsFilter.length > 0 || qualsFilter.length > 0 || statusFilter.length > 0 || expRange.min || expRange.max || tenureRange.min || tenureRange.max || ctcRange.min || ctcRange.max) && (
            <button onClick={clearAllFilters} className="px-3 py-2 text-[13px] text-[#1d4ed8] font-semibold hover:underline">
              Clear All Filters
            </button>
          )}
        </div>
        
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-[#e4e8f0] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">Current company</label>
              <MultiSelect options={uniqueCompanies} selected={companiesFilter} onChange={setCompaniesFilter} placeholder="Any" />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">Current designation</label>
              <MultiSelect options={uniqueDesignations} selected={designationsFilter} onChange={setDesignationsFilter} placeholder="Any" />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">Qualification</label>
              <MultiSelect options={uniqueQuals} selected={qualsFilter} onChange={setQualsFilter} placeholder="Any" />
            </div>
<div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">Experience (yrs)</label>
              <div className="flex items-center gap-2 mb-2">
                <input type="number" placeholder="Min" value={expRange.min} onChange={e => {
                  let val = e.target.value;
                  if(expRange.max && Number(val) > Number(expRange.max)) val = expRange.max;
                  setExpRange({...expRange, min: val});
                }} className="w-1/2 h-[38px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white"/>
                <input type="number" placeholder="Max" value={expRange.max} onChange={e => {
                  let val = e.target.value;
                  if(expRange.min && val !== '' && Number(val) < Number(expRange.min)) val = expRange.min;
                  setExpRange({...expRange, max: val});
                }} className="w-1/2 h-[38px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white"/>
              </div>
              <DualRangeSlider min={0} max={maxExp} step={1} value={expRange} onChange={setExpRange} />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">Tenure, current org (yrs)</label>
              <div className="flex items-center gap-2 mb-2">
                <input type="number" placeholder="Min" value={tenureRange.min} onChange={e => {
                  let val = e.target.value;
                  if(tenureRange.max && Number(val) > Number(tenureRange.max)) val = tenureRange.max;
                  setTenureRange({...tenureRange, min: val});
                }} className="w-1/2 h-[38px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white" step="0.1"/>
                <input type="number" placeholder="Max" value={tenureRange.max} onChange={e => {
                  let val = e.target.value;
                  if(tenureRange.min && val !== '' && Number(val) < Number(tenureRange.min)) val = tenureRange.min;
                  setTenureRange({...tenureRange, max: val});
                }} className="w-1/2 h-[38px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white" step="0.1"/>
              </div>
              <DualRangeSlider min={0} max={maxTenure} step={0.5} value={tenureRange} onChange={setTenureRange} />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">CTC (₹ Lakhs)</label>
              <div className="flex items-center gap-2 mb-2">
                <input type="number" placeholder="Min" value={ctcRange.min} onChange={e => {
                  let val = e.target.value;
                  if(ctcRange.max && Number(val) > Number(ctcRange.max)) val = ctcRange.max;
                  setCtcRange({...ctcRange, min: val});
                }} className="w-1/2 h-[38px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white" step="1"/>
                <input type="number" placeholder="Max" value={ctcRange.max} onChange={e => {
                  let val = e.target.value;
                  if(ctcRange.min && val !== '' && Number(val) < Number(ctcRange.min)) val = ctcRange.min;
                  setCtcRange({...ctcRange, max: val});
                }} className="w-1/2 h-[38px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white" step="1"/>
              </div>
              <DualRangeSlider min={0} max={maxCtc} step={5} value={ctcRange} onChange={setCtcRange} />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">Status</label>
              <MultiSelect options={uniqueStatuses} selected={statusFilter} onChange={setStatusFilter} placeholder="Any" />
            </div>
          </div>
        )}
        </div>
      
      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 bg-[#0E2150] text-white rounded-[13px] px-5 py-3 mb-4 shadow-md transition-all">
          <div className="font-semibold text-sm">
            <b className="text-[#d7a33c]">{selectedIds.size}</b> selected
          </div>
          <div className="ml-auto flex gap-3">
            <button onClick={() => setIsMandateModalOpen(true)} className="px-3 py-2 bg-[#d7a33c] text-[#23304f] rounded-[9px] text-[13px] font-bold shadow-md hover:brightness-105">
              ＋ Add to Mandate
            </button>
            <button onClick={handleBulkFloatSubmit} disabled={isSubmitting} className="px-3 py-2 bg-[#1f9d57] text-white rounded-[9px] text-[13px] font-bold shadow-md hover:brightness-105 disabled:opacity-50">
              {isSubmitting ? "Floating..." : "➤ Float"}
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="text-[#a9b7da] font-semibold text-[13px] hover:text-white px-2">
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#e4e8f0] rounded-[16px] overflow-hidden shadow-[0_1px_2px_rgba(16,33,80,0.04)] pb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1200px]">
            <thead>
              <tr className="bg-white border-b border-[#e4e8f0]">
                <th className="px-4 py-4 text-center w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-[18px] h-[18px] accent-[#1d4ed8] cursor-pointer" />
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-bold text-[#8a93a3] uppercase tracking-wider">Name</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold text-[#8a93a3] uppercase tracking-wider">Current company</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold text-[#8a93a3] uppercase tracking-wider">Current designation</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold text-[#8a93a3] uppercase tracking-wider">Tenure (curr.)</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold text-[#8a93a3] uppercase tracking-wider">Qualifications</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold text-[#8a93a3] uppercase tracking-wider">Exp (yrs)</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold text-[#8a93a3] uppercase tracking-wider">Prior experience</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold text-[#8a93a3] uppercase tracking-wider">CTC</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold text-[#8a93a3] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any, i: number) => (
                <tr key={i} className="border-b border-[#eef1f7] hover:bg-[#f7f9fd] cursor-pointer transition-colors" onClick={() => router.push("/dashboard/candidates/" + c.id)}>
                  <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleRow(c.id)} className="w-[18px] h-[18px] accent-[#1d4ed8] cursor-pointer" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[10px] bg-[#1e3a8a] text-white flex items-center justify-center text-[14px] font-bold flex-shrink-0">{c.initials}</div>
                      <div>
                        <div className="font-bold text-[#1e3a8a] text-[14.5px] hover:underline">{c.name}</div>
                        <div className="text-[11.5px] text-[#8a93a3] mt-0.5">📍 {c.location || "Unknown"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><b className="text-gray-900">{c.company || "-"}</b></td>
                  <td className="px-4 py-4 text-[#5a6679]">{c.designation || "-"}</td>
                  <td className="px-4 py-4 text-gray-900 font-bold">{c.tenure ? `${c.tenure} yr${c.tenure > 1 ? 's' : ''}` : "-"}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      {c.qual && c.qual.length > 0 ? (
                        (c.qual as any[]).slice(0, 2).map((q: any, idx: number) => {
                          if (typeof q === 'string') {
                            return <div key={idx} className="text-[12px] text-gray-900"><b>{q}</b></div>;
                          }
                          return (
                            <div key={idx} className="text-[12px] text-gray-900 leading-tight">
                              <b>{q.degree}</b>
                              {(q.institute || q.year) && <span className="text-[#8a93a3]"> · {q.institute}{q.institute && q.year ? ' · ' : ''}{q.year}</span>}
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-[#8a93a3] text-xs">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-900 font-bold">{c.exp !== null ? c.exp : "-"}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {c.expTags && (c.expTags as string[]).length > 0 ? (
                        (c.expTags as string[]).slice(0, 2).map((t: string) => (
                          <span key={t} className="text-[11.5px] bg-[#eef2fb] text-[#33446b] rounded-[7px] px-2 py-0.5 font-medium">{t}</span>
                        ))
                      ) : "-"}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-900">
                    {c.ctc 
                      ? (
                          <div className="font-bold text-[14px]">
                            {(c.currency === 'INR' || !c.currency) ? (c.ctc >= 100 ? `INR ${(c.ctc / 100).toFixed(1).replace(/\.0$/, '')} Cr` : `INR ${c.ctc} L`) : `${c.currency} ${c.ctc}`}
                            <small className="block font-medium text-[#8a93a3] text-[11px] mt-0.5">
                              {c.fixedCtc ? `F: ${c.fixedCtc}` : ''} {c.fixedCtc && c.variableCtc ? '·' : ''} {c.variableCtc ? `V: ${c.variableCtc}` : ''}
                            </small>
                          </div>
                        )
                      : "-"}
                  </td>
                  <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                    <select
                      value={c.status || "Active"}
                      onChange={(e) => handleStatusChange(c.id, e.target.value)}
                      className={`px-3 py-1.5 rounded-[8px] text-[12px] font-bold outline-none cursor-pointer border ${
                        c.status === 'Active' || !c.status ? 'bg-[#e6f6ee] text-[#127a41] border-[#bfe6ce]' : 
                        c.status === 'Passive' ? 'bg-[#fdf2d6] text-[#b7791f] border-[#f0dcae]' :
                        c.status === 'Placed' ? 'bg-[#e8eefc] text-[#2a44a0] border-[#c9d6f6]' :
                        'bg-[#f1f3f6] text-[#697587] border-[#dde2ea]'
                      }`}
                    >
                      <option value="Active" className="bg-white text-gray-900">Active</option>
                      <option value="Passive" className="bg-white text-gray-900">Passive</option>
                      <option value="Placed" className="bg-white text-gray-900">Placed</option>
                      <option value="Do Not Contact" className="bg-white text-gray-900">Do Not Contact</option>
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-[#8a93a3] text-[13.5px]">
                    No candidates match these filters. <button onClick={clearAllFilters} className="text-[#1d4ed8] font-semibold">Clear filters</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add to Mandate Modal */}
      {isMandateModalOpen && (
        <div className="fixed inset-0 bg-[#0d162e]/50 z-50 flex items-center justify-center p-5">
          <div className="bg-white rounded-[18px] shadow-[0_30px_80px_rgba(0,0,0,0.3)] w-full max-w-[560px] max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-[#e4e8f0] flex justify-between items-center">
              <h3 className="font-serif text-[20px] font-bold text-gray-900">Add to mandate</h3>
              <button onClick={() => setIsMandateModalOpen(false)} className="text-[#8a93a3] text-xl hover:text-gray-900">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="text-[#5a6679] text-[13.5px] mb-4">
                <b>{selectedIds.size} candidates selected.</b> Choose an open mandate. The candidates enter its pipeline at <b>Identified</b> stage; you can advance the stage from the mandate workspace.
              </p>
              <div className="flex flex-col gap-3">
                {mandates.map(m => (
                  <label key={m.id} className={`flex items-center gap-3 border-[1.5px] rounded-[12px] p-4 cursor-pointer transition-colors ${mandateIdToAssign === m.id.toString() ? 'border-[#1d4ed8] bg-[#f3f7ff]' : 'border-[#e4e8f0] hover:border-[#cfd6e4] hover:bg-[#f8faff]'}`}>
                    <input type="radio" name="mandate" value={m.id} checked={mandateIdToAssign === m.id.toString()} onChange={(e) => setMandateIdToAssign(e.target.value)} className="w-[17px] h-[17px] accent-[#1d4ed8]"/>
                    <div className="flex-1">
                      <div className="font-bold text-[14px] text-gray-900">{m.title || m.role}</div>
                      <div className="text-[12px] text-[#8a93a3] mt-0.5">MND-{m.id} · {m.company}</div>
                    </div>
                    <span className="text-[11.5px] font-bold text-[#33446b] bg-[#eef2fb] rounded-[7px] px-2.5 py-1">Open</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#e4e8f0] flex justify-end gap-2.5">
              <button onClick={() => setIsMandateModalOpen(false)} className="px-4 py-2 bg-white border-[1.5px] border-[#e4e8f0] text-gray-900 rounded-[9px] text-[13px] font-semibold hover:border-[#cfd6e4]">Cancel</button>
              <button disabled={isSubmitting} onClick={handleBulkMandateSubmit} className="px-4 py-2 bg-[#1e3a8a] text-white rounded-[9px] text-[13px] font-bold hover:bg-[#24449b] disabled:opacity-50">
                {isSubmitting ? "Adding..." : "Add to pipeline"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Mapping Modal */}
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

    </div>
  );
}