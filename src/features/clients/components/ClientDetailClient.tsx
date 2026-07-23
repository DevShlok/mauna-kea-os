"use client";
import { confirmDialog } from "@/components/ConfirmDialog";


import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Client, Mandate } from "@/db/schema";
import { ArrowLeft, Building2, User, Briefcase, Calendar, Trash2, Edit, Upload, Plus } from "lucide-react";
import { updateClientAction, deleteClientAction } from "@/actions";
import dynamic from "next/dynamic";
const MandateImportModal = dynamic(() => import("@/features/mandates/components/MandateImportModal"), { ssr: false });

export default function ClientDetailClient({ client, mandates, industries = [], associatedCandidates = [], currentUser }: { client: any, mandates: any[], industries?: any[], associatedCandidates?: any[], currentUser: { name: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [isEditing, setIsEditing] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ 
    name: client.name, 
    accountId: client.accountId || "", 
    vertical: client.vertical || "", 
    owner: client.owner || "", 
    status: client.status || "Active", 
    legalEntityName: client.legalEntityName || "" 
  });
  const [contacts, setContacts] = useState<{name: string, designation: string, number: string, email: string}[]>(client.contacts || []);

  const activeMandates = mandates.filter(m => m.status !== 'Closed' && m.status !== 'Lost');
  const completedMandates = mandates.filter(m => m.status === 'Closed' || m.status === 'Lost');

  const displayedMandates = activeTab === "active" ? activeMandates : completedMandates;

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await updateClientAction(client.id, { ...form, contacts });
    setIsSubmitting(false);
    setIsEditing(false);
  };

  const updateContact = (index: number, field: string, value: string) => {
    const newContacts = [...contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setContacts(newContacts);
  };

  const addContact = () => {
    setContacts([...contacts, {name: "", designation: "", number: "", email: ""}]);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex gap-6 items-center">
            <div className="w-20 h-20 bg-blue-50 text-[#133255] rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
              <Building2 className="w-10 h-10" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-serif font-bold text-[#133255] break-words">{client.name}</h1>
                <span className={`px-2.5 py-1 text-[13px] font-bold rounded-full border shrink-0 ${client.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                  {client.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 xl:gap-6 text-sm text-gray-500 font-medium">
                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 shrink-0" /> {client.accountId || "No Account ID"}</span>
                <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 shrink-0" /> {client.vertical || "No Industry"}</span>
                <span className="flex items-center gap-1.5"><User className="w-4 h-4 shrink-0" /> {client.owner || "No Account owner"}</span>
                <span className="flex items-center gap-1.5" suppressHydrationWarning><Calendar className="w-4 h-4 shrink-0" /> {new Date(client.createdAt!).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <Link href={`/dashboard/mandates/new?company=${encodeURIComponent(client.name)}`} className="h-8 px-3 bg-[#133255] text-white rounded-md text-xs font-bold hover:bg-[#133255]/90 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Add Mandate
            </Link>
            <button onClick={() => setIsImportModalOpen(true)} className="h-8 px-3 bg-[#D8B15B] rounded-md text-xs font-bold text-[#133255] hover:bg-[#e8c97a] transition-colors flex items-center justify-center gap-1.5 shadow-sm">
              <Upload className="w-3.5 h-3.5" /> Import Mandates
            </button>
            <button onClick={() => setIsEditing(true)} className="h-8 px-3 bg-gray-100 border border-gray-200 rounded-md text-xs font-bold text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={handleDelete} className="h-8 px-3 border border-red-200 bg-red-50 rounded-md text-xs font-bold text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>

        <MandateImportModal 
          isOpen={isImportModalOpen} 
          onClose={() => setIsImportModalOpen(false)} 
          clientId={client.id} 
          clientName={client.name} 
          currentUser={currentUser}
        />

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
                </tr>
              </thead>
              <tbody>
                {displayedMandates.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[15px] text-gray-900">
                      <Link href={`/dashboard/mandates/${m.id}`} className="text-[#133255] hover:underline">
                        {m.role}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-[15px] text-gray-600 capitalize">{m.status}</td>
                    <td className="px-6 py-4 text-[15px] text-gray-600">{m.geography || "-"}</td>
                    <td className="px-6 py-4 text-[15px] text-gray-600">{m.consultant || "-"}</td>
                    <td className="px-6 py-4 text-[15px] text-gray-600">{m.opened || "-"}</td>
                  </tr>
                ))}
                {displayedMandates.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                      No {activeTab} mandates found for {client.name}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client Contacts Display */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-[15px] font-bold text-[#133255]">Client Contacts</h2>
            <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-[#1d4ed8] hover:underline">Manage Contacts</button>
          </div>
          <div className="p-0">
            {(() => {
              const allContacts: any[] = [];
              (client.contacts || []).forEach((c: any) => {
                const associatedMandates = mandates.filter((m: any) => 
                  (c.email && m.pocEmail?.toLowerCase() === c.email.toLowerCase()) || 
                  (c.name && m.clientPOC?.toLowerCase() === c.name.toLowerCase())
                ).map((m: any) => ({ id: m.id, role: m.role }));
                
                const uniqueMandates = associatedMandates.filter((v: any, i: number, a: any[]) => a.findIndex(t => (t.id === v.id)) === i);
                
                allContacts.push({
                  ...c,
                  mandates: uniqueMandates
                });
              });

              mandates.forEach((m: any) => {
                if (!m.clientPOC && !m.pocEmail) return;
                const exists = allContacts.find(c => 
                  (m.pocEmail && c.email?.toLowerCase() === m.pocEmail.toLowerCase()) || 
                  (m.clientPOC && c.name?.toLowerCase() === m.clientPOC.toLowerCase())
                );
                
                if (exists) {
                  if (!exists.mandates.find((em: any) => em.id === m.id)) {
                    exists.mandates.push({ id: m.id, role: m.role });
                  }
                } else {
                  allContacts.push({
                    name: m.clientPOC || "-",
                    designation: "-",
                    number: m.pocPhone || "-",
                    email: m.pocEmail || "-",
                    mandates: [{ id: m.id, role: m.role }]
                  });
                }
              });

              return allContacts.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-6 py-3 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Designation</th>
                      <th className="px-6 py-3 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Mandates</th>
                      <th className="px-6 py-3 text-[12px] font-bold text-gray-400 uppercase tracking-wider text-right">Profile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allContacts.map((c: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3 font-bold text-[14px] text-gray-900">{c.name}</td>
                        <td className="px-6 py-3 text-[14px] text-gray-600">{c.designation || "-"}</td>
                        <td className="px-6 py-3 text-[14px] text-gray-600">{c.number || "-"}</td>
                        <td className="px-6 py-3 text-[14px] text-gray-600">{c.email || "-"}</td>
                        <td className="px-6 py-3 text-[14px] text-gray-600">
                          {c.mandates && c.mandates.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {c.mandates.map((m: any, i: number) => (
                                <Link href={`/dashboard/mandates/${m.id}`} key={i} className="inline-block bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-0.5 rounded text-[11px] font-medium border border-blue-100 whitespace-nowrap transition-colors">
                                  {m.role}
                                </Link>
                              ))}
                            </div>
                          ) : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-6 py-3 text-right">
                          {c.linkedCandidateId ? (
                            <Link href={`/dashboard/candidates/${c.linkedCandidateId}`} className="text-[13px] font-bold text-[#1d4ed8] hover:underline flex items-center justify-end gap-1">
                              <User className="w-3.5 h-3.5" /> View Profile
                            </Link>
                          ) : (
                            <span className="text-[13px] text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-6 py-8 text-center text-sm text-gray-500">
                  No contacts added yet.
                </div>
              );
            })()}
          </div>
        </div>

        {/* Associated Candidates Display */}
        {associatedCandidates.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-[15px] font-bold text-[#133255]">Associated Candidates from Database</h2>
              <p className="text-[13px] text-gray-500 mt-0.5">Candidates who currently work or previously worked here.</p>
            </div>
            <div className="p-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-6 py-3 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Current Company</th>
                    <th className="px-6 py-3 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Relationship</th>
                  </tr>
                </thead>
                <tbody>
                  {associatedCandidates.map(ac => {
                    const isCurrent = ac.company?.toLowerCase() === client.name.toLowerCase();
                    return (
                      <tr key={ac.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/candidates/${ac.id}`)}>
                        <td className="px-6 py-3 font-bold text-[14px] text-[#133255] hover:underline">{ac.name}</td>
                        <td className="px-6 py-3 text-[14px] text-gray-600">{ac.designation || "-"}</td>
                        <td className="px-6 py-3 text-[14px] text-gray-600 font-medium">{ac.company || "-"}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${isCurrent ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                            {isCurrent ? 'Current Employee' : 'Ex-Employee'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Client Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#133255]/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-[#133255]">Edit Client</h2>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Client *</label>
                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Legal Entity Name</label>
                    <input value={form.legalEntityName} onChange={e => setForm({...form, legalEntityName: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Account ID</label>
                  <input value={form.accountId} onChange={e => setForm({...form, accountId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Industry</label>
                  <input list="industry-suggestions" value={form.vertical} onChange={e => setForm({...form, vertical: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]" />
                  <datalist id="industry-suggestions">
                    {industries.map((ind: any) => (
                      <option key={ind.id} value={ind.sectorName} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Account owner</label>
                  <input value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]" />
                </div>
                </div>
                
                {/* Contacts Section */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#9ca8be]">Client Contacts</h3>
                    <button type="button" onClick={addContact} className="text-sm font-bold text-[#133255] flex items-center gap-1 hover:text-[#D8B15B] transition-colors">
                      <Plus className="w-4 h-4" /> Add Contact
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {contacts.map((contact, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 border border-gray-100 rounded-lg relative">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Contact Name</label>
                            <input value={contact.name} onChange={e => updateContact(idx, 'name', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] outline-none focus:border-[#133255]" placeholder="Name" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Designation</label>
                            <input value={contact.designation} onChange={e => updateContact(idx, 'designation', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] outline-none focus:border-[#133255]" placeholder="Designation" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Contact Number</label>
                            <input value={contact.number} onChange={e => updateContact(idx, 'number', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] outline-none focus:border-[#133255]" placeholder="Phone Number" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Contact Email</label>
                            <input type="email" value={contact.email} onChange={e => updateContact(idx, 'email', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] outline-none focus:border-[#133255]" placeholder="Email Address" />
                          </div>
                        </div>
                        <button type="button" onClick={() => removeContact(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors" title="Remove Contact">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {contacts.length === 0 && (
                      <div className="text-[13px] text-gray-500 italic text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        No contacts added yet.
                      </div>
                    )}
                  </div>
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
