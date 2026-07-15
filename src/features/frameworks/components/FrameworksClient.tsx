"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteMultipleFrameworksAction } from "@/actions";
import toast from "react-hot-toast";
import { useDataTable } from "@/hooks/useDataTable";
import { Pagination } from "@/components/DataTable/Pagination";
import { SortableHeader } from "@/components/DataTable/SortableHeader";

export default function FrameworksClient({ initialFrameworks }: { initialFrameworks: any[] }) {
  const router = useRouter();
  const [localFrameworks, setLocalFrameworks] = useState(initialFrameworks);

  const _dt = useDataTable({ data: localFrameworks, defaultSortKey: "name", defaultSortDir: "asc" });

  // Bulk Delete State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allSelected = _dt.paginatedData.length > 0 && selectedIds.size === _dt.paginatedData.length;
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(_dt.paginatedData.map((f: any) => f.id)));
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
      await deleteMultipleFrameworksAction(Array.from(selectedIds));
      setLocalFrameworks(localFrameworks.filter(f => !selectedIds.has(f.id)));
      setSelectedIds(new Set());
      setIsDeleteDialogOpen(false);
      toast.success("Frameworks deleted successfully");
    } catch (e: any) {
      toast.error("Failed to delete frameworks");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="text-[14px] text-gray-500 mb-1">Home / Frameworks</div>
          <h1 className="text-3xl font-serif font-bold text-[#133255] tracking-tight">Framework Templates</h1>
        </div>
        <Link href="/dashboard/frameworks/new" className="px-5 py-2.5 bg-[#D8B15B] text-[#133255] rounded-lg text-sm font-bold shadow-sm hover:bg-[#e8c97a] transition-colors inline-block mb-1">
          + New Framework
        </Link>
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
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="px-4 py-3 text-center w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-[18px] h-[18px] accent-[#133255] cursor-pointer" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Industry</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Criteria #</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Used In</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Last Modified</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {_dt.paginatedData.map((fw: any) => {
              const totalCriteria = fw.categories.reduce((s: number, c: any) => s + c.criteria.length, 0);
              return (
                <tr key={fw.id} className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer" onClick={() => router.push("/dashboard/frameworks/" + fw.id)}>
                  <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(fw.id)} onChange={() => toggleRow(fw.id)} className="w-[18px] h-[18px] accent-[#133255] cursor-pointer" />
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#133255]">{fw.name}</td>
                  <td className="px-4 py-3 text-gray-600">{fw.industry}</td>
                  <td className="px-4 py-3 text-gray-500">{totalCriteria}</td>
                  <td className="px-4 py-3 text-gray-500">{fw.usedIn} mandates</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{fw.lastModified}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255]" onClick={() => router.push("/dashboard/frameworks/" + fw.id)}>Edit</button>
                      <button className="px-3 py-1 border border-gray-200 text-gray-500 rounded text-xs font-bold hover:bg-gray-50">Clone</button>
                    </div>
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

      {/* Delete Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#133255]/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[20px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="font-serif text-[21px] font-bold text-gray-900 mb-2">Delete Frameworks</h3>
              <p className="text-[#4a5568] text-sm">
                Are you sure you want to delete <b className="text-red-600">{selectedIds.size}</b> framework{selectedIds.size > 1 ? "s" : ""}? This action cannot be undone. All associated data will be permanently removed.
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
