"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Client, Mandate } from "@/db/schema";
import { Search } from "lucide-react";
import { createClientAction } from "@/app/actions";

export default function ClientsClient({ clients, mandates }: { clients: Client[], mandates: Mandate[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [verticalFilter, setVerticalFilter] = useState("All verticals");
  const [statusFilter, setStatusFilter] = useState("All status");

  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", accountId: "", vertical: "", owner: "", status: "Active" });

  const filteredClients = clients.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !(c.vertical && c.vertical.toLowerCase().includes(search.toLowerCase()))) return false;
    if (verticalFilter !== "All verticals" && c.vertical !== verticalFilter) return false;
    if (statusFilter !== "All status" && c.status !== statusFilter) return false;
    return true;
  });

  const getLiveMandatesCount = (clientName: string) => {
    return mandates.filter(m => m.company === clientName && m.status !== 'Closed' && m.status !== 'Lost').length;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await createClientAction(form);
    setIsSubmitting(false);
    setIsAdding(false);
    setForm({ name: "", accountId: "", vertical: "", owner: "", status: "Active" });
  };

  const verticals = Array.from(new Set(clients.map(c => c.vertical).filter(Boolean))) as string[];
  const statuses = Array.from(new Set(clients.map(c => c.status).filter(Boolean))) as string[];

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
        <div className="text-[12px] text-gray-500 mb-1">Home / Clients</div>
        <h1 className="text-3xl font-serif font-bold text-[#133255] mb-8 tracking-tight">Client database</h1>

        {/* Action Bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, vertical..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-md border border-gray-200 text-sm outline-none focus:border-[#133255] transition-colors"
            />
          </div>
          
          <select 
            value={verticalFilter} 
            onChange={e => setVerticalFilter(e.target.value)}
            className="h-10 px-4 rounded-md border border-gray-200 text-sm bg-white outline-none cursor-pointer focus:border-[#133255]"
          >
            <option value="All verticals">All verticals</option>
            {verticals.map(v => <option key={v} value={v}>{v}</option>)}
          </select>

          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="h-10 px-4 rounded-md border border-gray-200 text-sm bg-white outline-none cursor-pointer focus:border-[#133255]"
          >
            <option value="All status">All status</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <button 
            onClick={() => setIsAdding(true)}
            className="h-10 px-6 rounded-md bg-[#D8B15B] text-[#133255] text-sm font-bold shadow-sm hover:bg-[#e8c97a] transition-colors flex items-center gap-2"
          >
            + Add client
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vertical</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Live Mandates</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-[13px] text-gray-900">{c.name}</div>
                    <div className="text-[11px] text-gray-400">{c.accountId}</div>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-gray-600">{c.vertical || "-"}</td>
                  <td className="px-6 py-4 text-[13px] font-semibold text-gray-900">{getLiveMandatesCount(c.name)}</td>
                  <td className="px-6 py-4 text-[13px] text-gray-600">{c.owner || "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[11px] font-bold rounded-full flex items-center gap-1.5 w-fit ${c.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/clients/${c.id}`} className="px-3 py-1.5 text-[11px] font-bold text-[#133255] border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                        View
                      </Link>
                      <Link href={`/dashboard/mandates/new?company=${encodeURIComponent(c.name)}`} className="px-3 py-1.5 text-[11px] font-bold text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1">
                        + Mandate
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No clients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      {/* Add Client Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#133255]/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-[#133255]">Add New Client</h2>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Company Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]" placeholder="e.g. Finova Tech"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Account ID</label>
                  <input value={form.accountId} onChange={e => setForm({...form, accountId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]" placeholder="e.g. ACC-101"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Vertical</label>
                  <input value={form.vertical} onChange={e => setForm({...form, vertical: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]" placeholder="e.g. Financial services"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Owner</label>
                  <input value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]" placeholder="e.g. Sahil Bhatia"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]">
                    <option value="Active">Active</option>
                    <option value="Prospect">Prospect</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-md transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-bold bg-[#133255] text-white rounded-md hover:bg-[#0c203b] transition-colors disabled:opacity-50">
                  {isSubmitting ? "Saving..." : "Save Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
