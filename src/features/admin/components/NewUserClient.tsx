"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addPlatformUserAction } from "@/actions";

export default function NewUserClient({ clients }: { clients: any[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", role: "consultant", linkedClientId: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setIsSubmitting(true);
    
    const payload: any = {
      name: form.name,
      email: form.email,
      role: form.role,
    };

    if (form.role === "client" && form.linkedClientId) {
      payload.linkedClientId = form.linkedClientId;
    }
    
    await addPlatformUserAction(payload);
    setIsSubmitting(false);
    router.push("/dashboard/admin/users");
  };

  return (
    <div className="max-w-screen-md mx-auto pb-10">
      <div className="text-[16px] text-gray-500 mb-1">Home / Admin / Users / New</div>
      <h1 className="text-3xl font-serif font-bold text-[#111] mb-8 tracking-tight">Add New User</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[15px] font-bold text-[#6b7a99] uppercase tracking-wider mb-2">Full Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-md text-[17px] outline-none focus:border-[#133255]" placeholder="John Doe" required />
              </div>
              <div>
                <label className="block text-[15px] font-bold text-[#6b7a99] uppercase tracking-wider mb-2">Email Address *</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-md text-[17px] outline-none focus:border-[#133255]" placeholder="john@example.com" required />
              </div>
            </div>

            <div>
              <label className="block text-[15px] font-bold text-[#6b7a99] uppercase tracking-wider mb-2">Role</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-md text-[17px] outline-none focus:border-[#133255]">
                <option value="admin">Admin</option>
                <option value="consultant">Consultant</option>
                <option value="client">Client</option>
                <option value="candidate">Candidate</option>
              </select>
            </div>

            {form.role === "client" && (
              <div>
                <label className="block text-[15px] font-bold text-[#6b7a99] uppercase tracking-wider mb-2">Link to Company</label>
                <select value={form.linkedClientId} onChange={e => setForm({...form, linkedClientId: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-md text-[17px] outline-none focus:border-[#133255]" required>
                  <option value="">Select Company...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {form.role === "candidate" && (
              <div className="bg-purple-50 text-purple-800 p-4 rounded-md text-[15px] font-medium border border-purple-100">
                A candidate profile will be auto-created for this user when they first log in.
              </div>
            )}
          </div>

          <div className="mt-10 flex justify-end gap-4 border-t border-gray-100 pt-6">
            <button type="button" onClick={() => router.back()} className="px-6 py-2.5 text-[17px] font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-md transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 text-[17px] font-bold bg-[#133255] text-white rounded-md hover:bg-[#0e3178] transition-colors disabled:opacity-50">
              {isSubmitting ? "Adding..." : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
