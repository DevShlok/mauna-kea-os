"use client";
import { useState } from "react";
import { restoreEntityAction, hardDeleteEntityAction } from "@/actions";
import toast from "react-hot-toast";
import { useDataTable } from "@/hooks/useDataTable";
import { Pagination } from "@/components/DataTable/Pagination";


export default function RecycleBinClient({ items }: { items: any[] }) {
  const [localItems, setLocalItems] = useState(items);
  const [filterType, setFilterType] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredItems = localItems.filter(i => filterType === "All" || i.type === filterType);

  const _dt = useDataTable({ data: filteredItems, defaultSortKey: "deletedAt", defaultSortDir: "desc" });
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
    if (!confirm("Are you sure you want to permanently delete these items? This action cannot be undone.")) return;
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
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#133255]"
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

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="px-4 py-3 text-center w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-[18px] h-[18px] accent-[#133255] cursor-pointer" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Name / Details</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Deleted By</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Deleted At</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Expires In</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Trash is empty.</td>
              </tr>
            ) : filteredItems.map((item: any) => {
              const d = new Date(item.deletedAt);
              const expires = new Date(d.getTime() + 30 * 24 * 60 * 60 * 1000);
              const daysLeft = Math.max(0, Math.ceil((expires.getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
              return (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-blue-50">
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={selectedIds.has(item.id.toString())} onChange={() => toggleRow(item.id.toString())} className="w-[18px] h-[18px] accent-[#133255] cursor-pointer" />
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-600">{item.type}</td>
                  <td className="px-4 py-3 font-semibold text-[#133255]">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.deletedBy || "Unknown"}</td>
                  <td className="px-4 py-3 text-gray-500">{d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${daysLeft <= 3 ? 'text-red-500' : 'text-gray-500'}`}>
                      {daysLeft} days
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination
          currentPage={_dt.currentPage}
          totalPages={_dt.totalPages}
          totalRows={_dt.totalRows}
          startIndex={_dt.startIndex}
          endIndex={_dt.endIndex}
          pageSize={_dt.pageSize}
          setPageSize={_dt.setPageSize}
          goToPage={_dt.goToPage}
          goToNextPage={_dt.goToNextPage}
          goToPrevPage={_dt.goToPrevPage}
        />
      </div>
    </div>
  );
}
