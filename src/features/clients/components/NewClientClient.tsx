"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientAction } from "@/actions";

export default function NewClientClient({ industries = [] }: { industries?: any[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", accountId: "", vertical: "", owner: "", status: "Active" });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await createClientAction(form);
    setIsSubmitting(false);
    router.push("/dashboard/clients");
  };

  return (
    <div className="max-w-screen-md mx-auto pb-10">
      <div className="text-[14px] text-gray-500 mb-1">Home / Clients / New</div>
      <h1 className="text-3xl font-serif font-bold text-[#133255] mb-8 tracking-tight">Add New Client</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleAddSubmit} className="p-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Company Name *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-md text-[15px] outline-none focus:border-[#133255]" placeholder="e.g. Finova Tech"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Account ID</label>
                <input value={form.accountId} onChange={e => setForm({...form, accountId: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-md text-[15px] outline-none focus:border-[#133255]" placeholder="e.g. ACC-101"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Vertical</label>
                <input list="industry-suggestions" value={form.vertical} onChange={e => setForm({...form, vertical: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-md text-[15px] outline-none focus:border-[#133255]" placeholder="e.g. Financial services"/>
                <datalist id="industry-suggestions">
                  {industries.map((ind: any) => (
                    <option key={ind.id} value={ind.standardizedIndustry || ind.rawEntry} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Owner</label>
                <input value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-md text-[15px] outline-none focus:border-[#133255]" placeholder="e.g. Sahil Bhatia"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-md text-[15px] outline-none focus:border-[#133255]">
                <option value="Active">Active</option>
                <option value="Prospect">Prospect</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-10 flex justify-end gap-4 border-t border-gray-100 pt-6">
            <button type="button" onClick={() => router.back()} className="px-6 py-2.5 text-[15px] font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-md transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 text-[15px] font-bold bg-[#D8B15B] text-[#133255] rounded-md hover:bg-[#e8c97a] transition-colors disabled:opacity-50">
              {isSubmitting ? "Saving..." : "Save Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
