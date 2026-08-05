"use client";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { deleteMultipleFrameworksAction } from "@/actions";
import toast from "react-hot-toast";
import { AdvancedTable } from "@/components/ui/AdvancedTable";
import { useColumnPrefs, DEFAULT_FRAMEWORK_COLUMNS, ColumnDef } from "@/hooks/useColumnPrefs";
import { ColumnCustomizerPanel } from "@/components/ui/ColumnCustomizerPanel";
import { Search, Settings, Download } from "lucide-react";

type Metadata = { totalCount: number; totalPages: number; currentPage: number };

export default function FrameworksClient({
  data,
  metadata,
}: {
  data: any[];
  metadata: Metadata;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { columns, visibleColumns, isLoading: isColsLoading, setColumnWidth, reorderColumns, toggleColumn, resetToDefault } = useColumnPrefs("frameworkListCols", DEFAULT_FRAMEWORK_COLUMNS);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // URL-synced search with 500ms debounce
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

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
      if (searchInput !== current) {
        updateURL({ search: searchInput || null, page: "1" });
      }
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const sortKey = searchParams.get("sortKey") || "createdAt";
  const sortDir = (searchParams.get("sortDir") || "desc") as "asc" | "desc";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 50;

  const toggleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    updateURL({ sortKey: key, sortDir: newDir, page: "1" });
  };

  const allSelected = data.length > 0 && selectedIds.size === data.length;
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(data.map((f: any) => f.id)));
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
      setSelectedIds(new Set());
      setIsDeleteDialogOpen(false);
      toast.success("Frameworks deleted successfully");
      router.refresh();
    } catch {
      toast.error("Failed to delete frameworks");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportSelected = () => {
    const selected = data.filter(f => selectedIds.has(f.id));
    const headers = ["Name", "Industry", "Used In Mandates", "Last Modified"];
    const rows = selected.map(f => [f.name, f.industry || "", f.usedIn || 0, f.lastModified || ""].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `frameworks-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="text-[14px] text-gray-500 mb-1">Home / Frameworks</div>
          <h1 className="text-3xl font-serif font-bold text-[#133255] tracking-tight">
            Framework Templates
            <span className="text-sm font-sans font-normal text-gray-400 ml-3">({metadata.totalCount} templates)</span>
          </h1>
        </div>
      </div>

      {/* Action Bar */}
      <div className="neo-bar p-3 mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-[9px] text-sm focus:outline-none focus:border-[#133255] bg-white"
            placeholder="Search frameworks..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="h-10 w-10 neo-btn flex items-center justify-center text-gray-500 hover:text-[#133255]"
            title="Customize columns"
          >
            <Settings className="w-4 h-4" />
          </button>
          <Link href="/dashboard/frameworks/new" className="h-10 px-4 neo-btn-gold text-sm font-bold text-[#133255] flex items-center">
            + New Framework
          </Link>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 bg-[#0E2150] text-white rounded-[13px] px-5 py-3 mb-4 shadow-md">
          <div className="font-semibold text-sm">
            <b className="text-[#d7a33c]">{selectedIds.size}</b> selected
          </div>
          <div className="ml-auto flex gap-3">
            <button onClick={handleExportSelected} className="px-3 py-2 bg-emerald-600 text-white rounded-[9px] text-[14px] font-bold hover:bg-emerald-700 flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={() => setIsDeleteDialogOpen(true)} className="px-3 py-2 bg-red-500 text-white rounded-[9px] text-[14px] font-bold hover:brightness-105 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              Delete
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="text-[#a9b7da] font-semibold text-[15px] hover:text-white px-2">Clear</button>
          </div>
        </div>
      )}

      <div className="h-full flex flex-col min-h-[400px]">
        <AdvancedTable
          data={data}
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
          renderCell={(fw: any, col: ColumnDef) => {
            const totalCriteria = fw.categories?.reduce((s: number, c: any) => s + (c.criteria?.length ?? 0), 0) ?? 0;
            switch (col.key) {
              case "name": return <div className="font-semibold text-[#133255]">{fw.name}</div>;
              case "industry": return <div className="text-gray-600">{fw.industry || "—"}</div>;
              case "criteria": return <div className="text-gray-500">{totalCriteria}</div>;
              case "usedIn": return <div className="text-gray-500">{fw.usedIn} mandate{fw.usedIn !== 1 ? "s" : ""}</div>;
              case "lastModified": return <div className="text-gray-400 text-xs">{fw.lastModified || "—"}</div>;
              case "actions": return (
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <button className="px-3 py-1 bg-[#133255] text-white rounded text-xs font-bold" onClick={() => router.push("/dashboard/frameworks/" + fw.id)}>Edit</button>
                  <button className="px-3 py-1 neo-btn text-gray-500 text-xs font-bold">Clone</button>
                </div>
              );
              default: return <span className="text-gray-500">{fw[col.key] || "—"}</span>;
            }
          }}
          onRowClick={(fw: any) => router.push("/dashboard/frameworks/" + fw.id)}
          emptyState={
            <div className="py-20 flex flex-col items-center text-center">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mb-4 text-gray-200" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="8" width="48" height="48" rx="8" stroke="#d1d5db" strokeWidth="2" fill="none" />
                <path d="M20 20h24M20 28h24M20 36h16" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
                <circle cx="44" cy="44" r="10" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" />
                <path d="M44 40v4M44 48v.5" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No frameworks yet</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-xs">Create your first scoring framework to use in mandates. Frameworks define the criteria for evaluating candidates.</p>
              <Link href="/dashboard/frameworks/new" className="px-4 py-2 bg-[#133255] text-white rounded-md text-sm font-semibold hover:bg-[#1b4370] transition-colors">
                Create Framework
              </Link>
            </div>
          }
        />
      </div>

      {/* Column Customizer */}
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
                <button onClick={() => setIsDeleteDialogOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-[#4a5568] hover:bg-gray-100 transition-colors" disabled={isSubmitting}>
                  Cancel
                </button>
                <button onClick={handleDeleteSelected} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-red-600 text-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50" disabled={isSubmitting}>
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
