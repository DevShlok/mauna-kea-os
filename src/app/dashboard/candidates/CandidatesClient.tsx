"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function CandidatesClient({ mandates }: { mandates: any[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [mandateFilter, setMandateFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");

  const allCandidates = mandates.flatMap((m) =>
    m.candidates.map((c: any) => ({ ...c, mandateRole: m.role, mandateCompany: m.company, mandateId: m.id }))
  );

  // Extract unique values for filters
  const uniqueMandates = Array.from(new Set(allCandidates.map(c => `${c.mandateRole} @ ${c.mandateCompany}`))).sort();
  const uniqueCompanies = Array.from(new Set(allCandidates.map(c => c.company).filter(Boolean))).sort();
  const uniqueDesignations = Array.from(new Set(allCandidates.map(c => c.role).filter(Boolean))).sort();

  const filtered = allCandidates.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase());
    const matchStage = !stageFilter || c.stage === stageFilter;
    const matchMandate = !mandateFilter || `${c.mandateRole} @ ${c.mandateCompany}` === mandateFilter;
    const matchCompany = !companyFilter || c.company === companyFilter;
    const matchDesignation = !designationFilter || c.role === designationFilter;
    return matchSearch && matchStage && matchMandate && matchCompany && matchDesignation;
  });

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 font-semibold mb-1">
            <Link href="/dashboard" className="hover:text-blue-900">Home</Link>
            <span>/</span>
            <span className="text-gray-800">Candidates</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Candidate Database</h1>
        </div>
      </div>
      
      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 mb-6 bg-white p-3 border border-gray-200 rounded-xl shadow-sm">
        <input type="text" placeholder="Search by Name/Company..." value={search} onChange={(e) => setSearch(e.target.value)} className="min-w-[200px] flex-1 px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-blue-900"/>
        
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none">
          <option value="">All Stages</option>
          <option value="shortlist">Shortlist</option>
          <option value="interview">Interview</option>
          <option value="offer-sent">Offer</option>
          <option value="calllist">Call List</option>
          <option value="longlist">Long List</option>
          <option value="mapping">Mapping</option>
        </select>

        <select value={mandateFilter} onChange={(e) => setMandateFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none max-w-[200px]">
          <option value="">All Mandates</option>
          {uniqueMandates.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none max-w-[180px]">
          <option value="">All Companies</option>
          {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={designationFilter} onChange={(e) => setDesignationFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none max-w-[180px]">
          <option value="">All Designations</option>
          {uniqueDesignations.map(d => <option key={d} value={d}>{d}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Mandate</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Score</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer" onClick={() => router.push("/dashboard/candidates/" + c.id + "?mandateId=" + c.mandateId)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-blue-900 text-white flex items-center justify-center text-xs font-bold">{c.initials}</div>
                      <span className="font-semibold text-blue-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.company}</td>
                  <td className="px-4 py-3 text-gray-600">{c.role}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.mandateRole} @ {c.mandateCompany}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.stage} /></td>
                  <td className="px-4 py-3">
                    {c.score ? (
                      <span className={"px-2 py-0.5 rounded-full text-xs font-bold " + (c.score >= 8 ? "bg-green-100 text-green-800" : c.score >= 6.5 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-700")}>{c.score}/10</span>
                    ) : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button className="px-3 py-1 bg-blue-900 text-white rounded text-xs font-bold hover:bg-blue-800" onClick={(e) => { e.stopPropagation(); router.push("/dashboard/candidates/" + c.id + "?mandateId=" + c.mandateId); }}>View</button>
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