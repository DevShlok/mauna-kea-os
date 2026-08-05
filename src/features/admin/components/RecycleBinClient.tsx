"use client";
import { useState } from "react";
import { restoreEntityAction, hardDeleteEntityAction } from "@/actions";
import toast from "react-hot-toast";
import { confirmDialog } from "@/components/ConfirmDialog";
import { useColumnPrefs, DEFAULT_RECYCLE_COLUMNS, ColumnDef } from "@/hooks/useColumnPrefs";
import { AdvancedTable } from "@/components/ui/AdvancedTable";


export default function RecycleBinClient({ items }: { items: any[] }) {
  const [localItems, setLocalItems] = useState(items);
  const [filterType, setFilterType] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { columns, visibleColumns, isLoading: isColsLoading, setColumnWidth, reorderColumns } = useColumnPrefs("recycleListCols", DEFAULT_RECYCLE_COLUMNS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const filteredItems = localItems.filter(i => filterType === "All" || i.type === filterType);
  const totalRows = filteredItems.length;
  const paginatedData = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const allSelected = filteredItems.length > 0 && selectedIds.size === filteredItems.length;

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredItems.map(i => i.id.toString())));
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
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="text-[14px] text-gray-500 mb-1">Admin / Recycle Bin</div>
          <h1 className="text-3xl font-serif font-bold text-[#133255] tracking-tight">Recycle Bin</h1>
        </div>
        <select 
          value={filterType} 
          onChange={(e) => { setFilterType(e.target.value); setSelectedIds(new Set()); }}
          className="neo-inset px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#133255]"
        >
          <option value="All">All Types</option>
          <option value="Clients">Clients</option>
          <option value="Mandates">Mandates</option>
          <option value="Candidates">Candidates</option>
          <option value="Floats">Floats</option>
          <option value="Users">Users</option>
          <option value="Frameworks">Frameworks</option>
        </select>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 bg-[#0E2150] text-white rounded-[13px] px-5 py-3 mb-4 shadow-md transition-all">
          <div className="font-semibold text-sm">
            <b className="text-[#d7a33c]">{selectedIds.size}</b> selected
          </div>
          <div className="ml-auto flex gap-3">
            <button onClick={handleRestore} disabled={isSubmitting} className="px-3 py-2 bg-[#d7a33c] text-white rounded-[9px] text-[15px] font-bold shadow-md hover:brightness-105 flex items-center gap-1.5">
              Restore
            </button>
            <button onClick={handleHardDelete} disabled={isSubmitting} className="px-3 py-2 bg-red-500 text-white rounded-[9px] text-[15px] font-bold shadow-md hover:brightness-105 flex items-center gap-1.5">
              Delete Permanently
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="text-[#a9b7da] font-semibold text-[15px] hover:text-white px-2">
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="h-full flex flex-col min-h-[400px]">
        <AdvancedTable
          data={paginatedData}
          total={totalRows}
          columns={columns}
          page={page}
          pageSize={pageSize}
          setPageSize={(s) => { setPageSize(s); setPage(1); }}
          setPage={setPage}
          sortKey="deletedAt"
          sortDir="desc"
          onSort={() => {}}
          visibleColumns={visibleColumns}
          setColumnWidth={setColumnWidth}
          reorderColumns={reorderColumns}
          isLoadingCols={isColsLoading}
          selectedIds={selectedIds}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          renderCell={(item: any, col: ColumnDef) => {
            const d = new Date(item.deletedAt);
            const expires = new Date(d.getTime() + 30 * 24 * 60 * 60 * 1000);
            const daysLeft = Math.max(0, Math.ceil((expires.getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
            switch (col.key) {
              case "type": return <span className="font-semibold text-gray-600">{item.type}</span>;
              case "name": return <span className="font-semibold text-[#133255]">{item.name}</span>;
              case "deletedBy": return <span className="text-gray-600">{item.deletedBy || "Unknown"}</span>;
              case "deletedAt": return <span className="text-gray-500">{d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>;
              case "expiresIn": return <span className={`text-xs font-bold ${daysLeft <= 3 ? 'text-red-500' : 'text-gray-500'}`}>{daysLeft} days</span>;
              default: return <span className="text-gray-500">{item[col.key] || "-"}</span>;
            }
          }}
          emptyState={
            <div className="py-16 text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">🗑️ Trash is empty</h3>
              <p className="text-sm text-gray-500">Deleted items appear here for 30 days before permanent removal.</p>
            </div>
          }
        />
      </div>
    </div>
  );
}
