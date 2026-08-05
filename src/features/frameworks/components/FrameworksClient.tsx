"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteMultipleFrameworksAction } from "@/actions";
import toast from "react-hot-toast";
import { AdvancedTable } from "@/components/ui/AdvancedTable";
import { useColumnPrefs, DEFAULT_FRAMEWORK_COLUMNS, ColumnDef } from "@/hooks/useColumnPrefs";


export default function FrameworksClient({ initialFrameworks }: { initialFrameworks: any[] }) {
  const router = useRouter();
  const [localFrameworks, setLocalFrameworks] = useState(initialFrameworks);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const { columns, visibleColumns, isLoading: isColsLoading, setColumnWidth, reorderColumns } = useColumnPrefs("frameworkListCols", DEFAULT_FRAMEWORK_COLUMNS);

  const totalRows = localFrameworks.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const paginatedData = localFrameworks.slice((page - 1) * pageSize, page * pageSize);

  // Bulk Delete State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allSelected = paginatedData.length > 0 && selectedIds.size === paginatedData.length;
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedData.map((f: any) => f.id)));
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
        <Link href="/dashboard/frameworks/new" className="px-5 py-2.5 neo-btn-gold text-sm font-bold text-[#133255] inline-block mb-1">
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

      <div className="h-full flex flex-col min-h-[400px]">
        <AdvancedTable
          data={paginatedData}
          total={totalRows}
          columns={columns}
          page={page}
          pageSize={pageSize}
          setPageSize={(s) => { setPageSize(s); setPage(1); }}
          setPage={setPage}
          sortKey="name"
          sortDir="asc"
          onSort={() => {}}
          visibleColumns={visibleColumns}
          setColumnWidth={setColumnWidth}
          reorderColumns={reorderColumns}
          isLoadingCols={isColsLoading}
          selectedIds={selectedIds}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          renderCell={(fw: any, col: ColumnDef) => {
            const totalCriteria = fw.categories?.reduce((s: number, c: any) => s + c.criteria.length, 0) ?? 0;
            switch (col.key) {
              case "name": return <div className="font-semibold text-[#133255]">{fw.name}</div>;
              case "industry": return <div className="text-gray-600">{fw.industry}</div>;
              case "criteria": return <div className="text-gray-500">{totalCriteria}</div>;
              case "usedIn": return <div className="text-gray-500">{fw.usedIn} mandates</div>;
              case "lastModified": return <div className="text-gray-400 text-xs">{fw.lastModified}</div>;
              case "actions": return (
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <button className="px-3 py-1 bg-[#133255] text-white rounded text-xs font-bold" onClick={() => router.push("/dashboard/frameworks/" + fw.id)}>Edit</button>
                  <button className="px-3 py-1 neo-btn text-gray-500 text-xs font-bold">Clone</button>
                </div>
              );
              default: return <span className="text-gray-500">{fw[col.key] || "-"}</span>;
            }
          }}
          onRowClick={(fw: any) => router.push("/dashboard/frameworks/" + fw.id)}
          emptyState={
            <div className="py-16 text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-1">No frameworks yet</h3>
              <p className="text-sm text-gray-500">Create your first framework template.</p>
            </div>
          }
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
