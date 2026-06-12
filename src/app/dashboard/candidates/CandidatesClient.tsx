"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Candidate } from "@/db/schema";
import { addSubmissionAction, updateCandidateStatusAction } from "@/app/actions";

export default function CandidatesClient({ candidates, mandates }: { candidates: Candidate[], mandates: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignToMandate = searchParams.get("assignToMandate");
  const assignClient = searchParams.get("assignClient") || "";
  const assignRole = searchParams.get("assignRole") || "";

  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");

  const [selectedCandToFloat, setSelectedCandToFloat] = useState<Candidate | null>(null);
  const [floatForm, setFloatForm] = useState({ client: "", role: "", consultant: "", status: "Shared" });
  const [isFloating, setIsFloating] = useState(false);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateCandidateStatusAction(id, newStatus);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to update status");
    }
  };

  const handleFloatSubmit = async () => {
    if (!selectedCandToFloat || !floatForm.client || !floatForm.role || !floatForm.consultant) {
      alert("Please fill all mandatory fields.");
      return;
    }
    setIsFloating(true);
    try {
      await addSubmissionAction({
        candId: selectedCandToFloat.id,
        candName: selectedCandToFloat.name,
        client: floatForm.client,
        role: floatForm.role,
        consultant: floatForm.consultant,
        status: floatForm.status,
        mandateId: assignToMandate ? Number(assignToMandate) : undefined
      });
      setSelectedCandToFloat(null);
      setFloatForm({ client: "", role: "", consultant: "", status: "Shared" });
      if (assignToMandate) {
        router.push(`/dashboard/mandates/${assignToMandate}`);
      } else {
        router.push("/dashboard/float-list");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to float candidate.");
    } finally {
      setIsFloating(false);
    }
  };

  const uniqueMandateCompanies = floatForm.role 
    ? Array.from(new Set(mandates.filter(m => m.role === floatForm.role).map(m => m.company).filter(Boolean))).sort()
    : Array.from(new Set(mandates.map(m => m.company).filter(Boolean))).sort();
    
  const uniqueMandateRoles = floatForm.client
    ? Array.from(new Set(mandates.filter(m => m.company === floatForm.client).map(m => m.role).filter(Boolean))).sort()
    : Array.from(new Set(mandates.map(m => m.role).filter(Boolean))).sort();

  const uniqueCompanies = Array.from(new Set(candidates.map(c => c.company).filter(Boolean))).sort();
  const uniqueDesignations = Array.from(new Set(candidates.map(c => c.designation).filter(Boolean))).sort();

  const filtered = candidates.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase());
    const matchCompany = !companyFilter || c.company === companyFilter;
    const matchDesignation = !designationFilter || c.designation === designationFilter;
    return matchSearch && matchCompany && matchDesignation;
  });

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 font-semibold mb-1">
            <Link href="/dashboard" className="hover:text-blue-900">Home</Link>
            <span>/</span>
            <span className="text-gray-800">Master Database</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Candidate DB</h1>
        </div>
        <Link href="/dashboard/candidates/new" className="px-4 py-2 bg-yellow-500 text-blue-900 rounded text-xs font-bold hover:bg-yellow-400 transition-colors inline-block">
          + Add Candidate
        </Link>
      </div>
      
      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 mb-6 bg-white p-3 border border-gray-200 rounded-xl shadow-sm">
        <input type="text" placeholder="Search by Name/Company..." value={search} onChange={(e) => setSearch(e.target.value)} className="min-w-[200px] flex-1 px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-blue-900"/>
        
        <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none max-w-[180px]">
          <option value="">All Companies</option>
          {uniqueCompanies.map((c: any) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={designationFilter} onChange={(e) => setDesignationFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none max-w-[180px]">
          <option value="">All Designations</option>
          {uniqueDesignations.map((d: any) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Company</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Designation</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Exp (Yrs)</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">CTC</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer" onClick={() => router.push("/dashboard/candidates/" + c.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-blue-900 text-white flex items-center justify-center text-xs font-bold">{c.initials}</div>
                      <span className="font-semibold text-blue-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.company || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{c.designation || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{c.exp !== null ? c.exp : "-"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.ctc 
                      ? (
                          <div className="flex flex-col">
                            <span>{(c.currency === 'INR' || !c.currency) ? (c.ctc >= 100 ? `INR ${(c.ctc / 100).toFixed(1).replace(/\.0$/, '')} Cr` : `INR ${c.ctc} L`) : `${c.currency} ${c.ctc}`}</span>
                            {(c.fixedCtc || c.variableCtc) && (
                              <span className="text-[10px] text-gray-400 mt-0.5">
                                {c.fixedCtc ? `F: ${c.fixedCtc}` : ''} {c.fixedCtc && c.variableCtc ? '|' : ''} {c.variableCtc ? `V: ${c.variableCtc}` : ''}
                              </span>
                            )}
                          </div>
                        )
                      : "-"}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <select
                      value={c.status || "Active"}
                      onChange={(e) => handleStatusChange(c.id, e.target.value)}
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border cursor-pointer outline-none ${
                        c.status === 'Active' || !c.status ? 'bg-green-50 text-green-700 border-green-200' : 
                        c.status === 'Passive' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        c.status === 'Not Interested' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      <option value="Active" className="bg-white text-gray-900">Active</option>
                      <option value="Passive" className="bg-white text-gray-900">Passive</option>
                      <option value="Not Interested" className="bg-white text-gray-900">Not Interested</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {assignToMandate ? (
                        <button className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-bold hover:bg-purple-700" onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedCandToFloat(c);
                          setFloatForm(prev => ({ ...prev, client: assignClient, role: assignRole }));
                        }}>Assign</button>
                      ) : (
                        <button className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700" onClick={(e) => { e.stopPropagation(); setSelectedCandToFloat(c); }}>Float</button>
                      )}
                      <button className="px-3 py-1 bg-blue-900 text-white rounded text-xs font-bold hover:bg-blue-800" onClick={(e) => { e.stopPropagation(); router.push("/dashboard/candidates/" + c.id); }}>View</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No candidates found in the master database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Float Candidate Modal */}
      {selectedCandToFloat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{assignToMandate ? `Assign ${selectedCandToFloat.name} to Mandate` : `Float ${selectedCandToFloat.name}`}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Company <span className="text-red-500">*</span></label>
                <select value={floatForm.client} onChange={e => setFloatForm({...floatForm, client: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-900 bg-white">
                  <option value="">Select Company</option>
                  {uniqueMandateCompanies.map((c: any) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Role <span className="text-red-500">*</span></label>
                <select value={floatForm.role} onChange={e => setFloatForm({...floatForm, role: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-900 bg-white">
                  <option value="">Select Role</option>
                  {uniqueMandateRoles.map((r: any) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Consultant Name <span className="text-red-500">*</span></label>
                <input type="text" value={floatForm.consultant} onChange={e => setFloatForm({...floatForm, consultant: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-900" placeholder="Your Name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                <select value={floatForm.status} onChange={e => setFloatForm({...floatForm, status: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-900 bg-white">
                  <option value="Shared">Shared</option>
                  <option value="Review">Review</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interviewing">Interviewing</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setSelectedCandToFloat(null)} className="px-4 py-2 border border-gray-300 rounded text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button disabled={isFloating} onClick={handleFloatSubmit} className="px-4 py-2 bg-blue-900 text-white rounded text-sm font-bold hover:bg-blue-800 disabled:opacity-50">
                {isFloating ? "Saving..." : (assignToMandate ? "Assign Candidate" : "Submit Float")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}