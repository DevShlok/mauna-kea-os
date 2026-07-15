const fs = require('fs');

let code = fs.readFileSync('src/features/clients/components/ClientDetailClient.tsx', 'utf8');

// 1. Imports
if (!code.includes('Plus')) {
    code = code.replace('Trash2, Edit, Upload } from "lucide-react";', 'Trash2, Edit, Upload, Plus } from "lucide-react";');
}

// 2. State
const stateTarget = `    owner: client.owner || "", \r\n    status: client.status || "Active" \r\n  });`;
const stateReplace = `    owner: client.owner || "", \r\n    status: client.status || "Active", \r\n    legalEntityName: client.legalEntityName || "" \r\n  });\r\n  const [contacts, setContacts] = useState<{name: string, designation: string, number: string, email: string}[]>(client.contacts || []);`;
if (code.includes(stateTarget)) {
    code = code.replace(stateTarget, stateReplace);
} else {
    code = code.replace(stateTarget.replace(/\r\n/g, '\n'), stateReplace.replace(/\r\n/g, '\n'));
}

// 3. Methods & handleEditSubmit
const submitTarget = `    await updateClientAction(client.id, form);\r\n    setIsSubmitting(false);\r\n    setIsEditing(false);\r\n  };`;
const submitReplace = `    await updateClientAction(client.id, { ...form, contacts });\r\n    setIsSubmitting(false);\r\n    setIsEditing(false);\r\n  };\r\n\r\n  const updateContact = (index: number, field: string, value: string) => {\r\n    const newContacts = [...contacts];\r\n    newContacts[index] = { ...newContacts[index], [field]: value };\r\n    setContacts(newContacts);\r\n  };\r\n\r\n  const addContact = () => {\r\n    setContacts([...contacts, {name: "", designation: "", number: "", email: ""}]);\r\n  };\r\n\r\n  const removeContact = (index: number) => {\r\n    setContacts(contacts.filter((_, i) => i !== index));\r\n  };`;

if (code.includes(submitTarget)) {
    code = code.replace(submitTarget, submitReplace);
} else {
    code = code.replace(submitTarget.replace(/\r\n/g, '\n'), submitReplace.replace(/\r\n/g, '\n'));
}

// 4. Modal max-w
code = code.replace('max-w-md overflow-hidden', 'max-w-2xl overflow-hidden');

// 5. Form Fields
const formFieldsTarget = `              <div className="space-y-4">\r\n                <div>\r\n                  <label className="block text-xs font-bold text-gray-700 mb-1">Client *</label>\r\n                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]" />\r\n                </div>\r\n                <div>\r\n                  <label className="block text-xs font-bold text-gray-700 mb-1">Account ID</label>`;

const formFieldsReplace = `              <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">\r\n                <div className="grid grid-cols-2 gap-4">\r\n                  <div>\r\n                    <label className="block text-xs font-bold text-gray-700 mb-1">Client *</label>\r\n                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]" />\r\n                  </div>\r\n                  <div>\r\n                    <label className="block text-xs font-bold text-gray-700 mb-1">Legal Entity Name</label>\r\n                    <input value={form.legalEntityName} onChange={e => setForm({...form, legalEntityName: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]" />\r\n                  </div>\r\n                </div>\r\n                <div className="grid grid-cols-2 gap-4">\r\n                  <div>\r\n                    <label className="block text-xs font-bold text-gray-700 mb-1">Account ID</label>`;

if (code.includes(formFieldsTarget)) {
    code = code.replace(formFieldsTarget, formFieldsReplace);
} else {
    code = code.replace(formFieldsTarget.replace(/\r\n/g, '\n'), formFieldsReplace.replace(/\r\n/g, '\n'));
}

const statusTarget = `                <div>\r\n                  <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>\r\n                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]">\r\n                    <option value="Active">Active</option>\r\n                    <option value="Prospect">Prospect</option>\r\n                    <option value="Inactive">Inactive</option>\r\n                  </select>\r\n                </div>\r\n              </div>`;

const statusReplace = `                <div>\r\n                  <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>\r\n                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]">\r\n                    <option value="Active">Active</option>\r\n                    <option value="Prospect">Prospect</option>\r\n                    <option value="Inactive">Inactive</option>\r\n                  </select>\r\n                </div>\r\n                \r\n                {/* Contacts Section */}\r\n                <div className="mt-8 pt-6 border-t border-gray-100">\r\n                  <div className="flex items-center justify-between mb-4">\r\n                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#9ca8be]">Client Contacts</h3>\r\n                    <button type="button" onClick={addContact} className="text-sm font-bold text-[#133255] flex items-center gap-1 hover:text-[#D8B15B] transition-colors">\r\n                      <Plus className="w-4 h-4" /> Add Contact\r\n                    </button>\r\n                  </div>\r\n                  \r\n                  <div className="space-y-4">\r\n                    {contacts.map((contact, idx) => (\r\n                      <div key={idx} className="p-4 bg-gray-50 border border-gray-100 rounded-lg relative">\r\n                        <div className="grid grid-cols-2 gap-3">\r\n                          <div>\r\n                            <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Contact Name</label>\r\n                            <input value={contact.name} onChange={e => updateContact(idx, 'name', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] outline-none focus:border-[#133255]" placeholder="Name" />\r\n                          </div>\r\n                          <div>\r\n                            <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Designation</label>\r\n                            <input value={contact.designation} onChange={e => updateContact(idx, 'designation', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] outline-none focus:border-[#133255]" placeholder="Designation" />\r\n                          </div>\r\n                          <div>\r\n                            <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Contact Number</label>\r\n                            <input value={contact.number} onChange={e => updateContact(idx, 'number', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] outline-none focus:border-[#133255]" placeholder="Phone Number" />\r\n                          </div>\r\n                          <div>\r\n                            <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Contact Email</label>\r\n                            <input type="email" value={contact.email} onChange={e => updateContact(idx, 'email', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-[13px] outline-none focus:border-[#133255]" placeholder="Email Address" />\r\n                          </div>\r\n                        </div>\r\n                        <button type="button" onClick={() => removeContact(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors" title="Remove Contact">\r\n                          <Trash2 className="w-4 h-4" />\r\n                        </button>\r\n                      </div>\r\n                    ))}\r\n                    {contacts.length === 0 && (\r\n                      <div className="text-[13px] text-gray-500 italic text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">\r\n                        No contacts added yet.\r\n                      </div>\r\n                    )}\r\n                  </div>\r\n                </div>\r\n              </div>`;

if (code.includes(statusTarget)) {
    code = code.replace(statusTarget, statusReplace);
} else {
    code = code.replace(statusTarget.replace(/\r\n/g, '\n'), statusReplace.replace(/\r\n/g, '\n'));
}

fs.writeFileSync('src/features/clients/components/ClientDetailClient.tsx', code);
console.log('Updated ClientDetailClient');
