"use client";
import { confirmDialog } from "@/components/ConfirmDialog";

import { useState, useEffect, useCallback } from "react";
import { updatePlatformUserAction, deletePlatformUserAction, deleteMultiplePlatformUsersAction } from "@/actions";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { useColumnPrefs, DEFAULT_USER_COLUMNS, ColumnDef } from "@/hooks/useColumnPrefs";
import { AdvancedTable } from "@/components/ui/AdvancedTable";
import { ColumnCustomizerPanel } from "@/components/ui/ColumnCustomizerPanel";
import { Download, Upload, Settings, Search } from "lucide-react";
import dynamic from "next/dynamic";
const UserImportModal = dynamic(() => import("./UserImportModal"), { ssr: false });

type Metadata = { totalCount: number; totalPages: number; currentPage: number };

export default function UsersClient({ initialUsers, clients, metadata }: { initialUsers: any[], clients: any[], metadata: Metadata }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
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
      if (searchInput !== current) updateURL({ search: searchInput || null, page: "1" });
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

  const [users, setUsers] = useState(initialUsers);
  const [isAdding, setIsAdding] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    role: "consultant", 
    linkedClientId: "",
    bio: "",
    vertical: "",
    expertiseTags: "",
    linkedinUrl: "",
    consultantProfilePic: "",
  });

  const handleEditClick = (u: any) => {
    setForm({ 
      name: u.name || "", 
      email: u.email || "", 
      role: u.role || "consultant", 
      linkedClientId: u.linkedClientId || "",
      bio: u.bio || "",
      vertical: u.vertical || "",
      expertiseTags: Array.isArray(u.expertiseTags) ? u.expertiseTags.join(", ") : "",
      linkedinUrl: u.linkedinUrl || "",
      consultantProfilePic: u.consultantProfilePic || "",
    });
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

  const { columns, visibleColumns, isLoading: isColsLoading, setColumnWidth, reorderColumns, toggleColumn, resetToDefault } = useColumnPrefs("userListCols", DEFAULT_USER_COLUMNS);

  const adminCount = users.filter((u: any) => u.role === "admin").length;
  const consultantCount = users.filter((u: any) => u.role === "consultant").length;
  const clientUserCount = users.filter((u: any) => u.role === "client").length;

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
      <UserImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />

      {/* ── Page Header ───────────────────────────────────── */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[26px] font-serif font-bold text-[#133255] tracking-tight">
            User Management
          </h1>
          <p className="text-[13.5px] text-[#6b7a99] mt-1">
            {metadata.totalCount.toLocaleString()} total registered platform users
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
            <Upload size={15} /> Import Users
          </button>
          <button 
            onClick={() => router.push('/dashboard/admin/users/new')}
            className="h-10 px-5 neo-btn text-[#133255] text-[13.5px] font-bold transition-all flex items-center gap-2"
          >
            + Add User
          </button>
        </div>
      </div>

      {/* ── KPI Stat Cards ─────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { label: "Total Users", value: metadata.totalCount, color: "text-[#133255]" },
          { label: "Consultants", value: consultantCount, color: "text-[#2a44a0]" },
          { label: "Admins", value: adminCount, color: "text-[#c53030]" },
          { label: "Client Access", value: clientUserCount, color: "text-[#127a41]" },
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
              placeholder="Search by user name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 text-[14px] font-bold text-slate-800 bg-transparent outline-none placeholder-slate-400"
            />
          </div>
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

      <UserImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      <div className="h-full flex flex-col min-h-[400px]">
        <AdvancedTable
          data={users}
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
          renderCell={(u: any, col: ColumnDef) => {
            switch (col.key) {
              case "name": return (
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleEditClick(u)}>
                  <div className="w-8 h-8 neo-card-sm text-[#D8B15B] flex items-center justify-center text-xs font-bold font-serif" style={{ background: '#133255' }}>{u.initials}</div>
                  <span className="font-semibold text-[#111]">{u.name}</span>
                </div>
              );
              case "email": return <div className="text-[#6b7a99]">{u.email}</div>;
              case "role": return (
                <span className={`px-2.5 py-1 neo-card-sm text-[13px] font-bold uppercase tracking-wider ${
                  u.role === "admin" ? "text-[#C0392B]" : 
                  u.role === "consultant" ? "text-blue-800" :
                  u.role === "client" ? "text-green-800" :
                  "text-purple-800"
                }`}>{u.role}</span>
              );
              case "lastActive": return (
                <div className="text-[#6b7a99] text-xs" suppressHydrationWarning>
                  {u.lastActive ? new Date(u.lastActive).toLocaleString() : "Never"}
                </div>
              );
              default: return <span className="text-gray-500">{u[col.key] || "-"}</span>;
            }
          }}
          emptyState={
            <div className="py-16 text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-1">No users yet</h3>
              <p className="text-sm text-gray-500">Add your first team member.</p>
            </div>
          }
        />
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-[#0a1628]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-[500px] border border-[#D4E0F0] overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-[#D4E0F0] font-serif text-[19px] font-bold text-[#111]">
              Edit User Profile
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!form.name || !form.email || !editingUserId) return;
              
              const parsedTags = form.expertiseTags
                ? form.expertiseTags.split(",").map(t => t.trim()).filter(Boolean)
                : [];

              const payload: any = {
                name: form.name,
                email: form.email,
                role: form.role,
                bio: form.bio,
                vertical: form.vertical,
                expertiseTags: parsedTags,
                linkedinUrl: form.linkedinUrl,
                consultantProfilePic: form.consultantProfilePic,
              };

              if (form.role === "client") {
                payload.linkedClientId = form.linkedClientId || (clients[0]?.id || null);
              }
              
              await updatePlatformUserAction(editingUserId, payload);
              setUsers(users.map(u => u.id === editingUserId ? { ...u, ...payload } : u));
              
              setIsAdding(false);
              setEditingUserId(null);
              setForm({ 
                name: "", 
                email: "", 
                role: "consultant", 
                linkedClientId: "",
                bio: "",
                vertical: "",
                expertiseTags: "",
                linkedinUrl: "",
                consultantProfilePic: "",
              });
              toast.success("User profile updated successfully");
            }}>
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
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

                {(form.role === "consultant" || form.role === "admin") && (
                  <div className="border-t border-slate-200 pt-4 space-y-4">
                    <div className="text-xs font-bold text-[#133255] uppercase tracking-wider">
                      Consultant Public Directory Profile
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#6b7a99] uppercase tracking-wider mb-1">Industry Vertical</label>
                      <input type="text" value={form.vertical} onChange={e => setForm({...form, vertical: e.target.value})} className="w-full px-3 py-2 border-[1.5px] border-[#D4E0F0] rounded-md text-sm outline-none focus:border-[#133255]" placeholder="e.g. BFSI & FinTech, Tech Leadership" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#6b7a99] uppercase tracking-wider mb-1">Expertise Tags (comma-separated)</label>
                      <input type="text" value={form.expertiseTags} onChange={e => setForm({...form, expertiseTags: e.target.value})} className="w-full px-3 py-2 border-[1.5px] border-[#D4E0F0] rounded-md text-sm outline-none focus:border-[#133255]" placeholder="C-Suite Search, Board Services, Private Equity" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#6b7a99] uppercase tracking-wider mb-1">Bio / Executive Summary</label>
                      <textarea rows={3} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} className="w-full px-3 py-2 border-[1.5px] border-[#D4E0F0] rounded-md text-sm outline-none focus:border-[#133255]" placeholder="Lead consultant with 10+ years executive search experience..." />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#6b7a99] uppercase tracking-wider mb-1">LinkedIn Profile URL</label>
                      <input type="url" value={form.linkedinUrl} onChange={e => setForm({...form, linkedinUrl: e.target.value})} className="w-full px-3 py-2 border-[1.5px] border-[#D4E0F0] rounded-md text-sm outline-none focus:border-[#133255]" placeholder="https://linkedin.com/in/..." />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#6b7a99] uppercase tracking-wider mb-1">Profile Picture URL</label>
                      <input type="text" value={form.consultantProfilePic} onChange={e => setForm({...form, consultantProfilePic: e.target.value})} className="w-full px-3 py-2 border-[1.5px] border-[#D4E0F0] rounded-md text-sm outline-none focus:border-[#133255]" placeholder="https://... or base64 image string" />
                    </div>
                  </div>
                )}

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
