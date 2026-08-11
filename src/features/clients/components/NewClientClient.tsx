"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientAction } from "@/actions";
import { Trash2, Plus } from "lucide-react";
import GstinLookupField from "@/components/GstinLookupField";

export default function NewClientClient({ industries = [] }: { industries?: any[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    legalEntityName: "",
    accountId: "",
    vertical: "",
    owner: "",
    status: "Active",
    gstNumber: "",
    panNumber: "",
    registeredAddress: "",
    city: "",
    state: "",
    pinCode: "",
  });
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

      <div className="neo-table">
        <form onSubmit={handleAddSubmit} className="p-8">
          <div className="space-y-6">
            {/* Row 1: Client name + Legal Entity */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Client *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 neo-inset text-[15px] outline-none" placeholder="e.g. Finova Tech"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Legal Entity Name</label>
                <input value={form.legalEntityName} onChange={e => setForm({...form, legalEntityName: e.target.value})} className="w-full px-4 py-3 neo-inset text-[15px] outline-none" placeholder="e.g. Finova Technologies Pvt. Ltd."/>
              </div>
            </div>

            {/* Row 2: Account ID + Industry */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Account ID</label>
                <input value={form.accountId} onChange={e => setForm({...form, accountId: e.target.value})} className="w-full px-4 py-3 neo-inset text-[15px] outline-none" placeholder="e.g. ACC-101"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Industry</label>
                <input list="industry-suggestions" value={form.vertical} onChange={e => setForm({...form, vertical: e.target.value})} className="w-full px-4 py-3 neo-inset text-[15px] outline-none" placeholder="e.g. Financial services"/>
                <datalist id="industry-suggestions">
                  {industries.map((ind: any) => (
                    <option key={ind.id} value={ind.sectorName} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Row 3: Account Owner + Status */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Account owner</label>
                <input value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} className="w-full px-4 py-3 neo-inset text-[15px] outline-none" placeholder="e.g. Sahil Bhatia"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-4 py-3 neo-inset text-[15px] outline-none">
                  <option value="Active">Active</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Billing / Legal Section */}
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#9ca8be] mb-4">Billing & Legal Details</h3>
              <div className="space-y-4">
                {/* GSTIN Lookup */}
                <GstinLookupField
                  value={form.gstNumber}
                  onChange={(val) => setForm(prev => ({ ...prev, gstNumber: val }))}
                  onLookupSuccess={(result) => {
                    setForm(prev => ({
                      ...prev,
                      // Only auto-fill if field is currently empty
                      legalEntityName: prev.legalEntityName || result.legalName || prev.legalEntityName,
                      panNumber: prev.panNumber || result.pan,
                      registeredAddress: prev.registeredAddress || result.registeredAddress || prev.registeredAddress,
                      city: prev.city || result.city || prev.city,
                      state: prev.state || result.state || prev.state,
                      pinCode: prev.pinCode || result.pinCode || prev.pinCode,
                    }));
                  }}
                  inputClassName="neo-inset"
                />

                {/* PAN */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">PAN Number</label>
                    <input
                      value={form.panNumber}
                      onChange={e => setForm({...form, panNumber: e.target.value.toUpperCase()})}
                      maxLength={10}
                      className="w-full px-4 py-3 neo-inset text-[15px] font-mono outline-none"
                      placeholder="e.g. ABCDE1234F"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">City</label>
                    <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-4 py-3 neo-inset text-[15px] outline-none" placeholder="e.g. Mumbai"/>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">State</label>
                    <input value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full px-4 py-3 neo-inset text-[15px] outline-none" placeholder="e.g. Maharashtra"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">PIN Code</label>
                    <input value={form.pinCode} onChange={e => setForm({...form, pinCode: e.target.value})} maxLength={6} className="w-full px-4 py-3 neo-inset text-[15px] outline-none" placeholder="e.g. 400001"/>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Registered Address</label>
                  <textarea
                    value={form.registeredAddress}
                    onChange={e => setForm({...form, registeredAddress: e.target.value})}
                    rows={2}
                    className="w-full px-4 py-3 neo-inset text-[15px] outline-none resize-none"
                    placeholder="Full registered address (auto-filled from GSTIN lookup)"
                  />
                </div>
              </div>
            </div>

            {/* Contacts Section */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#9ca8be]">Client Contacts</h3>
                <button type="button" onClick={addContact} className="text-sm font-bold text-[#133255] flex items-center gap-1 hover:text-[#D8B15B] transition-colors">
                  <Plus className="w-4 h-4" /> Add Contact
                </button>
              </div>
              
              <div className="space-y-4">
                {contacts.map((contact, idx) => (
                  <div key={idx} className="p-5 neo-card-sm relative">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Contact Name</label>
                        <input value={contact.name} onChange={e => updateContact(idx, 'name', e.target.value)} className="w-full px-3 py-2 neo-inset text-[14px] outline-none" placeholder="Name" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Designation</label>
                        <input value={contact.designation} onChange={e => updateContact(idx, 'designation', e.target.value)} className="w-full px-3 py-2 neo-inset text-[14px] outline-none" placeholder="Designation" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Contact Number</label>
                        <input value={contact.number} onChange={e => updateContact(idx, 'number', e.target.value)} className="w-full px-3 py-2 neo-inset text-[14px] outline-none" placeholder="Phone Number" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Contact Email</label>
                        <input type="email" value={contact.email} onChange={e => updateContact(idx, 'email', e.target.value)} className="w-full px-3 py-2 neo-inset text-[14px] outline-none" placeholder="Email Address" />
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
            <button type="button" onClick={() => router.back()} className="px-6 py-2.5 neo-btn text-[15px] font-bold text-gray-600">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 neo-btn text-[15px] font-bold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#D8B15B,#f0c96a)', color: '#133255' }}>
              {isSubmitting ? "Saving..." : "Save Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
