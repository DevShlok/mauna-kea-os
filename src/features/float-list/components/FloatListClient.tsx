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

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-[14px] text-gray-500 mb-1">Home / Talent Pool</div>
          <h1 className="text-3xl font-serif font-bold text-[#133255] tracking-tight">
            Float Database
            <span className="text-sm font-sans font-normal text-gray-400 ml-3">({metadata.totalCount} candidates)</span>
          </h1>
        </div>
      </div>

      <FloatImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />

      {/* Filters Bar */}
      <div className="neo-bar flex flex-wrap gap-3 mb-4 p-3 items-center">
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Name / Company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-[9px] text-sm focus:outline-none focus:border-[#133255] bg-white"
          />
        </div>
        
        <select value={stageFilter} onChange={(e) => { setStageFilter(e.target.value); updateURL({ stage: e.target.value }); }} className="h-10 px-3 border border-gray-200 rounded-[9px] text-sm bg-white focus:outline-none focus:border-[#133255]">
          <option value="">All Stages</option>
          <option value="shortlist">Shortlist</option>
          <option value="interview">Interview</option>
          <option value="offer-sent">Offer</option>
          <option value="calllist">Call List</option>
          <option value="longlist">Long List</option>
          <option value="mapping">Mapping</option>
        </select>

        <select value={mandateFilter} onChange={(e) => { setMandateFilter(e.target.value); updateURL({ mandate: e.target.value }); }} className="h-10 px-3 border border-gray-200 rounded-[9px] text-sm bg-white focus:outline-none focus:border-[#133255] max-w-[200px]">
          <option value="">All Mandates</option>
          {uniqueMandates.map((m: any) => <option key={m} value={m}>{m}</option>)}
        </select>

        <select value={companyFilter} onChange={(e) => { setCompanyFilter(e.target.value); updateURL({ company: e.target.value }); }} className="h-10 px-3 border border-gray-200 rounded-[9px] text-sm bg-white focus:outline-none focus:border-[#133255] max-w-[180px]">
          <option value="">All Companies</option>
          {uniqueCompanies.map((c: any) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={designationFilter} onChange={(e) => { setDesignationFilter(e.target.value); updateURL({ designation: e.target.value }); }} className="h-10 px-3 border border-gray-200 rounded-[9px] text-sm bg-white focus:outline-none focus:border-[#133255] max-w-[180px]">
          <option value="">All Designations</option>
          {uniqueDesignations.map((d: any) => <option key={d} value={d}>{d}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setIsCustomizerOpen(true)} className="h-10 w-10 neo-btn flex items-center justify-center text-gray-500 hover:text-[#133255]" title="Customize columns">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={() => setIsImportModalOpen(true)} className="h-10 px-4 neo-btn text-gray-700 text-sm font-semibold flex items-center gap-1.5">
            <Upload className="w-4 h-4" /> Import
          </button>
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
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-[#133255] text-white flex items-center justify-center text-xs font-bold">{c.initials}</div>
                    <span className="font-semibold text-[#133255]">{c.name}</span>
                  </div>
                );
              case "company":
                return <div className="text-gray-600">{c.company}</div>;
              case "role":
                return <div className="text-gray-600">{c.role}</div>;
              case "mandate":
                return <div className="text-gray-500 text-xs">{c.mandateRole} @ {c.mandateCompany}</div>;
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
                      <span className={"px-2 py-0.5 rounded-full text-xs font-bold " + (c.score >= 8 ? "bg-green-100 text-green-800" : c.score >= 6.5 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-700")}>{c.score}/10</span>
                    ) : <span className="text-gray-300">-</span>}
                  </div>
                );
              case "actions":
                return (
                  <div onClick={e => e.stopPropagation()}>
                    <button className="px-3 py-1 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255]" onClick={(e) => { 
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