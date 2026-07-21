"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Client, Mandate } from "@/db/schema";
import { Search } from "lucide-react";
import { updateClientAction, deleteMultipleClientsAction } from "@/actions";
import dynamic from "next/dynamic";
const ClientImportModal = dynamic(() => import("./ClientImportModal"), { ssr: false });
import { Upload, Plus, Download } from "lucide-react";
import toast from "react-hot-toast";
import { Pagination } from "@/components/DataTable/Pagination";
import { SortableHeader } from "@/components/DataTable/SortableHeader";

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
  const [verticalFilter, setVerticalFilter] = useState(searchParams.get("vertical") || "All industries");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "All status");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pageSize, setPageSize] = useState(Number(searchParams.get("pageSize")) || 50);

  const sortKey = searchParams.get("sortKey") || "createdAt";
  const sortDir = (searchParams.get("sortDir") || "desc") as "asc" | "desc";

  const [localClients, setLocalClients] = useState(initialClients);
  useEffect(() => {
    setLocalClients(initialClients);
  }, [initialClients]);

  const updateURL = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === "" || v === "All industries" || v === "All status") params.delete(k);
      else params.set(k, v);
    });
    if (!newParams.page) params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleSearchBlur = () => updateURL({ search });

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

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
        <div className="text-[14px] text-gray-500 mb-1">Home / Clients</div>
        <h1 className="text-3xl font-serif font-bold text-[#133255] mb-8 tracking-tight">Client Database</h1>

        {/* Action Bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
          type="text" 
          placeholder="Search by client or industry..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          onBlur={handleSearchBlur}
          onKeyDown={e => e.key === "Enter" && handleSearchBlur()}
          className="min-w-[250px] flex-1 pl-9 pr-4 h-10 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#133255] transition-colors"
        />
          </div>
          
          <select 
          value={verticalFilter} 
          onChange={e => { setVerticalFilter(e.target.value); updateURL({ vertical: e.target.value }); }} 
          className="px-4 h-10 border border-gray-200 rounded-lg text-sm bg-white outline-none hover:border-[#133255] transition-colors min-w-[180px]">
          <option value="All industries">All industries</option>
          {uniqueVerticals.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        
        <select 
          value={statusFilter} 
          onChange={e => { setStatusFilter(e.target.value); updateURL({ status: e.target.value }); }} 
          className="px-4 h-10 border border-gray-200 rounded-lg text-sm bg-white outline-none hover:border-[#133255] transition-colors min-w-[180px]">
          <option value="All status">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Lead">Lead</option>
        </select>

          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="h-10 px-4 rounded-lg bg-white border border-gray-200 text-gray-700 text-[13px] font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>

          <button 
            onClick={() => router.push('/dashboard/clients/new')}
            className="h-10 px-4 rounded-lg bg-[#D8B15B] text-[#133255] text-[13px] font-bold shadow-sm hover:bg-[#e8c97a] transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add client
          </button>
        </div>

        <ClientImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />

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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-4 text-center w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-[18px] h-[18px] accent-[#133255] cursor-pointer" />
                </th>
                <SortableHeader label="Client" colKey="name" sortKey={sortKey as string} sortDir={sortDir} toggleSort={toggleSort} />
                <SortableHeader label="Industry" colKey="vertical" sortKey={sortKey as string} sortDir={sortDir} toggleSort={toggleSort} />
                <th className="px-5 py-3.5 text-left text-[12px] font-bold text-gray-400 uppercase tracking-wider">Owner</th>
                <th className="px-5 py-3.5 text-left text-[12px] font-bold text-gray-400 uppercase tracking-wider">Live Mandates</th>
                <SortableHeader label="Status" colKey="status" sortKey={sortKey as string} sortDir={sortDir} toggleSort={toggleSort} />
                <th className="px-5 py-3.5 text-left text-[12px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/clients/${c.id}`)}>
                  <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleRow(c.id)} className="w-[18px] h-[18px] accent-[#133255] cursor-pointer" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-[15px] text-gray-900">{c.name}</div>
                    <div className="text-[13px] text-gray-400">{c.accountId}</div>
                  </td>
                  <td className="px-6 py-4 text-[15px] text-gray-600">{c.vertical || "-"}</td>
                  <td className="px-6 py-4 text-[15px] text-gray-600">{c.owner || "-"}</td>
                    <td className="px-5 py-4">
                      <div className="text-[14px] text-gray-600 font-medium">
                        {getLiveMandatesCount(c)}
                      </div>
                    </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={c.status || "Active"}
                      onChange={(e) => handleStatusChange(c.id, e.target.value)}
                      className={`px-2 py-1 text-[13px] font-bold rounded outline-none border cursor-pointer ${
                        c.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' :
                        c.status === 'Prospect' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }`}
                    >
                      <option value="Active" className="bg-white text-gray-900">Active</option>
                      <option value="Prospect" className="bg-white text-gray-900">Prospect</option>
                      <option value="Inactive" className="bg-white text-gray-900">Inactive</option>
                    </select>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/clients/${c.id}`} className="px-3 py-1.5 text-[13px] font-bold text-[#133255] border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                        View
                      </Link>
                      <Link href={`/dashboard/mandates/new?company=${encodeURIComponent(c.name)}`} className="px-3 py-1.5 text-[13px] font-bold text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1">
                        + Mandate
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {totalRows === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">No clients found.</td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          totalRows={totalRows}
          goToNextPage={goToNextPage}
          goToPrevPage={goToPrevPage}
          pageSize={pageSize}
          setPageSize={handlePageSizeChange}
          goToPage={goToPage}
        />
        </div>

      {/* Delete Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#133255]/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[20px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="font-serif text-[21px] font-bold text-gray-900 mb-2">Delete Clients</h3>
              <p className="text-[#4a5568] text-sm mb-3">
                Are you sure you want to delete <b className="text-red-600">{selectedIds.size}</b> client{selectedIds.size > 1 ? "s" : ""}?
              </p>
              {attachedMandatesCount > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
                  <p className="text-red-800 text-sm font-semibold">
                    The client{selectedIds.size > 1 ? "s" : ""} you are trying to delete {selectedIds.size > 1 ? "have" : "has"} <b className="text-red-600">{attachedMandatesCount} mandate{attachedMandatesCount > 1 ? "s" : ""}</b> attached.
                  </p>
                  <p className="text-red-600 text-xs mt-1">
                    These mandates (and any float list entries associated with them) will also be deleted.
                  </p>
                </div>
              )}
              <p className="text-[#4a5568] text-sm">
                If you still wish to continue, click delete permanently.
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
