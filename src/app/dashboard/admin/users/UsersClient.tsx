"use client";
import { useState } from "react";
import { updatePlatformUserAction, deletePlatformUserAction } from "@/app/actions";
import { useRouter } from "next/navigation";

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
    if (!confirm("Are you sure you want to delete this user?")) return;
    await deletePlatformUserAction(id);
    setUsers(users.filter(u => u.id !== id));
  };

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

      <div className="bg-white border border-[#D4E0F0] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#D4E0F0] flex justify-end">
          <button onClick={() => {
            router.push('/dashboard/admin/users/new');
          }} className="px-4 py-2 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#0e3178]">
            + Add User
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f9fafc] border-b-2 border-[#D4E0F0]">
              <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Last Active</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[#D4E0F0] hover:bg-[#f9fafc]">
                <td className="px-4 py-3">
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
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-[13px] font-bold uppercase tracking-wider">{u.status || 'Active'}</span>
                </td>
                <td className="px-4 py-3 text-[#6b7a99] text-xs">
                  {u.lastActive ? new Date(u.lastActive).toLocaleString() : "Never"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEditClick(u)} className="px-2 py-1 border border-[#D4E0F0] text-[#6b7a99] rounded text-xs font-bold hover:bg-[#EBF2FB]">Edit</button>
                    <button onClick={() => handleDeleteClick(u.id)} className="px-2 py-1 border border-red-200 text-red-500 rounded text-xs font-bold hover:bg-red-50">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    </div>
  );
}
