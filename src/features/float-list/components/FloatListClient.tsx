"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { deleteMultipleCandidatesAction } from "@/actions";
import toast from "react-hot-toast";
import { AdvancedTable } from "@/components/ui/AdvancedTable";
import { useColumnPrefs, DEFAULT_FLOAT_COLUMNS, ColumnDef } from "@/hooks/useColumnPrefs";
import { ColumnCustomizerPanel } from "@/components/ui/ColumnCustomizerPanel";
import { Download, Upload, Settings, Search } from "lucide-react";
import dynamic from "next/dynamic";
import { FloatStageDropdown } from "@/components/ui/FloatStageDropdown";
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

  const pathname = usePathname();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [stageFilter, setStageFilter] = useState(searchParams.get("stage") || "");
  const [mandateFilter, setMandateFilter] = useState(searchParams.get("mandate") || "");
  const [companyFilter, setCompanyFilter] = useState(searchParams.get("company") || "");
  const [designationFilter, setDesignationFilter] = useState(searchParams.get("designation") || "");
  const [pageSize, setPageSize] = useState(Number(searchParams.get("pageSize")) || 50);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const sortKey = searchParams.get("sortKey") || "createdAt";
  const sortDir = searchParams.get("sortDir") || "desc";

  const {
    columns,
    visibleColumns,
    isLoading: isColsLoading,
    setColumnWidth,
    reorderColumns,
    toggleColumn,
    resetToDefault,
  } = useColumnPrefs("floatListCols", DEFAULT_FLOAT_COLUMNS);

  const { uniqueMandates, uniqueCompanies, uniqueDesignations, totalCount: totalRows, totalPages, currentPage } = metadata;
  
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);

  const updateURL = useCallback((newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === "") params.delete(k);
      else params.set(k, v);
    });
    if (!newParams.page) params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  // Debounced search — fires 500ms after the user stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      const current = searchParams.get("search") || "";
      if (search !== current) updateURL({ search });
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

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

  const shortlistCount = paginatedData.filter((c: any) => c.stage === 'shortlist').length;
  const interviewCount = paginatedData.filter((c: any) => c.stage === 'interview').length;
  const offerCount = paginatedData.filter((c: any) => c.stage === 'offer-sent' || c.stage === 'offer').length;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 pb-10 pt-6">
      <ColumnCustomizerPanel
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        columns={columns}
        visibleColumns={visibleColumns}
        isAdmin={true}
        toggleColumn={toggleColumn}
        reorderColumns={reorderColumns}
        resetToDefault={resetToDefault}
      />
      <FloatImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />

      {/* ── Page Header ───────────────────────────────────── */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[26px] font-serif font-bold text-[#133255] tracking-tight">
            Float Database
          </h1>
          <p className="text-[13.5px] text-[#6b7a99] mt-1">
            {totalRows.toLocaleString()} total candidates · Showing {startIndex + 1}–{endIndex}
          </p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="h-10 px-4 neo-btn text-[#475569] text-[13.5px] font-semibold transition-all flex items-center gap-2"
          >
            <Settings size={15} /> Customise View
          </button>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="h-10 px-4 neo-btn text-[#475569] text-[13.5px] font-semibold transition-all flex items-center gap-2"
          >
            <Upload size={15} /> Import Floats
          </button>
        </div>
      </div>

      {/* ── KPI Stat Cards ─────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { label: "Total Floats", value: totalRows, color: "text-[#133255]" },
          { label: "Shortlisted", value: shortlistCount, color: "text-[#127a41]" },
          { label: "Interviewing", value: interviewCount, color: "text-[#2a44a0]" },
          { label: "Offer Sent", value: offerCount, color: "text-[#b7791f]" },
        ].map((kpi, i) => (
          <div
            key={i}
            className="flex-1 min-w-[150px] neo-card-sm px-6 py-4 transition-transform hover:-translate-y-0.5"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {kpi.label}
            </div>
            <div className={`text-[24px] font-serif font-bold ${kpi.color}`}>
              {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Bar ──────────────────────────── */}
      <div className="neo-card mb-6 p-2 relative z-10">
        <div className="flex flex-wrap gap-3 items-center p-1">
          <div className="flex-1 flex items-center gap-2.5 px-4 py-2 min-w-[220px] neo-inset">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name / Company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-[14px] font-bold text-slate-800 bg-transparent outline-none placeholder-slate-400"
            />
          </div>
          
          <select value={stageFilter} onChange={(e) => { setStageFilter(e.target.value); updateURL({ stage: e.target.value }); }} className="px-4 h-10 neo-inset text-sm text-slate-700 font-semibold outline-none min-w-[140px]">
            <option value="">All Stages</option>
            <option value="shortlist">Shortlist</option>
            <option value="interview">Interview</option>
            <option value="offer-sent">Offer</option>
            <option value="calllist">Call List</option>
            <option value="longlist">Long List</option>
            <option value="mapping">Mapping</option>
          </select>

          <select value={mandateFilter} onChange={(e) => { setMandateFilter(e.target.value); updateURL({ mandate: e.target.value }); }} className="px-4 h-10 neo-inset text-sm text-slate-700 font-semibold outline-none min-w-[150px]">
            <option value="">All Mandates</option>
            {uniqueMandates.map((m: any) => <option key={m} value={m}>{m}</option>)}
          </select>

          <select value={companyFilter} onChange={(e) => { setCompanyFilter(e.target.value); updateURL({ company: e.target.value }); }} className="px-4 h-10 neo-inset text-sm text-slate-700 font-semibold outline-none min-w-[140px]">
            <option value="">All Companies</option>
            {uniqueCompanies.map((c: any) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={designationFilter} onChange={(e) => { setDesignationFilter(e.target.value); updateURL({ designation: e.target.value }); }} className="px-4 h-10 neo-inset text-sm text-slate-700 font-semibold outline-none min-w-[140px]">
            <option value="">All Designations</option>
            {uniqueDesignations.map((d: any) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
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

      {/* Table */}
      <div className="h-full flex flex-col min-h-[500px]">
        <AdvancedTable
          data={paginatedData}
          total={totalRows}
          columns={columns}
          page={currentPage}
          pageSize={pageSize}
          setPageSize={handlePageSizeChange}
          setPage={goToPage}
          sortKey={sortKey}
          sortDir={sortDir as "asc" | "desc"}
          onSort={toggleSort}
          visibleColumns={visibleColumns}
          setColumnWidth={setColumnWidth}
          reorderColumns={reorderColumns}
          isLoadingCols={isColsLoading}
          selectedIds={selectedIds}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          renderCell={(c: any, col: ColumnDef) => {
            switch (col.key) {
              case "name":
                return (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[8px] bg-[#133255] text-white flex items-center justify-center text-[12px] font-bold shrink-0 shadow-sm uppercase">{c.initials || "FL"}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[14px] text-[#111] truncate hover:underline">{c.name}</div>
                      <div className="text-[12px] text-[#6b7a99] truncate">{c.email || c.mobile || "No contact"}</div>
                    </div>
                  </div>
                );
              case "company":
                return <div className="text-[13px] text-[#475569] font-medium">{c.company || "-"}</div>;
              case "role":
                return <div className="text-[13px] text-[#475569] font-medium">{c.role || "-"}</div>;
              case "mandate":
                return <div className="text-[12px] text-[#133255] font-bold">{c.mandateRole ? `${c.mandateRole} @ ${c.mandateCompany}` : "-"}</div>;
              case "stage":
                return (
                  <div onClick={e => e.stopPropagation()}>
                    <FloatStageDropdown id={c.id} currentStage={c.stage} />
                  </div>
                );
              case "score":
                return (
                  <div>
                    {c.score ? (
                      <span className={"px-2.5 py-0.5 rounded-[5px] text-[11.5px] font-bold " + (c.score >= 8 ? "bg-[#e6f6ee] text-[#127a41]" : c.score >= 6.5 ? "bg-[#fdf2d6] text-[#b7791f]" : "bg-[#fde8e8] text-[#c53030]")}>{c.score}/10</span>
                    ) : <span className="text-gray-300">-</span>}
                  </div>
                );
              case "actions":
                return (
                  <div onClick={e => e.stopPropagation()} className="flex items-center justify-end">
                    <button className="h-8 px-3 rounded-[6px] bg-[#133255] hover:bg-[#1d4d82] text-xs font-bold text-white transition-colors" onClick={(e) => { 
                      e.stopPropagation(); 
                      if (c.isFloatOnly) {
                        router.push("/dashboard/candidates/" + c.externalId);
                      } else {
                        router.push("/dashboard/float-list/" + c.id + "?mandateId=" + c.mandateId);
                      }
                    }}>View</button>
                  </div>
                );
              default:
                return <span className="text-[13px] text-gray-500">{c[col.key] || "-"}</span>;
            }
          }}
          onRowClick={(c: any) => {
            if (c.isFloatOnly) {
              router.push("/dashboard/candidates/" + c.externalId);
            } else {
              router.push("/dashboard/float-list/" + c.id + "?mandateId=" + c.mandateId);
            }
          }}
          emptyState={
            <div className="py-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No entries found</h3>
              <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or search query.</p>
              <button 
                onClick={() => {
                  setSearch(""); setStageFilter(""); setMandateFilter(""); setCompanyFilter(""); setDesignationFilter("");
                  updateURL({ search: "", stage: "", mandate: "", company: "", designation: "" });
                }}
                className="px-4 py-2 neo-btn text-sm font-bold text-[#133255]"
              >
                Clear Filters
              </button>
            </div>
          }
        />
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

      <ColumnCustomizerPanel
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        columns={columns}
        visibleColumns={visibleColumns}
        toggleColumn={toggleColumn}
        reorderColumns={reorderColumns}
        resetToDefault={resetToDefault}
        isAdmin={false}
      />

    </div>
  );
}