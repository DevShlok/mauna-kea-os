const fs = require('fs');

const code = `"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientAction } from "@/actions";
import { Trash2, Plus } from "lucide-react";

export default function NewClientClient({ industries = [] }: { industries?: any[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", legalEntityName: "", accountId: "", vertical: "", owner: "", status: "Active" });
  const [contacts, setContacts] = useState<{name: string, designation: string, number: string, email: string}[]>([{name: "", designation: "", number: "", email: ""}]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await createClientAction({ ...form, contacts });
    setIsSubmitting(false);
    router.push("/dashboard/clients");
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

  return (
    <div className="max-w-screen-md mx-auto pb-10">
      <div className="text-[14px] text-gray-500 mb-1">Home / Clients / New</div>
      <h1 className="text-3xl font-serif font-bold text-[#133255] mb-8 tracking-tight">Add New Client</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleAddSubmit} className="p-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Client *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-md text-[15px] outline-none focus:border-[#133255]" placeholder="e.g. Finova Tech"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Legal Entity Name</label>
                <input value={form.legalEntityName} onChange={e => setForm({...form, legalEntityName: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-md text-[15px] outline-none focus:border-[#133255]" placeholder="e.g. Finova Technologies Pvt. Ltd."/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Account ID</label>
                <input value={form.accountId} onChange={e => setForm({...form, accountId: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-md text-[15px] outline-none focus:border-[#133255]" placeholder="e.g. ACC-101"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Industry</label>
                <input list="industry-suggestions" value={form.vertical} onChange={e => setForm({...form, vertical: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-md text-[15px] outline-none focus:border-[#133255]" placeholder="e.g. Financial services"/>
                <datalist id="industry-suggestions">
                  {industries.map((ind: any) => (
                    <option key={ind.id} value={ind.sectorName} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Account owner</label>
                <input value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-md text-[15px] outline-none focus:border-[#133255]" placeholder="e.g. Sahil Bhatia"/>
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
            
            {/* Contacts Section */}
            <div className="mt-10 pt-8 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#9ca8be]">Client Contacts</h3>
                <button type="button" onClick={addContact} className="text-sm font-bold text-[#133255] flex items-center gap-1 hover:text-[#D8B15B] transition-colors">
                  <Plus className="w-4 h-4" /> Add Contact
                </button>
              </div>
              
              <div className="space-y-4">
                {contacts.map((contact, idx) => (
                  <div key={idx} className="p-5 bg-gray-50 border border-gray-100 rounded-lg relative">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Contact Name</label>
                        <input value={contact.name} onChange={e => updateContact(idx, 'name', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-[14px] outline-none focus:border-[#133255]" placeholder="Name" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Designation</label>
                        <input value={contact.designation} onChange={e => updateContact(idx, 'designation', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-[14px] outline-none focus:border-[#133255]" placeholder="Designation" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Contact Number</label>
                        <input value={contact.number} onChange={e => updateContact(idx, 'number', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-[14px] outline-none focus:border-[#133255]" placeholder="Phone Number" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Contact Email</label>
                        <input type="email" value={contact.email} onChange={e => updateContact(idx, 'email', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-[14px] outline-none focus:border-[#133255]" placeholder="Email Address" />
                      </div>
                    </div>
                    {contacts.length > 1 && (
                      <button type="button" onClick={() => removeContact(idx)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors" title="Remove Contact">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
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
`;

fs.writeFileSync('src/features/clients/components/NewClientClient.tsx', code);
console.log("Updated NewClientClient");
