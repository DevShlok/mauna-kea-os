"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Client, Mandate } from "@/db/schema";
import { Search } from "lucide-react";
import { updateClientAction, deleteMultipleClientsAction } from "@/actions";
import dynamic from "next/dynamic";
const ClientImportModal = dynamic(() => import("./ClientImportModal"), { ssr: false });
import { Upload, Plus, Download, Settings } from "lucide-react";
import toast from "react-hot-toast";
import { AdvancedTable } from "@/components/ui/AdvancedTable";
import { useColumnPrefs, DEFAULT_CLIENT_COLUMNS, ColumnDef } from "@/hooks/useColumnPrefs";
import { ColumnCustomizerPanel } from "@/components/ui/ColumnCustomizerPanel";

export default function ClientsClient({ 
  initialClients, 
  metadata,
  uniqueVerticals
}: { 
  initialClients: (Client & { mandates: Mandate[] })[];
  metadata: { totalCount: number; totalPages: number; currentPage: number };
  uniqueVerticals: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
  const [verticalFilter, setVerticalFilter] = useState(searchParams.get("vertical") || "All industries");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "All status");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [pageSize, setPageSize] = useState(Number(searchParams.get("pageSize")) || 50);

  const sortKey = searchParams.get("sortKey") || "createdAt";
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
  } = useColumnPrefs("clientListCols", DEFAULT_CLIENT_COLUMNS);

  const [localClients, setLocalClients] = useState(initialClients);
  useEffect(() => {
    setLocalClients(initialClients);
  }, [initialClients]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const updateURL = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === "" || v === "All industries" || v === "All status") params.delete(k);
      else params.set(k, v);
    });
    if (!newParams.page) params.set("page", "1");
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

  const paginatedData = localClients;
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

  const getLiveMandatesCount = (client: typeof initialClients[0]) => {
    return client.mandates.filter(m => m.status !== 'Closed' && m.status !== 'Lost').length;
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setLocalClients(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    await updateClientAction(id, { status: newStatus });
    router.refresh();
  };

  // Removed old client arrays since we use uniqueVerticals passed from server

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allSelected = paginatedData.length > 0 && paginatedData.every(c => selectedIds.has(c.id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedData.map(c => c.id)));
  };
  const toggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteSelected = async () => {
    setIsSubmitting(true);
    try {
      await deleteMultipleClientsAction(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsDeleteDialogOpen(false);
      toast.success("Clients deleted successfully");
    } catch (e: any) {
      toast.error("Failed to delete clients");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportSelected = () => {
    const selected = localClients.filter(c => selectedIds.has(c.id));
    if (selected.length === 0) return;
    const headers = ["Company", "Vertical", "Owner", "Status"];
    const rows = selected.map(c => [c.name, c.vertical || "-", c.owner || "-", c.status || "-"]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "clients_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedClients = localClients.filter(c => selectedIds.has(c.id));
  const selectedClientNames = selectedClients.map(c => c.name);
  const attachedMandatesCount = selectedClients.reduce((acc, c) => acc + (c.mandates?.length || 0), 0);

  const activeCount = localClients.filter(c => c.status === "Active").length;
  const totalMandatesCount = localClients.reduce((acc, c) => acc + (c.mandates?.length || 0), 0);
  const topVertical = uniqueVerticals[0] || "General";

  const renderCell = (c: any, col: ColumnDef) => {
    switch (col.key) {
      case "name":
        const initials = c.name ? c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "?";
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[#133255] text-white flex items-center justify-center text-[12px] font-bold shrink-0 shadow-sm uppercase">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[14px] text-[#111] truncate hover:underline">{c.name}</div>
              <div className="text-[12px] text-[#6b7a99] truncate">{c.accountId || "Client Account"}</div>
            </div>
          </div>
        );
      case "vertical":
        return <div className="text-[13px] text-[#475569] font-medium">{c.vertical || "-"}</div>;
      case "owner":
        return <div className="text-[13px] text-[#475569] font-medium">{c.owner || "-"}</div>;
      case "liveMandates":
        return (
          <div className="text-[13px] text-[#133255] font-bold">
            {getLiveMandatesCount(c)} Live
          </div>
        );
      case "status":
        return (
          <span className={`px-2.5 py-1 text-[11.5px] font-bold rounded-[6px] border ${
            c.status === 'Active' ? 'bg-[#e6f6ee] text-[#127a41] border-[#bfe6ce]' :
            'bg-[#f1f3f6] text-[#697587] border-[#dde2ea]'
          }`}>
            {c.status || "Inactive"}
          </span>
        );
      case "actions":
        return (
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Link href={`/dashboard/clients/${c.id}`} className="h-8 px-3 text-[12px] font-bold text-white rounded-[6px] bg-[#133255] hover:bg-[#1d4d82] transition-colors inline-flex items-center">
              View
            </Link>
            <Link href={`/dashboard/mandates/new?company=${encodeURIComponent(c.name)}`} className="h-8 px-3 text-[12px] font-bold text-[#133255] rounded-[6px] bg-[#D8B15B] hover:bg-[#f0c96a] transition-colors inline-flex items-center">
              + Mandate
            </Link>
          </div>
        );
      default:
        return <span className="text-[13px] text-gray-500">{c[col.key] || "-"}</span>;
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
      <ClientImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />

      {/* ── Page Header ───────────────────────────────────── */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[26px] font-serif font-bold text-[#133255] tracking-tight">
            Client Database
          </h1>
          <p className="text-[13.5px] text-[#6b7a99] mt-1">
            {totalRows.toLocaleString()} total clients · Showing {startIndex + 1}–{endIndex}
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
            <Upload size={15} /> Import Clients
          </button>
          <button 
            onClick={() => router.push('/dashboard/clients/new')}
            className="h-10 px-5 neo-btn text-[#133255] text-[13.5px] font-bold transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Add Client
          </button>
        </div>
      </div>

      {/* ── KPI Stat Cards ─────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { label: "Total Clients", value: totalRows, color: "text-[#133255]" },
          { label: "Active Clients", value: activeCount, color: "text-[#127a41]" },
          { label: "Attached Mandates", value: totalMandatesCount, color: "text-[#2a44a0]" },
          { label: "Primary Vertical", value: topVertical, color: "text-[#b7791f]" },
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
              placeholder="Search by client or industry..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="flex-1 text-[14px] font-bold text-slate-800 bg-transparent outline-none placeholder-slate-400"
            />
          </div>

          <select 
            value={verticalFilter} 
            onChange={e => { setVerticalFilter(e.target.value); updateURL({ vertical: e.target.value }); }} 
            className="px-4 h-10 neo-inset text-sm text-slate-700 font-semibold outline-none min-w-[160px]"
          >
            <option value="All industries">All industries</option>
            {uniqueVerticals.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          
          <select 
            value={statusFilter} 
            onChange={e => { setStatusFilter(e.target.value); updateURL({ status: e.target.value }); }} 
            className="px-4 h-10 neo-inset text-sm text-slate-700 font-semibold outline-none min-w-[150px]"
          >
            <option value="All status">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
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
                <Download className="w-4 h-4" />
                Export
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
            onRowClick={(row: any) => router.push(`/dashboard/clients/${row.id}`)}
          />
        </div>

      {/* Delete Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#133255]/40 backdrop-blur-sm">
          <div className="neo-card w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="w-12 h-12 neo-card-sm flex items-center justify-center mb-5 mx-auto">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="font-serif text-[21px] font-bold text-gray-900 mb-2 text-center">Delete Clients</h3>
              <p className="text-[#4a5568] text-sm mb-3 text-center">
                Are you sure you want to delete <b className="text-red-600">{selectedIds.size}</b> client{selectedIds.size > 1 ? "s" : ""}?
              </p>
              {attachedMandatesCount > 0 && (
                <div className="neo-inset p-3 mb-3 rounded-xl">
                  <p className="text-red-700 text-sm font-semibold">
                    The client{selectedIds.size > 1 ? "s" : ""} you are trying to delete {selectedIds.size > 1 ? "have" : "has"} <b className="text-red-600">{attachedMandatesCount} mandate{attachedMandatesCount > 1 ? "s" : ""}</b> attached.
                  </p>
                  <p className="text-red-500 text-xs mt-1">
                    These mandates (and any float list entries associated with them) will also be deleted.
                  </p>
                </div>
              )}
              <p className="text-[#4a5568] text-sm text-center">
                If you still wish to continue, click delete permanently.
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
