"use client";
import { useState } from "react";
import { DATA } from "@/db/mockData";
import { addPlatformUserAction } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function SettingsClient({ initialUsers }: { initialUsers: any[] }) {
  const router = useRouter();
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState(initialUsers);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "consultant" });

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Platform Settings</h1>
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[["users","User Management"],["master","Master Data"]].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={"px-4 py-2.5 text-sm font-bold border-b-2 transition-colors " + (tab === t ? "border-[#133255] text-[#133255]" : "border-transparent text-gray-400 hover:text-gray-700")}>
            {label}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 flex justify-end">
            <button onClick={() => setIsAdding(true)} className="px-4 py-2 bg-yellow-500 text-[#133255] rounded text-xs font-bold hover:bg-yellow-400">+ Add User</button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Last Login</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Actions</th>
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-[#133255] text-white flex items-center justify-center text-xs font-bold">{u.initials}</div>
                      <span className="font-semibold text-gray-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={"px-2 py-0.5 rounded-full text-xs font-bold capitalize " + (u.role === "admin" ? "bg-red-100 text-red-800" : u.role === "management" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-[#133255]")}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-bold">{u.status}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{u.lastLogin}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-2 py-1 border border-gray-200 text-gray-500 rounded text-xs font-bold hover:bg-gray-50">Edit</button>
                      <button className="px-2 py-1 border border-red-200 text-red-500 rounded text-xs font-bold hover:bg-red-50">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "master" && (
        <div className="grid grid-cols-2 gap-6">
          {Object.entries(DATA.masterData).map(([key, items]) => (
            <div key={key} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 text-sm mb-4 capitalize">{key.replace(/([A-Z])/g, " $1")}</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {(items as string[]).map((item) => (
                  <div key={item} className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded px-2 py-1">
                    <span className="text-xs text-gray-700">{item}</span>
                    <button className="text-red-400 hover:text-red-600 text-sm font-bold ml-1">x</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Add new item..." className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-[#133255]"/>
                <button className="px-3 py-1.5 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255]">Add</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[400px] overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900">Add New Platform User</div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!form.name || !form.email) return;
              
              const newId = await addPlatformUserAction(form);
              
              // Optimistically update
              setUsers([{
                id: newId,
                name: form.name,
                email: form.email,
                role: form.role,
                status: "Active",
                initials: form.name.substring(0, 2).toUpperCase(),
                lastLogin: "Never"
              }, ...users]);

              setIsAdding(false);
              setForm({ name: "", email: "", role: "consultant" });
              router.refresh();
            }} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Full Name *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-[#133255]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white">
                  <option value="consultant">Consultant</option>
                  <option value="admin">Admin</option>
                  <option value="management">Management</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255]">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}