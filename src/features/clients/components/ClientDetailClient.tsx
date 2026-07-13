"use client";
import { confirmDialog } from "@/components/ConfirmDialog";


import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Client, Mandate } from "@/db/schema";
import { ArrowLeft, Building2, User, Briefcase, Calendar, Trash2, Edit } from "lucide-react";
import { updateClientAction, deleteClientAction } from "@/actions";

export default function ClientDetailClient({ client, mandates }: { client: Client, mandates: Mandate[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ 
    name: client.name, 
    accountId: client.accountId || "", 
    vertical: client.vertical || "", 
    owner: client.owner || "", 
    status: client.status || "Active" 
  });

  const activeMandates = mandates.filter(m => m.status !== 'Closed' && m.status !== 'Lost');
  const completedMandates = mandates.filter(m => m.status === 'Closed' || m.status === 'Lost');

  const displayedMandates = activeTab === "active" ? activeMandates : completedMandates;

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await updateClientAction(client.id, form);
    setIsSubmitting(false);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (await confirmDialog("Are you sure you want to delete this client?")) {
      await deleteClientAction(client.id);
      router.push("/dashboard/clients");
    }
  };

  return (
    <div className="flex-1 p-8 bg-[#f4f7fd] min-h-screen font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/dashboard/clients" className="text-gray-500 hover:text-[#133255] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="text-[14px] text-gray-500">Home / Clients / {client.name}</div>
        </div>

        {/* Client Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8 flex items-start justify-between">
          <div className="flex gap-6 items-center">
            <div className="w-20 h-20 bg-blue-50 text-[#133255] rounded-xl flex items-center justify-center border border-blue-100">
              <Building2 className="w-10 h-10" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-serif font-bold text-[#133255]">{client.name}</h1>
                <span className={`px-2.5 py-1 text-[13px] font-bold rounded-full border ${client.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                  {client.status}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500 font-medium">
                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {client.accountId || "No Account ID"}</span>
                <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {client.vertical || "No Vertical"}</span>
                <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {client.owner || "No Owner"}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(client.createdAt!).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setIsEditing(true)} className="px-4 py-2 border border-gray-200 rounded-md text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Edit className="w-4 h-4" /> Edit
            </button>
            <button onClick={handleDelete} className="px-4 py-2 border border-red-200 bg-red-50 rounded-md text-sm font-bold text-red-600 hover:bg-red-100 transition-colors flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>

        {/* Mandates Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100 px-6">
            <button 
              onClick={() => setActiveTab("active")}
              className={`py-4 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'active' ? 'border-[#133255] text-[#133255]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
            >
              Active Mandates ({activeMandates.length})
            </button>
            <button 
              onClick={() => setActiveTab("completed")}
              className={`py-4 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'completed' ? 'border-[#133255] text-[#133255]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
            >
              Completed / Lost ({completedMandates.length})
            </button>
          </div>

          {/* Mandates List */}
          <div className="p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Consultant</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Opened</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedMandates.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[15px] text-gray-900">{m.role}</td>
                    <td className="px-6 py-4 text-[15px] text-gray-600 capitalize">{m.status}</td>
                    <td className="px-6 py-4 text-[15px] text-gray-600">{m.geography || "-"}</td>
                    <td className="px-6 py-4 text-[15px] text-gray-600">{m.consultant || "-"}</td>
                    <td className="px-6 py-4 text-[15px] text-gray-600">{m.opened || "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/mandates/${m.id}`} className="text-[14px] font-bold text-[#133255] hover:underline">
                        View Mandate
                      </Link>
                    </td>
                  </tr>
                ))}
                {displayedMandates.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                      No {activeTab} mandates found for {client.name}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Client Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#133255]/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-[#133255]">Edit Client</h2>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Company Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Account ID</label>
                  <input value={form.accountId} onChange={e => setForm({...form, accountId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Vertical</label>
                  <input value={form.vertical} onChange={e => setForm({...form, vertical: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Owner</label>
                  <input value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]" />
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
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-md transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-bold bg-[#133255] text-white rounded-md hover:bg-[#0c203b] transition-colors disabled:opacity-50">
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
