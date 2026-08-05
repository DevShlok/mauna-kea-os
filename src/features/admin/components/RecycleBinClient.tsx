"use client";
import { useState, useEffect, useCallback } from "react";
import { restoreEntityAction, hardDeleteEntityAction } from "@/actions";
import toast from "react-hot-toast";
import { confirmDialog } from "@/components/ConfirmDialog";
import { useColumnPrefs, DEFAULT_RECYCLE_COLUMNS, ColumnDef } from "@/hooks/useColumnPrefs";
import { AdvancedTable } from "@/components/ui/AdvancedTable";
import { ColumnCustomizerPanel } from "@/components/ui/ColumnCustomizerPanel";
import { Settings, Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

type Metadata = { totalCount: number; totalPages: number; currentPage: number; uniqueTypes?: string[] };

export default function RecycleBinClient({ items, metadata }: { items: any[]; metadata: Metadata }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [localItems, setLocalItems] = useState(items);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const { columns, visibleColumns, isLoading: isColsLoading, setColumnWidth, reorderColumns, toggleColumn, resetToDefault } = useColumnPrefs("recycleListCols", DEFAULT_RECYCLE_COLUMNS);

  const updateURL = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "") params.delete(key);
      else params.set(key, val);
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const t = setTimeout(() => {
      const current = searchParams.get("search") || "";
      if (searchInput !== current) updateURL({ search: searchInput || null, page: "1" });
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const sortKey = searchParams.get("sortKey") || "deletedAt";
  const sortDir = (searchParams.get("sortDir") || "desc") as "asc" | "desc";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 50;
  const typeFilter = searchParams.get("type") || "";

  const toggleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    updateURL({ sortKey: key, sortDir: newDir, page: "1" });
  };

  const allSelected = localItems.length > 0 && selectedIds.size === localItems.length;

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(localItems.map((i: any) => i.id.toString())));
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const getGroupedSelected = () => {
    const groups: Record<string, string[]> = {};
    Array.from(selectedIds).forEach(id => {
      const item = localItems.find(i => i.id.toString() === id);
      if (item) {
        if (!groups[item.type]) groups[item.type] = [];
        groups[item.type].push(item.originalId);
      }
    });
    return groups;
  };

  const handleRestore = async () => {
    setIsSubmitting(true);
    try {
      const groups = getGroupedSelected();
      for (const [type, ids] of Object.entries(groups)) {
        let dbType = "clients";
        if (type === "Mandates") dbType = "mandates";
        if (type === "Candidates") dbType = "candidates";
        if (type === "Floats") dbType = "floats";
        if (type === "Users") dbType = "users";
        if (type === "Frameworks") dbType = "frameworks";
        await restoreEntityAction(dbType, ids);
      }
      setLocalItems(localItems.filter(i => !selectedIds.has(i.id.toString())));
      setSelectedIds(new Set());
      toast.success("Items restored successfully");
    } catch (e) {
      toast.error("Failed to restore items");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHardDelete = async () => {
    const ok = await confirmDialog("Are you sure you want to permanently delete these items? This action cannot be undone.");
    if (!ok) return;
    setIsSubmitting(true);
    try {
      const groups = getGroupedSelected();
      for (const [type, ids] of Object.entries(groups)) {
        let dbType = "clients";
        if (type === "Mandates") dbType = "mandates";
        if (type === "Candidates") dbType = "candidates";
        if (type === "Floats") dbType = "floats";
        if (type === "Users") dbType = "users";
        if (type === "Frameworks") dbType = "frameworks";
        await hardDeleteEntityAction(dbType, ids);
      }
      setLocalItems(localItems.filter(i => !selectedIds.has(i.id.toString())));
      setSelectedIds(new Set());
      toast.success("Items permanently deleted");
    } catch (e) {
      toast.error("Failed to delete items");
    } finally {
      setIsSubmitting(false);
    }
  };

  const candidateDeletedCount = localItems.filter((i: any) => i.type === 'Candidates' || i.type === 'candidate').length;
  const clientDeletedCount = localItems.filter((i: any) => i.type === 'Clients' || i.type === 'client').length;
  const mandateDeletedCount = localItems.filter((i: any) => i.type === 'Mandates' || i.type === 'mandate').length;

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

      {/* ── Page Header ───────────────────────────────────── */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[26px] font-serif font-bold text-[#133255] tracking-tight">
            Recycle Bin
          </h1>
          <p className="text-[13.5px] text-[#6b7a99] mt-1">
            {metadata.totalCount.toLocaleString()} total soft-deleted records
          </p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="h-10 px-4 neo-btn text-[#475569] text-[13.5px] font-semibold transition-all flex items-center gap-2"
          >
            <Settings size={15} /> Customise View
          </button>
        </div>
      </div>

      {/* ── KPI Stat Cards ─────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { label: "Total Deleted", value: metadata.totalCount, color: "text-[#133255]" },
          { label: "Candidates", value: candidateDeletedCount, color: "text-[#2a44a0]" },
          { label: "Clients", value: clientDeletedCount, color: "text-[#b7791f]" },
          { label: "Mandates", value: mandateDeletedCount, color: "text-[#c53030]" },
        ].map((kpi, i) => (
          <div
            key={i}
            className="flex-1 min-w-[150px] neo-card-sm px-6 py-4 transition-transform hover:-translate-y-0.5"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {kpi.label}
            </div>
            <div className={`text-[24px] font-serif font-bold ${kpi.color}`}>
              {kpi.value.toLocaleString()}
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
              placeholder="Search deleted items..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="flex-1 text-[14px] font-bold text-slate-800 bg-transparent outline-none placeholder-slate-400"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => { updateURL({ type: e.target.value || null, page: "1" }); setSelectedIds(new Set()); }}
            className="px-4 h-10 neo-inset text-sm text-slate-700 font-semibold outline-none min-w-[150px]"
          >
            <option value="">All Types</option>
            <option value="candidate">Candidates</option>
            <option value="client">Clients</option>
            <option value="mandate">Mandates</option>
            <option value="framework">Frameworks</option>
          </select>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 bg-[#0E2150] text-white rounded-[13px] px-5 py-3 mb-4 shadow-md transition-all">
          <div className="font-semibold text-sm">
            <b className="text-[#d7a33c]">{selectedIds.size}</b> selected
          </div>
          <div className="ml-auto flex gap-3">
            <button onClick={handleRestore} disabled={isSubmitting} className="px-3 py-2 bg-[#d7a33c] text-white rounded-[9px] text-[15px] font-bold shadow-md hover:brightness-105">
              Restore
            </button>
            <button onClick={handleHardDelete} disabled={isSubmitting} className="px-3 py-2 bg-red-500 text-white rounded-[9px] text-[15px] font-bold shadow-md hover:brightness-105">
              Delete Permanently
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="text-[#a9b7da] font-semibold text-[15px] hover:text-white px-2">Clear</button>
          </div>
        </div>
      )}

      <div className="h-full flex flex-col min-h-[400px]">
        <AdvancedTable
          data={localItems}
          total={metadata.totalCount}
          columns={columns}
          page={page}
          pageSize={pageSize}
          setPageSize={(s) => updateURL({ pageSize: String(s), page: "1" })}
          setPage={(p) => updateURL({ page: String(p) })}
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
          renderCell={(item: any, col: ColumnDef) => {
            const d = item.deletedAt ? new Date(item.deletedAt) : null;
            const expires = d ? new Date(d.getTime() + 30 * 24 * 60 * 60 * 1000) : null;
            const daysLeft = expires ? Math.max(0, Math.ceil((expires.getTime() - new Date().getTime()) / (1000 * 3600 * 24))) : null;
            switch (col.key) {
              case "type": return <span className="font-semibold text-gray-600">{item.type}</span>;
              case "name": return <span className="font-semibold text-[#133255]">{item.name}</span>;
              case "deletedBy": return <span className="text-gray-600">{item.deletedBy || "Unknown"}</span>;
              case "deletedAt": return <span className="text-gray-500">{d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>;
              case "expiresIn": return daysLeft !== null ? <span className={`text-xs font-bold ${daysLeft <= 3 ? "text-red-500" : "text-gray-500"}`}>{daysLeft} days</span> : <span>—</span>;
              default: return <span className="text-gray-500">{item[col.key] || "—"}</span>;
            }
          }}
          emptyState={
            <div className="py-20 flex flex-col items-center text-center">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mb-4" xmlns="http://www.w3.org/2000/svg">
                <rect x="12" y="8" width="40" height="48" rx="4" stroke="#d1d5db" strokeWidth="2" fill="none" />
                <path d="M8 16h48M24 8v8M40 8v8" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
                <path d="M24 28v16M32 28v16M40 28v16" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Trash is empty</h3>
              <p className="text-sm text-gray-500 max-w-xs">Deleted items appear here for 30 days before permanent removal.</p>
            </div>
          }
        />
      </div>

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
