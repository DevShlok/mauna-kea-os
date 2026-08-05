"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { updateMandateFieldAction, deleteMultipleMandatesAction } from "@/actions";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
const MandateImportModal = dynamic(() => import("./MandateImportModal"), { ssr: false });
import { Upload, Download, Settings, Plus, Search } from "lucide-react";

import { STAGE_OPTIONS, INTERNAL_OPTIONS, formatMandateCtc } from "@/lib/helpers";
import { EmptyState } from "@/components/ui/EmptyState";
import { AdvancedTable } from "@/components/ui/AdvancedTable";
import { useColumnPrefs, DEFAULT_MANDATE_COLUMNS, ColumnDef } from "@/hooks/useColumnPrefs";
import { ColumnCustomizerPanel } from "@/components/ui/ColumnCustomizerPanel";

type Candidate = { id: number; externalId: string; name: string; stage: string | null; score: number | null; hasReport: boolean | null; initials: string | null; mandateId: number; };
type Mandate = { id: number; company: string; role: string; ctc: string | null; exp: string | null; sectors: string[]; status: string | null; internalStatus: string | null; consultant: string | null; candidates: Candidate[]; };

export default function MandatesClient({ 
  initialMandates, 
  metadata,
  uniqueCompanies,
  uniqueRoles,
  uniqueSectors,
  currentUser
}: { 
  initialMandates: Mandate[];
  metadata: { totalCount: number; totalPages: number; currentPage: number };
  uniqueCompanies: string[];
  uniqueRoles: string[];
  uniqueSectors: string[];
  currentUser: { name: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [mandates, setMandates] = useState(initialMandates);
  
  useEffect(() => {
    setMandates(initialMandates);
  }, [initialMandates]);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [companyFilter, setCompanyFilter] = useState(searchParams.get("company") || "");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "");
  const [sectorFilter, setSectorFilter] = useState(searchParams.get("sector") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [internalFilter, setInternalFilter] = useState(searchParams.get("internalStatus") || "");
  const [pageSize, setPageSize] = useState(Number(searchParams.get("pageSize")) || 50);
  
  const sortKey = searchParams.get("sortKey") || "id";
  const sortDir = (searchParams.get("sortDir") || "desc") as "asc" | "desc";

  const {
    columns,
    visibleColumns,
    isLoading: isColsLoading,
    toggleColumn,
    setColumnWidth,
    reorderColumns,
    resetToDefault,
    publishAsOrgDefault,
    isAdmin,
  } = useColumnPrefs("mandateListCols", DEFAULT_MANDATE_COLUMNS);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

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

  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    if (debouncedSearch !== currentSearch) {
      updateURL({ search: debouncedSearch });
    }
  }, [debouncedSearch]);
  
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allSelected = paginatedData.length > 0 && paginatedData.every(m => selectedIds.has(m.id.toString()));
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedData.map(m => m.id.toString())));
  };
  const toggleRow = (id: string | number) => {
    const strId = id.toString();
    const next = new Set(selectedIds);
    if (next.has(strId)) next.delete(strId);
    else next.add(strId);
    setSelectedIds(next);
  };

  const handleDeleteSelected = async () => {
    setIsSubmitting(true);
    try {
      await deleteMultipleMandatesAction(Array.from(selectedIds).map(Number));
      setSelectedIds(new Set());
      setIsDeleteDialogOpen(false);
      toast.success("Mandates deleted successfully");
    } catch (e: any) {
      toast.error("Failed to delete mandates");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportSelected = () => {
    const selected = mandates.filter(m => selectedIds.has(m.id.toString()));
    if (selected.length === 0) return;
    const headers = ["Company", "Role", "CTC", "Experience", "Sectors", "Status", "Internal Status"];
    const rows = selected.map(m => [
      m.company || "-", 
      m.role || "-", 
      m.ctc || "-", 
      m.exp || "-", 
      m.sectors?.join("; ") || "-", 
      m.status || "-", 
      m.internalStatus || "-"
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "mandates_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  async function handleStatusChange(id: number, field: "status" | "internalStatus", value: string) {
    setMandates(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    await updateMandateFieldAction(id, field, value);
    router.refresh();
  }

  const universeCount = mandates.filter(m => !m.status || m.status === 'universe' || m.status === 'mapping').length;
  const interviewCount = mandates.filter(m => m.status === 'interview' || m.status === 'shortlist').length;
  const closedCount = mandates.filter(m => m.status === 'offer-accepted' || m.status === 'closed' || m.status === 'position-closed').length;

  const renderCell = (m: any, col: ColumnDef) => {
    switch (col.key) {
      case "role":
        const initials = m.role ? m.role.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "M";
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[#133255] text-white flex items-center justify-center text-[12px] font-bold shrink-0 shadow-sm uppercase">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[14px] text-[#111] truncate hover:underline">{m.role}</div>
              <div className="text-[12px] text-[#6b7a99] truncate">{m.company}</div>
            </div>
          </div>
        );
      case "company":
        return <div className="font-bold text-[14px] text-gray-900">{m.company}</div>;
      case "ctc":
        return <div className="text-[13px] font-bold text-[#133255]">{formatMandateCtc(m.ctc)}</div>;
      case "exp":
        return <div className="text-[13px] text-gray-600 font-medium">{m.exp || "-"}</div>;
      case "sectors":
        return (
          <div className="flex flex-wrap gap-1">
            {Array.from(new Set(m.sectors)).map((s: any, i: number) => (
              <span key={`${s}-${i}`} className="px-2 py-0.5 bg-[#f0f3f8] text-[#475569] rounded-[4px] text-[11px] font-medium">{s}</span>
            ))}
          </div>
        );
      case "status":
        return (
          <div onClick={e => e.stopPropagation()}>
            <select value={m.status || ""} onChange={e => handleStatusChange(m.id, "status", e.target.value)} className="h-8 px-2 rounded-[6px] border border-[#d6e4ff] bg-[#f0f5ff] text-[#1d4ed8] text-[12px] font-bold outline-none cursor-pointer">
              {STAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        );
      case "internalStatus":
        return (
          <div onClick={e => e.stopPropagation()}>
            <select value={m.internalStatus || ""} onChange={e => handleStatusChange(m.id, "internalStatus", e.target.value)} className="h-8 px-2 rounded-[6px] border border-[#e2e8f0] bg-white text-slate-700 text-[12px] font-medium outline-none cursor-pointer">
              {INTERNAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        );
      case "actions":
        return (
          <div onClick={e => e.stopPropagation()} className="flex items-center justify-end">
            <button className="h-8 px-3 rounded-[6px] bg-[#133255] hover:bg-[#1d4d82] text-xs font-bold text-white transition-colors" onClick={() => router.push("/dashboard/mandates/" + m.id)}>Open</button>
          </div>
        );
      default:
        return <span className="text-[13px] text-gray-500">{m[col.key] || "-"}</span>;
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 pb-10 pt-6">
      <ColumnCustomizerPanel
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        columns={columns}
        visibleColumns={visibleColumns}
        isAdmin={isAdmin}
        toggleColumn={toggleColumn}
        reorderColumns={reorderColumns}
        resetToDefault={resetToDefault}
        publishAsOrgDefault={publishAsOrgDefault}
      />
      <MandateImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        currentUser={currentUser}
      />

      {/* ── Page Header ───────────────────────────────────── */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[26px] font-serif font-bold text-[#133255] tracking-tight">
            Mandate Database
          </h1>
          <p className="text-[13.5px] text-[#6b7a99] mt-1">
            {totalRows.toLocaleString()} total mandates · Showing {startIndex + 1}–{endIndex}
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
            <Upload size={15} /> Import Mandates
          </button>
          <Link href="/dashboard/mandates/new" className="h-10 px-5 neo-btn text-[#133255] text-[13.5px] font-bold transition-all flex items-center gap-2">
            <Plus size={16} /> Add Mandate
          </Link>
        </div>
      </div>

      {/* ── KPI Stat Cards ─────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { label: "Total Mandates", value: totalRows, color: "text-[#133255]" },
          { label: "Universe / Mapping", value: universeCount, color: "text-[#b7791f]" },
          { label: "Interview Stage", value: interviewCount, color: "text-[#2a44a0]" },
          { label: "Closed / Offer", value: closedCount, color: "text-[#127a41]" },
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
              placeholder="Search mandates..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="flex-1 text-[14px] font-bold text-slate-800 bg-transparent outline-none placeholder-slate-400"
            />
          </div>
          
          <select 
            value={companyFilter} 
            onChange={e => { setCompanyFilter(e.target.value); updateURL({ company: e.target.value }); }} 
            className="px-4 h-10 neo-inset text-sm text-slate-700 font-semibold outline-none min-w-[150px]"
          >
            <option value="">All Companies</option>
            {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <select 
            value={roleFilter} 
            onChange={e => { setRoleFilter(e.target.value); updateURL({ role: e.target.value }); }} 
            className="px-4 h-10 neo-inset text-sm text-slate-700 font-semibold outline-none min-w-[140px]"
          >
            <option value="">All Roles</option>
            {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          
          <select 
            value={sectorFilter} 
            onChange={e => { setSectorFilter(e.target.value); updateURL({ sector: e.target.value }); }} 
            className="px-4 h-10 neo-inset text-sm text-slate-700 font-semibold outline-none min-w-[140px]"
          >
            <option value="">All Sectors</option>
            {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          
          <select 
            value={statusFilter} 
            onChange={e => { setStatusFilter(e.target.value); updateURL({ status: e.target.value }); }} 
            className="px-4 h-10 neo-inset text-sm text-slate-700 font-semibold outline-none min-w-[140px]"
          >
            <option value="">All Statuses</option>
            {STAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          
          <button 
            onClick={handleExportSelected} 
            className="h-10 px-4 neo-btn text-slate-700 text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

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
              sortDir={sortDir}
              onSort={toggleSort}
              visibleColumns={visibleColumns}
              setColumnWidth={setColumnWidth}
              reorderColumns={reorderColumns}
              isLoadingCols={isColsLoading}
              selectedIds={selectedIds}
              onToggleRow={toggleRow}
              onToggleAll={toggleAll}
              renderCell={renderCell}
              onRowClick={(row: any) => router.push(`/dashboard/mandates/${row.id}`)}
              emptyState={
                <div className="py-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
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
                </div>
              }
            />
          </div>

      {/* Delete Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#133255]/40 backdrop-blur-sm">
        <div className="neo-card max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="w-12 h-12 neo-card-sm flex items-center justify-center mb-5 mx-auto">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="font-serif text-[21px] font-bold text-gray-900 mb-2 text-center">Delete Mandates</h3>
              <p className="text-[#4a5568] text-sm text-center">
                Are you sure you want to delete <b className="text-red-600">{selectedIds.size}</b> mandate{selectedIds.size > 1 ? "s" : ""}? This action cannot be undone.
              </p>
              
              <div className="mt-8 flex justify-center gap-4">
                <button 
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="px-5 py-2.5 neo-btn font-bold text-sm text-gray-600"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteSelected}
                  className="px-5 py-2.5 neo-btn font-bold text-sm text-white disabled:opacity-50"
                  style={{ background: '#dc2626' }}
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