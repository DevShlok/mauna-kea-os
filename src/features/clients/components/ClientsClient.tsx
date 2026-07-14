"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Client, Mandate } from "@/db/schema";
import { Search } from "lucide-react";
import { updateClientAction } from "@/actions";
import ClientImportModal from "./ClientImportModal";
import { Upload } from "lucide-react";

export default function ClientsClient({ clients, mandates }: { clients: Client[], mandates: Mandate[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [verticalFilter, setVerticalFilter] = useState("All verticals");
  const [statusFilter, setStatusFilter] = useState("All status");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [localClients, setLocalClients] = useState(clients);
  useEffect(() => {
    setLocalClients(clients);
  }, [clients]);


  const filteredClients = localClients.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !(c.vertical && c.vertical.toLowerCase().includes(search.toLowerCase()))) return false;
    if (verticalFilter !== "All verticals" && c.vertical !== verticalFilter) return false;
    if (statusFilter !== "All status" && c.status !== statusFilter) return false;
    return true;
  });

  const getLiveMandatesCount = (clientName: string) => {
    return mandates.filter(m => m.company === clientName && m.status !== 'Closed' && m.status !== 'Lost').length;
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setLocalClients(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    await updateClientAction(id, { status: newStatus });
    router.refresh();
  };


  const verticals = Array.from(new Set(clients.map(c => c.vertical).filter(Boolean))) as string[];
  const statuses = Array.from(new Set(clients.map(c => c.status).filter(Boolean))) as string[];

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
            onClick={() => setIsImportModalOpen(true)}
            className="h-10 px-4 rounded-md bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>

          <button 
            onClick={() => router.push('/dashboard/clients/new')}
            className="h-10 px-6 rounded-md bg-[#D8B15B] text-[#133255] text-sm font-bold shadow-sm hover:bg-[#e8c97a] transition-colors flex items-center gap-2"
          >
            + Add client
          </button>
        </div>

        <ClientImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Account</th>
                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Vertical</th>
                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Live Mandates</th>
                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-[15px] text-gray-900">{c.name}</div>
                    <div className="text-[13px] text-gray-400">{c.accountId}</div>
                  </td>
                  <td className="px-6 py-4 text-[15px] text-gray-600">{c.vertical || "-"}</td>
                  <td className="px-6 py-4 text-[15px] font-semibold text-gray-900">{getLiveMandatesCount(c.name)}</td>
                  <td className="px-6 py-4 text-[15px] text-gray-600">{c.owner || "-"}</td>
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
                  <td className="px-6 py-4">
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
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No clients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


    </div>
  );
}
