"use client";
import { confirmDialog } from "@/components/ConfirmDialog";

import { useState } from "react";
import { updatePlatformUserAction, deletePlatformUserAction, deleteMultiplePlatformUsersAction } from "@/actions";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useDataTable } from "@/hooks/useDataTable";
import { Pagination } from "@/components/DataTable/Pagination";
import { Download, Upload } from "lucide-react";
import dynamic from "next/dynamic";
const UserImportModal = dynamic(() => import("./UserImportModal"), { ssr: false });

export default function UsersClient({ initialUsers, clients }: { initialUsers: any[], clients: any[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [isAdding, setIsAdding] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "consultant", linkedClientId: "" });

  const handleEditClick = (u: any) => {
    setForm({ name: u.name, email: u.email, role: u.role, linkedClientId: u.linkedClientId || "" });
    setEditingUserId(u.id);
    setIsAdding(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!await confirmDialog("Are you sure you want to delete this user?")) return;
    await deletePlatformUserAction(id);
    setUsers(users.filter(u => u.id !== id));
  };

  // Bulk Delete State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allSelected = users.length > 0 && selectedIds.size === users.length;
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(users.map(u => u.id)));
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
      await deleteMultiplePlatformUsersAction(Array.from(selectedIds));
      setUsers(users.filter(u => !selectedIds.has(u.id)));
      setSelectedIds(new Set());
      setIsDeleteDialogOpen(false);
      toast.success("Users deleted successfully");
    } catch (e: any) {
      toast.error("Failed to delete users");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportSelected = () => {
    const selected = users.filter(u => selectedIds.has(u.id));
    if (selected.length === 0) return;
    const headers = ["Name", "Email", "Role", "Last Active"];
    const rows = selected.map(u => [
      u.name || "-", 
      u.email || "-", 
      u.role || "-", 
      u.lastActive ? new Date(u.lastActive).toLocaleString() : "-"
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const _dt = useDataTable({ data: users, defaultSortKey: "name", defaultSortDir: "asc" });

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
          <span className="text-[#133255]">Admin</span>
          <span>/</span>
          <span>Users</span>
        </div>
        <h1 className="text-[29px] font-serif font-bold text-[#111]">User Management</h1>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 bg-[#0E2150] text-white rounded-[13px] px-5 py-3 mb-4 shadow-md transition-all">
          <div className="font-semibold text-sm">
            <b className="text-[#d7a33c]">{selectedIds.size}</b> selected
          </div>
          <div className="ml-auto flex gap-3">
            <button onClick={handleExportSelected} className="px-3 py-2 bg-emerald-600 text-white rounded-[9px] text-[15px] font-bold shadow-md hover:brightness-105 flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Export
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

      <div className="bg-white border border-[#D4E0F0] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#D4E0F0] flex justify-end gap-3">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="h-9 px-4 bg-white border border-gray-200 text-gray-700 rounded text-xs font-bold hover:bg-gray-50 flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Import Users
          </button>
          <button onClick={() => {
            router.push('/dashboard/admin/users/new');
          }} className="px-4 py-2 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#0e3178]">
            + Add User
          </button>
        </div>
        <UserImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f9fafc] border-b-2 border-[#D4E0F0]">
              <th className="px-4 py-3 text-center w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-[18px] h-[18px] accent-[#133255] cursor-pointer" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {_dt.paginatedData.map((u) => (
              <tr key={u.id} className="border-b border-[#D4E0F0] hover:bg-[#f9fafc]">
                <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleRow(u.id)} className="w-[18px] h-[18px] accent-[#133255] cursor-pointer" />
                </td>
                <td className="px-4 py-3 cursor-pointer" onClick={() => handleEditClick(u)}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-[#133255] text-[#D8B15B] flex items-center justify-center text-xs font-bold font-serif">{u.initials}</div>
                    <span className="font-semibold text-[#111]">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#6b7a99]">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-[13px] font-bold uppercase tracking-wider ${
                    u.role === "admin" ? "bg-[#fde8e8] text-[#C0392B]" : 
                    u.role === "consultant" ? "bg-blue-100 text-blue-800" :
                    u.role === "client" ? "bg-green-100 text-green-800" :
                    "bg-purple-100 text-purple-800"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#6b7a99] text-xs" suppressHydrationWarning>
                  {u.lastActive ? new Date(u.lastActive).toLocaleString() : "Never"}
                </td>
              </tr>
            ))}
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

      {isAdding && (
        <div className="fixed inset-0 bg-[#0a1628]/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[400px] border border-[#D4E0F0] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D4E0F0] font-serif text-[19px] font-bold text-[#111]">
              Edit User
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!form.name || !form.email || !editingUserId) return;
              
              const payload: any = {
                name: form.name,
                email: form.email,
                role: form.role,
              };

              if (form.role === "client" && form.linkedClientId) {
                payload.linkedClientId = form.linkedClientId;
              }
              
              await updatePlatformUserAction(editingUserId, payload);
              setUsers(users.map(u => u.id === editingUserId ? { ...u, ...payload } : u));
              
              setIsAdding(false);
              setEditingUserId(null);
              setForm({ name: "", email: "", role: "consultant", linkedClientId: "" });
            }}>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#6b7a99] uppercase tracking-wider mb-1">Full Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border-[1.5px] border-[#D4E0F0] rounded-md text-sm outline-none focus:border-[#133255]" placeholder="John Doe" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6b7a99] uppercase tracking-wider mb-1">Email Address</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border-[1.5px] border-[#D4E0F0] rounded-md text-sm outline-none focus:border-[#133255]" placeholder="john@example.com" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6b7a99] uppercase tracking-wider mb-1">Role</label>
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 border-[1.5px] border-[#D4E0F0] rounded-md text-sm outline-none focus:border-[#133255]">
                    <option value="admin">Admin</option>
                    <option value="consultant">Consultant</option>
                    <option value="client">Client</option>
                    <option value="candidate">Candidate</option>
                  </select>
                </div>

                {form.role === "client" && (
                  <div>
                    <label className="block text-xs font-bold text-[#6b7a99] uppercase tracking-wider mb-1">Link to Company</label>
                    <select value={form.linkedClientId} onChange={e => setForm({...form, linkedClientId: e.target.value})} className="w-full px-3 py-2 border-[1.5px] border-[#D4E0F0] rounded-md text-sm outline-none focus:border-[#133255]" required>
                      <option value="">Select Company...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {form.role === "candidate" && (
                  <div className="bg-purple-50 text-purple-800 p-3 rounded-md text-xs font-medium border border-purple-100">
                    A candidate profile will be auto-created for this user when they first log in.
                  </div>
                )}
              </div>
              <div className="px-5 py-4 bg-[#f9fafc] border-t border-[#D4E0F0] flex justify-end gap-2">
                <button type="button" onClick={() => {
                  setIsAdding(false);
                  setEditingUserId(null);
                }} className="px-4 py-2 text-sm font-bold text-[#6b7a99] hover:text-[#111]">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#133255] text-white rounded text-sm font-bold hover:bg-[#0e3178]">Update User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#133255]/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[20px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="font-serif text-[21px] font-bold text-gray-900 mb-2">Delete Users</h3>
              <p className="text-[#4a5568] text-sm">
                Are you sure you want to delete <b className="text-red-600">{selectedIds.size}</b> user{selectedIds.size > 1 ? "s" : ""}? This action cannot be undone. All associated data will be permanently removed.
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
