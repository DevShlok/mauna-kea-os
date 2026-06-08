"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addFloatListEntryAction } from "@/app/actions";

export default function DatabaseClient({ initialCandidates }: { initialCandidates: any[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [candidates, setCandidates] = useState(initialCandidates);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", designation: "", email: "", mobile: "", location: "", exp: "", ctc: "" });

  const filtered = candidates.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                        (c.designation && c.designation.toLowerCase().includes(search.toLowerCase())) || 
                        (c.company && c.company.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Float List Database</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">Export CSV</button>
          <button onClick={() => setIsAdding(true)} className="px-4 py-2 bg-yellow-500 text-blue-900 rounded text-xs font-bold hover:bg-yellow-400">+ Add Candidate</button>
        </div>
      </div>
      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="Search candidates..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56 px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-blue-900"/>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none">
          <option value="">All Statuses</option>
          <option>Active</option>
          <option>Passive</option>
          <option>Not Interested</option>
        </select>
        <select className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none">
          <option>All Functions</option>
          <option>Finance</option>
          <option>HR</option>
          <option>Technology</option>
        </select>
        <select className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none">
          <option>All Locations</option>
          <option>Mumbai</option>
          <option>Delhi</option>
          <option>Bengaluru</option>
        </select>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-400 uppercase">ID</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-400 uppercase">Name</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-400 uppercase">Location</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-400 uppercase">Exp</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-400 uppercase">CTC (L)</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-400 uppercase">Expected (L)</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-400 uppercase">Notice</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-400 uppercase">Qual.</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer" onClick={() => router.push("/dashboard/float-list/" + c.id)}>
                  <td className="px-3 py-3 text-gray-400 text-xs font-mono">{c.id}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-blue-900 text-white flex items-center justify-center text-xs font-bold shrink-0">{c.initials}</div>
                      <div>
                        <div className="font-semibold text-blue-900 text-sm">{c.name}</div>
                        <div className="text-xs text-gray-400">{c.designation} · {c.company}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-500 text-xs">{c.location}</td>
                  <td className="px-3 py-3 text-gray-500 text-xs">{c.exp} yrs</td>
                  <td className="px-3 py-3 text-gray-500 text-xs">{c.ctc}L</td>
                  <td className="px-3 py-3 text-gray-500 text-xs">{c.expected}L</td>
                  <td className="px-3 py-3 text-gray-500 text-xs">{c.notice}d</td>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <select className="border border-gray-200 rounded px-2 py-1 text-xs bg-white outline-none cursor-pointer" defaultValue={c.status}>
                      <option>Active</option>
                      <option>Passive</option>
                      <option>Not Interested</option>
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.qual.map((q: string) => (<span key={q} className="px-1.5 py-0.5 bg-blue-50 text-blue-800 rounded text-xs font-bold">{q}</span>))}
                    </div>
                  </td>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <button className="px-3 py-1 bg-blue-900 text-white rounded text-xs font-bold hover:bg-blue-800" onClick={() => router.push("/dashboard/float-list/" + c.id)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[500px] overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900">Add Float List Candidate</div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!form.name) return;
              const newId = await addFloatListEntryAction(form);
              
              // Optimistically update local state so it appears instantly
              setCandidates([{ 
                id: newId, 
                name: form.name, 
                company: form.company, 
                designation: form.designation,
                email: form.email,
                mobile: form.mobile,
                location: form.location,
                exp: form.exp ? Number(form.exp) : null,
                ctc: form.ctc ? Number(form.ctc) : null,
                status: "Active",
                initials: form.name.substring(0, 2).toUpperCase(),
                qual: []
              }, ...candidates]);

              setIsAdding(false);
              setForm({ name: "", company: "", designation: "", email: "", mobile: "", location: "", exp: "", ctc: "" });
              router.refresh(); // Also refresh to sync server
            }} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Full Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Company</label>
                  <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Designation</label>
                  <input value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Mobile</label>
                  <input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Location</label>
                  <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Experience (yrs)</label>
                  <input type="number" value={form.exp} onChange={e => setForm({...form, exp: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-yellow-500 text-blue-900 rounded text-xs font-bold hover:bg-yellow-400">Save Candidate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
