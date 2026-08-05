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

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="text-[14px] text-gray-500 mb-1">Admin / Recycle Bin</div>
          <h1 className="text-3xl font-serif font-bold text-[#133255] tracking-tight">
            Recycle Bin
            <span className="text-sm font-sans font-normal text-gray-400 ml-3">({metadata.totalCount} items)</span>
          </h1>
        </div>
      </div>

      {/* Action Bar */}
      <div className="neo-bar p-3 mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-[9px] text-sm focus:outline-none focus:border-[#133255] bg-white"
            placeholder="Search deleted items..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => { updateURL({ type: e.target.value || null, page: "1" }); setSelectedIds(new Set()); }}
          className="h-10 px-3 border border-gray-200 rounded-[9px] text-sm bg-white focus:outline-none focus:border-[#133255]"
        >
          <option value="">All Types</option>
          <option value="candidate">Candidates</option>
          <option value="client">Clients</option>
          <option value="mandate">Mandates</option>
          <option value="framework">Frameworks</option>
        </select>
        <div className="ml-auto">
          <button onClick={() => setIsCustomizerOpen(true)} className="h-10 w-10 neo-btn flex items-center justify-center text-gray-500 hover:text-[#133255]" title="Customize columns">
            <Settings className="w-4 h-4" />
          </button>
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
