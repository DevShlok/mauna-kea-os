"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { deleteMultipleCandidatesAction } from "@/actions";
import toast from "react-hot-toast";
import { Pagination } from "@/components/DataTable/Pagination";
import { Download, Upload } from "lucide-react";
import dynamic from "next/dynamic";
const FloatImportModal = dynamic(() => import("./FloatImportModal"), { ssr: false });

export default function FloatListClient({ 
  paginatedData, 
  metadata 
}: { 
  paginatedData: any[], 
  metadata: any 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [stageFilter, setStageFilter] = useState(searchParams.get("stage") || "");
  const [mandateFilter, setMandateFilter] = useState(searchParams.get("mandate") || "");
  const [companyFilter, setCompanyFilter] = useState(searchParams.get("company") || "");
  const [designationFilter, setDesignationFilter] = useState(searchParams.get("designation") || "");
  const [pageSize, setPageSize] = useState(Number(searchParams.get("pageSize")) || 50);

  const sortKey = searchParams.get("sortKey") || "createdAt";
  const sortDir = searchParams.get("sortDir") || "desc";

  const { uniqueMandates, uniqueCompanies, uniqueDesignations, totalCount: totalRows, totalPages, currentPage } = metadata;
  
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);

  const updateURL = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === "") params.delete(k);
      else params.set(k, v);
    });
    if (!newParams.page) params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleSearchBlur = () => updateURL({ search });

  const toggleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    updateURL({ sortKey: key, sortDir: newDir });
  };

  const goToPage = (p: number) => updateURL({ page: p.toString() });
  const goToNextPage = () => goToPage(Math.min(totalPages, currentPage + 1));
  const goToPrevPage = () => goToPage(Math.max(1, currentPage - 1));
  const handlePageSizeChange = (s: number) => {
    setPageSize(s);
    updateURL({ pageSize: s.toString(), page: "1" });
  };

  // Bulk Delete State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allSelected = paginatedData.length > 0 && paginatedData.every((c: any) => selectedIds.has(c.externalId));
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedData.map((c: any) => c.externalId)));
  };
  const toggleRow = (externalId: string) => {
    const next = new Set(selectedIds);
    if (next.has(externalId)) next.delete(externalId);
    else next.add(externalId);
    setSelectedIds(next);
  };

  const handleDeleteSelected = async () => {
    setIsSubmitting(true);
    try {
      await deleteMultipleCandidatesAction(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsDeleteDialogOpen(false);
      toast.success("Float entries deleted successfully");
    } catch (e: any) {
      toast.error("Failed to delete entries");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportSelected = () => {
    const selected = paginatedData.filter(c => selectedIds.has(c.externalId));
    if (selected.length === 0) return;
    const headers = ["Name", "Company", "Designation", "Mandate", "Stage", "Score"];
    const rows = selected.map(c => [
      c.name || "-", 
      c.company || "-", 
      c.role || "-", 
      (c.mandateRole ? `${c.mandateRole} @ ${c.mandateCompany}` : "-"), 
      c.stage || "-", 
      c.score ? `${c.score}/10` : "-"
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "floats_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="text-[14px] text-gray-500 mb-1">Home / Candidates</div>
          <h1 className="text-3xl font-serif font-bold text-[#133255] tracking-tight">Float Database</h1>
        </div>
        <div className="flex gap-3 items-center">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="h-10 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" /> Import Floats
          </button>
        </div>
      </div>
      
      <FloatImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      
      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 mb-6 bg-white p-3 border border-gray-200 rounded-xl shadow-sm">
        <input 
          type="text" 
          placeholder="Search by Name/Company..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          onBlur={handleSearchBlur}
          onKeyDown={e => e.key === "Enter" && handleSearchBlur()} 
          className="min-w-[200px] flex-1 px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-[#133255]"
        />
        
        <select value={stageFilter} onChange={(e) => { setStageFilter(e.target.value); updateURL({ stage: e.target.value }); }} className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none">
          <option value="">All Stages</option>
          <option value="shortlist">Shortlist</option>
          <option value="interview">Interview</option>
          <option value="offer-sent">Offer</option>
          <option value="calllist">Call List</option>
          <option value="longlist">Long List</option>
          <option value="mapping">Mapping</option>
        </select>

        <select value={mandateFilter} onChange={(e) => { setMandateFilter(e.target.value); updateURL({ mandate: e.target.value }); }} className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none max-w-[200px]">
          <option value="">All Mandates</option>
          {uniqueMandates.map((m: any) => <option key={m} value={m}>{m}</option>)}
        </select>

        <select value={companyFilter} onChange={(e) => { setCompanyFilter(e.target.value); updateURL({ company: e.target.value }); }} className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none max-w-[180px]">
          <option value="">All Companies</option>
          {uniqueCompanies.map((c: any) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={designationFilter} onChange={(e) => { setDesignationFilter(e.target.value); updateURL({ designation: e.target.value }); }} className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none max-w-[180px]">
          <option value="">All Designations</option>
          {uniqueDesignations.map((d: any) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      
      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 bg-[#0E2150] text-white rounded-[13px] px-5 py-3 mb-4 shadow-md transition-all">
          <div className="font-semibold text-sm">
            <b className="text-[#d7a33c]">{selectedIds.size}</b> selected
          </div>
          <div className="ml-auto flex gap-3">
            <button onClick={handleExportSelected} className="px-3 py-2 bg-emerald-600 text-white rounded-[9px] text-[15px] font-bold shadow-md hover:brightness-105 flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Export
            </button>
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
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="px-4 py-3 text-center w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-[18px] h-[18px] accent-[#133255] cursor-pointer" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase cursor-pointer" onClick={() => toggleSort("name")}>Name {sortKey === "name" && (sortDir === "asc" ? "↑" : "↓")}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase cursor-pointer" onClick={() => toggleSort("company")}>Company {sortKey === "company" && (sortDir === "asc" ? "↑" : "↓")}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase cursor-pointer" onClick={() => toggleSort("role")}>Designation {sortKey === "role" && (sortDir === "asc" ? "↑" : "↓")}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Mandate</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase cursor-pointer" onClick={() => toggleSort("stage")}>Stage {sortKey === "stage" && (sortDir === "asc" ? "↑" : "↓")}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase cursor-pointer" onClick={() => toggleSort("score")}>Score {sortKey === "score" && (sortDir === "asc" ? "↑" : "↓")}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((c: any, i: number) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer" onClick={() => c.isFloatOnly ? router.push("/dashboard/candidates/" + c.externalId) : router.push("/dashboard/float-list/" + c.id + "?mandateId=" + c.mandateId)}>
                  <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(c.externalId)} onChange={() => toggleRow(c.externalId)} className="w-[18px] h-[18px] accent-[#133255] cursor-pointer" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-[#133255] text-white flex items-center justify-center text-xs font-bold">{c.initials}</div>
                      <span className="font-semibold text-[#133255]">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.company}</td>
                  <td className="px-4 py-3 text-gray-600">{c.role}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.mandateRole} @ {c.mandateCompany}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.stage} /></td>
                  <td className="px-4 py-3">
                    {c.score ? (
                      <span className={"px-2 py-0.5 rounded-full text-xs font-bold " + (c.score >= 8 ? "bg-green-100 text-green-800" : c.score >= 6.5 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-700")}>{c.score}/10</span>
                    ) : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button className="px-3 py-1 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255]" onClick={(e) => { 
                      e.stopPropagation(); 
                      if (c.isFloatOnly) {
                        router.push("/dashboard/candidates/" + c.externalId);
                      } else {
                        router.push("/dashboard/float-list/" + c.id + "?mandateId=" + c.mandateId);
                      }
                    }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRows={totalRows}
          startIndex={startIndex}
          endIndex={endIndex}
          pageSize={pageSize}
          setPageSize={handlePageSizeChange}
          goToPage={goToPage}
          goToNextPage={goToNextPage}
          goToPrevPage={goToPrevPage}
        />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#133255]/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[20px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="font-serif text-[21px] font-bold text-gray-900 mb-2">Delete Entries</h3>
              <p className="text-[#4a5568] text-sm">
                Are you sure you want to delete <b className="text-red-600">{selectedIds.size}</b> entr{selectedIds.size > 1 ? "ies" : "y"}? This action cannot be undone. All associated data will be permanently removed.
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