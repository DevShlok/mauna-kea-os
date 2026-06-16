import os

filepath = r"c:\Users\LENOVO\OneDrive\Desktop\Mauna Kea OS\mauna-kea-os\src\app\dashboard\candidates\CandidatesClient.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace imports
import_section = """
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
"""

content = content.replace(
    '"use client";\nimport Link from "next/link";\nimport { useRouter } from "next/navigation";\nimport { useState } from "react";\nimport { Candidate } from "@/db/schema";\nimport { bulkAddSubmissionAction, bulkAssignToMandateAction, updateCandidateStatusAction } from "@/app/actions";',
    import_section.strip()
)

# Replace states
old_states = """
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
"""

new_states = """
  const [search, setSearch] = useState("");
  const [companiesFilter, setCompaniesFilter] = useState<string[]>([]);
  const [designationsFilter, setDesignationsFilter] = useState<string[]>([]);
  const [qualsFilter, setQualsFilter] = useState<string[]>([]);
  const [priorEmployersFilter, setPriorEmployersFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  
  const [expRange, setExpRange] = useState({ min: '', max: '' });
  const [tenureRange, setTenureRange] = useState({ min: '', max: '' });
  const [ctcRange, setCtcRange] = useState({ min: '', max: '' });

  const [showFilters, setShowFilters] = useState(false);
"""

content = content.replace(old_states.strip(), new_states.strip())

# Replace logic
old_logic = """
  const uniqueCompanies = Array.from(new Set(candidates.map(c => c.company).filter(Boolean))).sort();
  const uniqueDesignations = Array.from(new Set(candidates.map(c => c.designation).filter(Boolean))).sort();

  const filtered = candidates.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase());
    const matchCompany = !companyFilter || c.company === companyFilter;
    const matchDesignation = !designationFilter || c.designation === designationFilter;
    return matchSearch && matchCompany && matchDesignation;
  });
"""

new_logic = """
  const uniqueCompanies = Array.from(new Set(candidates.map(c => c.company).filter(Boolean))).sort();
  const uniqueDesignations = Array.from(new Set(candidates.map(c => c.designation).filter(Boolean))).sort();
  const uniqueQuals = Array.from(new Set(candidates.flatMap(c => 
    c.qual ? c.qual.map((q: any) => typeof q === 'string' ? q : q.degree).filter(Boolean) : []
  ))).sort();
  const uniquePriorEmployers = Array.from(new Set(candidates.flatMap(c => {
    if (!c.expTags) return [];
    return c.expTags.map((t: string) => {
      const parts = t.split(' - ');
      return parts.length > 1 ? parts[1].trim() : t;
    });
  }).filter(Boolean))).sort();
  const uniqueStatuses = Array.from(new Set(candidates.map(c => c.status).filter(Boolean))).sort();

  const filtered = candidates.filter((c) => {
    const matchSearch = search ? (c.name.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase()) || c.designation?.toLowerCase().includes(search.toLowerCase())) : true;
    const matchCompany = companiesFilter.length === 0 || companiesFilter.includes(c.company || '');
    const matchDesignation = designationsFilter.length === 0 || designationsFilter.includes(c.designation || '');
    const matchStatus = statusFilter.length === 0 || statusFilter.includes(c.status || 'Active');
    
    const matchQual = qualsFilter.length === 0 || (c.qual && c.qual.some((q: any) => qualsFilter.includes(typeof q === 'string' ? q : q.degree)));
    
    const matchPriorEmployer = priorEmployersFilter.length === 0 || (c.expTags && c.expTags.some((t: string) => priorEmployersFilter.some(pe => t.includes(pe))));

    const matchExp = 
      (!expRange.min || (c.exp !== null && c.exp >= Number(expRange.min))) && 
      (!expRange.max || (c.exp !== null && c.exp <= Number(expRange.max)));

    const matchTenure = 
      (!tenureRange.min || (c.tenure !== null && c.tenure >= Number(tenureRange.min))) && 
      (!tenureRange.max || (c.tenure !== null && c.tenure <= Number(tenureRange.max)));

    const ctcLacs = c.ctc || 0;
    const ctcCr = ctcLacs / 100;
    const matchCtc = 
      (!ctcRange.min || ctcCr >= Number(ctcRange.min)) && 
      (!ctcRange.max || ctcCr <= Number(ctcRange.max));

    return matchSearch && matchCompany && matchDesignation && matchStatus && matchQual && matchPriorEmployer && matchExp && matchTenure && matchCtc;
  });

  const clearAllFilters = () => {
    setSearch('');
    setCompaniesFilter([]);
    setDesignationsFilter([]);
    setQualsFilter([]);
    setPriorEmployersFilter([]);
    setStatusFilter([]);
    setExpRange({ min: '', max: '' });
    setTenureRange({ min: '', max: '' });
    setCtcRange({ min: '', max: '' });
  };
"""

