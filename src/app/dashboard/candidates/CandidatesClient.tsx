"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Candidate } from "@/db/schema";
import { bulkAddSubmissionAction, bulkAssignToMandateAction, updateCandidateStatusAction } from "@/app/actions";

export default function CandidatesClient({ candidates, mandates }: { candidates: Candidate[], mandates: any[] }) {
  const router = useRouter();
  
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");

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

  const filtered = candidates.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase());
    const matchCompany = !companyFilter || c.company === companyFilter;
    const matchDesignation = !designationFilter || c.designation === designationFilter;
    return matchSearch && matchCompany && matchDesignation;
  });

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)));
    }
  };

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

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
        <Link href="/dashboard/candidates/new" className="px-5 py-2.5 bg-[#D8B15B] text-[#0d2f6e] rounded-lg text-sm font-bold shadow-sm hover:bg-[#e8c97a] transition-colors inline-block">
          + Add Candidate
        </Link>
      </div>
      
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
                    No candidates match these filters. <button onClick={() => {setSearch(''); setCompanyFilter(''); setDesignationFilter('');}} className="text-[#1d4ed8] font-semibold">Clear filters</button>
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

    </div>
  );
}