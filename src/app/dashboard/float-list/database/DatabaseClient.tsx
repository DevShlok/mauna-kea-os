"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { updateCandidateStatusAction } from "@/app/actions";
import * as XLSX from "xlsx";

export default function DatabaseClient({ initialCandidates }: { initialCandidates: any[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [candidates, setCandidates] = useState(initialCandidates);

  useEffect(() => {
    setCandidates(initialCandidates);
  }, [initialCandidates]);

  const filtered = candidates.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                        (c.designation && c.designation.toLowerCase().includes(search.toLowerCase())) || 
                        (c.company && c.company.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "All Statuses" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, status: newStatus } : c));
    await updateCandidateStatusAction(id, newStatus);
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      alert("No candidates to export.");
      return;
    }
    
    const headers = ["ID", "Name", "Company", "Role", "Location", "Exp (yrs)", "CTC", "Expected", "Notice (days)", "Status", "Qualifications", "LinkedIn", "Target Company"];
    const rows = filtered.map(c => [
      c.id || "",
      c.name || "",
      c.company || "",
      c.designation || "",
      c.location || "",
      c.exp || "",
      c.ctc ? `${c.currency || 'INR'} ${c.ctc}L` : "",
      c.expected ? `${c.currency || 'INR'} ${c.expected}L` : "",
      c.notice || "",
      c.status || "",
      (c.qual || []).join("; "),
      c.linkedin || "",
      c.targetCompany || ""
    ]);
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 18 }, // ID
      { wch: 25 }, // Name
      { wch: 25 }, // Company
      { wch: 30 }, // Role
      { wch: 15 }, // Location
      { wch: 10 }, // Exp
      { wch: 12 }, // CTC
      { wch: 12 }, // Expected
      { wch: 12 }, // Notice
      { wch: 15 }, // Status
      { wch: 30 }, // Quals
      { wch: 45 }, // LinkedIn
      { wch: 25 }  // Target
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates");
    
    XLSX.writeFile(wb, `float_list_candidates_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Float List Database</h1>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="px-4 py-2 bg-gray-100 text-gray-600 rounded text-xs font-bold hover:bg-gray-200 transition-colors">Export CSV</button>
          <button onClick={() => router.push('/dashboard/float-list/database/new')} className="px-4 py-2 bg-yellow-500 text-blue-900 rounded text-xs font-bold hover:bg-yellow-400 transition-colors">+ Add Candidate</button>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap mb-4">
        <input 
          type="text" 
          placeholder="Search candidates..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="w-[220px] h-9 border-[1.5px] border-[#D4E0F0] rounded-md px-2.5 text-[13px] outline-none bg-white focus:border-[#123D8D]"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 border-[1.5px] border-[#D4E0F0] rounded-md px-2.5 text-[13px] outline-none bg-white focus:border-[#123D8D]">
          <option>All Statuses</option>
          <option>Active</option>
          <option>Passive</option>
          <option>Not Interested</option>
        </select>
        <select className="h-9 border-[1.5px] border-[#D4E0F0] rounded-md px-2.5 text-[13px] outline-none bg-white focus:border-[#123D8D]">
          <option>All Locations</option>
          <option>Mumbai</option>
          <option>Delhi</option>
          <option>Bengaluru</option>
        </select>
        <select className="h-9 border-[1.5px] border-[#D4E0F0] rounded-md px-2.5 text-[13px] outline-none bg-white focus:border-[#123D8D]">
          <option>All Functions</option>
          <option>Finance</option>
          <option>HR</option>
          <option>Technology</option>
        </select>
      </div>

      <div className="bg-white border border-[#D4E0F0] rounded-[10px] p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6b7a99] border-b-2 border-[#D4E0F0] whitespace-nowrap bg-[#fafbfd]">Name & Role</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6b7a99] border-b-2 border-[#D4E0F0] whitespace-nowrap bg-[#fafbfd]">Location</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6b7a99] border-b-2 border-[#D4E0F0] whitespace-nowrap bg-[#fafbfd]">Current CTC</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6b7a99] border-b-2 border-[#D4E0F0] whitespace-nowrap bg-[#fafbfd]">Notice</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6b7a99] border-b-2 border-[#D4E0F0] whitespace-nowrap bg-[#fafbfd]">Status</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6b7a99] border-b-2 border-[#D4E0F0] whitespace-nowrap bg-[#fafbfd]">Quals</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6b7a99] border-b-2 border-[#D4E0F0] whitespace-nowrap bg-[#fafbfd]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} className="hover:bg-[#fafbff] cursor-pointer group" onClick={() => router.push("/dashboard/float-list/" + c.id)}>
                  <td className="px-3 py-2.5 border-b border-[#f0f0f0] align-middle text-[13px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-[#D8B15B] text-[#0d2f6e] flex items-center justify-center text-[12px] font-bold shrink-0">{c.initials}</div>
                      <div>
                        <div className="font-semibold text-[#111]">{c.name}</div>
                        <div className="text-[11px] text-[#6b7a99]">
                          {c.designation || 'No Role'} {c.company ? `· ${c.company}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 border-b border-[#f0f0f0] align-middle text-[13px]">{c.location || '-'}</td>
                  <td className="px-3 py-2.5 border-b border-[#f0f0f0] align-middle text-[13px] whitespace-nowrap">{c.ctc ? `${c.currency || 'INR'} ${c.ctc}L` : '-'}</td>
                  <td className="px-3 py-2.5 border-b border-[#f0f0f0] align-middle text-[13px] whitespace-nowrap">{c.notice ? `${c.notice}d` : '-'}</td>
                  <td className="px-3 py-2.5 border-b border-[#f0f0f0] align-middle text-[13px]" onClick={(e) => e.stopPropagation()}>
                    <select 
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border-none outline-none cursor-pointer ${
                        c.status === 'Active' ? 'bg-[#e0f5e9] text-[#137a43]' :
                        c.status === 'Passive' ? 'bg-[#fef4e6] text-[#b36b00]' :
                        'bg-[#fae6e6] text-[#c92a2a]'
                      }`}
                      value={c.status}
                      onChange={(e) => handleStatusChange(c.id, e.target.value)}
                    >
                      <option className="text-[#137a43] bg-white">Active</option>
                      <option className="text-[#b36b00] bg-white">Passive</option>
                      <option className="text-[#c92a2a] bg-white">Not Interested</option>
                    </select>
                  </td>
                  <td className="px-3 py-2.5 border-b border-[#f0f0f0] align-middle text-[13px]">
                    <div className="flex flex-wrap gap-1">
                      {c.qual?.map((q: string) => (
                        <span key={q} className="px-1.5 py-[1px] bg-[#f0f4f8] text-[#4a5568] border border-[#d1d5db] rounded-[3px] text-[10px] font-bold whitespace-nowrap">{q}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 border-b border-[#f0f0f0] align-middle text-[13px]" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1.5">
                      <button className="px-3 py-1 bg-[#123D8D] text-white rounded text-[12px] font-semibold hover:bg-[#0d2f6e] transition-colors" onClick={() => router.push("/dashboard/float-list/" + c.id)}>View</button>
                      <button className="px-3 py-1 bg-white border border-[#D4E0F0] text-[#6b7a99] rounded text-[12px] font-semibold hover:bg-[#f4f7fd] transition-colors" onClick={() => router.push("/dashboard/float-list/" + c.id + "/edit")}>Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