content = content.replace(old_logic.strip(), new_logic.strip())

# Replace UI
old_ui = """
      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 mb-4 bg-white p-4 border border-[#e4e8f0] rounded-[16px] shadow-[0_1px_2px_rgba(16,33,80,0.04)]">
        <div className="flex-1 flex items-center gap-2 border-[1.5px] border-[#e4e8f0] rounded-[11px] px-4 py-2.5">
          <span className="text-gray-400">⚲</span>
          <input type="text" placeholder="Search by name, company or designation…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full text-sm outline-none bg-transparent"/>
        </div>
        
        <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="px-3 py-2.5 border-[1.5px] border-[#e4e8f0] rounded-[10px] text-sm bg-white outline-none focus:border-[#1d4ed8]">
          <option value="">Current company</option>
          {uniqueCompanies.map((c: any) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={designationFilter} onChange={(e) => setDesignationFilter(e.target.value)} className="px-3 py-2.5 border-[1.5px] border-[#e4e8f0] rounded-[10px] text-sm bg-white outline-none focus:border-[#1d4ed8]">
          <option value="">Current designation</option>
          {uniqueDesignations.map((d: any) => <option key={d} value={d}>{d}</option>)}
        </select>
        
        <button onClick={() => {setSearch(''); setCompanyFilter(''); setDesignationFilter('');}} className="px-3 py-2 text-[13px] text-[#1d4ed8] font-semibold hover:underline">
          Clear
        </button>
      </div>
"""

new_ui = """
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
          {(search || companiesFilter.length > 0 || designationsFilter.length > 0 || qualsFilter.length > 0 || priorEmployersFilter.length > 0 || statusFilter.length > 0 || expRange.min || expRange.max || tenureRange.min || tenureRange.max || ctcRange.min || ctcRange.max) && (
            <button onClick={clearAllFilters} className="px-3 py-2 text-[13px] text-[#1d4ed8] font-semibold hover:underline">
              Clear All
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
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">Prior employer (ex-)</label>
              <MultiSelect options={uniquePriorEmployers} selected={priorEmployersFilter} onChange={setPriorEmployersFilter} placeholder="Any" />
            </div>
            
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">Total exp (yrs)</label>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" value={expRange.min} onChange={e => setExpRange({...expRange, min: e.target.value})} className="w-1/2 h-[42px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white"/>
                <input type="number" placeholder="Max" value={expRange.max} onChange={e => setExpRange({...expRange, max: e.target.value})} className="w-1/2 h-[42px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white"/>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">Tenure, current org (yrs)</label>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" value={tenureRange.min} onChange={e => setTenureRange({...tenureRange, min: e.target.value})} className="w-1/2 h-[42px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white" step="0.1"/>
                <input type="number" placeholder="Max" value={tenureRange.max} onChange={e => setTenureRange({...tenureRange, max: e.target.value})} className="w-1/2 h-[42px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white" step="0.1"/>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">CTC (₹ Cr)</label>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" value={ctcRange.min} onChange={e => setCtcRange({...ctcRange, min: e.target.value})} className="w-1/2 h-[42px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white" step="0.01"/>
                <input type="number" placeholder="Max" value={ctcRange.max} onChange={e => setCtcRange({...ctcRange, max: e.target.value})} className="w-1/2 h-[42px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white" step="0.01"/>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">Status</label>
              <MultiSelect options={uniqueStatuses} selected={statusFilter} onChange={setStatusFilter} placeholder="Any" />
            </div>
          </div>
        )}
      </div>
"""

content = content.replace(old_ui.strip(), new_ui.strip())

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Rewrite successful")
