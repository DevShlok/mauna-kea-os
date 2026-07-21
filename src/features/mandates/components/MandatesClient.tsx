"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { updateMandateFieldAction, deleteMultipleMandatesAction } from "@/actions";
import toast from "react-hot-toast";

import { STAGE_OPTIONS, INTERNAL_OPTIONS, formatMandateCtc } from "@/lib/helpers";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/DataTable/Pagination";
import { SortableHeader } from "@/components/DataTable/SortableHeader";

type Candidate = { id: number; externalId: string; name: string; stage: string | null; score: number | null; hasReport: boolean | null; initials: string | null; mandateId: number; };
type Mandate = { id: number; company: string; role: string; ctc: string | null; exp: string | null; sectors: string[]; status: string | null; internalStatus: string | null; consultant: string | null; candidates: Candidate[]; };

export default function MandatesClient({ 
  initialMandates, 
  metadata,
  uniqueCompanies,
  uniqueRoles,
  uniqueSectors 
}: { 
  initialMandates: Mandate[];
  metadata: { totalCount: number; totalPages: number; currentPage: number };
  uniqueCompanies: string[];
  uniqueRoles: string[];
  uniqueSectors: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [mandates, setMandates] = useState(initialMandates);
  
  // Sync state with props
  useEffect(() => {
    setMandates(initialMandates);
  }, [initialMandates]);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [companyFilter, setCompanyFilter] = useState(searchParams.get("company") || "");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "");
  const [sectorFilter, setSectorFilter] = useState(searchParams.get("sector") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [internalFilter, setInternalFilter] = useState(searchParams.get("internalStatus") || "");
  const [pageSize, setPageSize] = useState(Number(searchParams.get("pageSize")) || 50);
  
  const sortKey = searchParams.get("sortKey") || "id";
  const sortDir = (searchParams.get("sortDir") || "desc") as "asc" | "desc";

  const updateURL = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === "") params.delete(k);
      else params.set(k, v);
    });
    // Reset page to 1 when filters change (unless page is explicitly provided)
    if (!newParams.page) {
      params.set("page", "1");
    }
    router.push(`?${params.toString()}`);
  };

  const handleSearchBlur = () => updateURL({ search });
  
  const toggleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    updateURL({ sortKey: key, sortDir: newDir });
  };
  const paginatedData = mandates;
  const totalRows = metadata.totalCount;
  const currentPage = metadata.currentPage;
  const totalPages = metadata.totalPages;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);

  const goToPage = (p: number) => updateURL({ page: p.toString() });
  const goToNextPage = () => goToPage(Math.min(totalPages, currentPage + 1));
  const goToPrevPage = () => goToPage(Math.max(1, currentPage - 1));
  const handlePageSizeChange = (s: number) => {
    setPageSize(s);
    updateURL({ pageSize: s.toString(), page: "1" });
  };

  // Bulk Delete State
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allSelected = paginatedData.length > 0 && paginatedData.every(m => selectedIds.has(m.id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedData.map(m => m.id)));
  };
  const toggleRow = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteSelected = async () => {
    setIsSubmitting(true);
    try {
      await deleteMultipleMandatesAction(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsDeleteDialogOpen(false);
      toast.success("Mandates deleted successfully");
    } catch (e: any) {
      toast.error("Failed to delete mandates");
    } finally {
      setIsSubmitting(false);
    }
  };

  async function handleStatusChange(id: number, field: "status" | "internalStatus", value: string) {
    setMandates(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    await updateMandateFieldAction(id, field, value);
    router.refresh();
  }

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="text-[14px] text-gray-500 mb-1">Home / Mandates</div>
          <h1 className="text-3xl font-serif font-bold text-[#133255] tracking-tight">All Mandates</h1>
        </div>
        <Link href="/dashboard/mandates/new" className="px-5 py-2.5 bg-[#D8B15B] text-[#133255] rounded-lg text-sm font-bold shadow-sm hover:bg-[#e8c97a] transition-colors inline-block mb-1">
          + Add New Mandate
        </Link>
      </div>
      <div className="flex flex-wrap gap-3 mb-6 bg-white p-3 border border-gray-200 rounded-xl shadow-sm">
        <input 
          type="text" 
          placeholder="Search mandates..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          onBlur={handleSearchBlur}
          onKeyDown={e => e.key === "Enter" && handleSearchBlur()}
          className="min-w-[200px] flex-1 px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-[#133255]"/>
        
        <select 
          value={companyFilter} 
          onChange={e => { setCompanyFilter(e.target.value); updateURL({ company: e.target.value }); }} 
          className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none max-w-[180px]">
          <option value="">All Companies</option>
          {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        
        <select 
          value={roleFilter} 
          onChange={e => { setRoleFilter(e.target.value); updateURL({ role: e.target.value }); }} 
          className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none max-w-[180px]">
          <option value="">All Roles</option>
          {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        
        <select 
          value={sectorFilter} 
          onChange={e => { setSectorFilter(e.target.value); updateURL({ sector: e.target.value }); }} 
          className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none max-w-[180px]">
          <option value="">All Sectors</option>
          {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        
        <select 
          value={statusFilter} 
          onChange={e => { setStatusFilter(e.target.value); updateURL({ status: e.target.value }); }} 
          className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none max-w-[180px]">
          <option value="">All Statuses</option>
          {STAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        
        <select 
          value={internalFilter} 
          onChange={e => { setInternalFilter(e.target.value); updateURL({ internalStatus: e.target.value }); }} 
          className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none max-w-[180px]">
          <option value="">All Internal</option>
          {INTERNAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 bg-[#0E2150] text-white rounded-[13px] px-5 py-3 mb-4 shadow-md transition-all">
          <div className="font-semibold text-sm">
            <b className="text-[#d7a33c]">{selectedIds.size}</b> selected
          </div>
          <div className="ml-auto flex gap-3">
            <button onClick={() => setIsDeleteDialogOpen(true)} className="px-3 py-2 bg-red-500 text-white rounded-[9px] text-[15px] font-bold shadow-md hover:brightness-105 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Delete
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="text-[#a9b7da] font-semibold text-[15px] hover:text-white px-2">
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="px-4 py-3 text-center w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-[18px] h-[18px] accent-[#133255] cursor-pointer" />
              </th>
              <SortableHeader label="Company" colKey="company" sortKey={sortKey as string} sortDir={sortDir} toggleSort={toggleSort} />
              <SortableHeader label="Role" colKey="role" sortKey={sortKey as string} sortDir={sortDir} toggleSort={toggleSort} />
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Budget</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Experience</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Sectors</th>
              <SortableHeader label="Status" colKey="status" sortKey={sortKey as string} sortDir={sortDir} toggleSort={toggleSort} />
              <SortableHeader label="Internal" colKey="internalStatus" sortKey={sortKey as string} sortDir={sortDir} toggleSort={toggleSort} />
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Actions</th>
            </tr></thead>
            <tbody>
              {paginatedData.map(m => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer" onClick={() => router.push("/dashboard/mandates/" + m.id)}>
                  <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(m.id)} onChange={() => toggleRow(m.id)} className="w-[18px] h-[18px] accent-[#133255] cursor-pointer" />
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#133255]">{m.company}</td>
                  <td className="px-4 py-3 text-gray-700">{m.role}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatMandateCtc(m.ctc)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{m.exp}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">{m.sectors.map(s => <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{s}</span>)}</div>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <select value={m.status || ""} onChange={e => handleStatusChange(m.id, "status", e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-xs bg-white outline-none cursor-pointer">
                      {STAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <select value={m.internalStatus || ""} onChange={e => handleStatusChange(m.id, "internalStatus", e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-xs bg-white outline-none cursor-pointer">
                      {INTERNAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <button className="px-3 py-1 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255]" onClick={() => router.push("/dashboard/mandates/" + m.id)}>Open</button>
                  </td>
                </tr>
              ))}
              {total === 0 && (
                <tr>
                  <td colSpan={9} className="p-0 border-none">
                    <EmptyState 
                      title="No mandates found" 
                      description="No mandates match your current filters. Try adjusting them." 
                      actionLabel="Clear Filters" 
                      onAction={() => {
                        setSearch("");
                        setCompanyFilter("");
                        setRoleFilter("");
                        setSectorFilter("");
                        setStatusFilter("");
                        setInternalFilter("");
                        updateURL({ search: "", company: "", role: "", sector: "", status: "", internalStatus: "" });
                      }}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        totalRows={totalRows}
        goToNextPage={goToNextPage}
        goToPrevPage={goToPrevPage}
        pageSize={pageSize}
        setPageSize={handlePageSizeChange}
        goToPage={goToPage}
      />
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#133255]/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[20px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="font-serif text-[21px] font-bold text-gray-900 mb-2">Delete Mandates</h3>
              <p className="text-[#4a5568] text-sm">
                Are you sure you want to delete <b className="text-red-600">{selectedIds.size}</b> mandate{selectedIds.size > 1 ? "s" : ""}? This action cannot be undone. All associated data will be permanently removed.
              </p>
              
              <div className="mt-6 flex justify-end gap-3">
                <button 
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-[#4a5568] hover:bg-gray-100 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteSelected}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-red-600 text-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}