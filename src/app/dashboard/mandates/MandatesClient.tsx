"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { STAGE_OPTIONS, INTERNAL_OPTIONS, formatMandateCtc } from "@/lib/helpers";

type Candidate = { id: number; externalId: string; name: string; stage: string | null; score: number | null; hasReport: boolean | null; initials: string | null; mandateId: number; };
type Mandate = { id: number; company: string; role: string; ctc: string | null; exp: string | null; sectors: string[]; status: string | null; internalStatus: string | null; consultant: string | null; candidates: Candidate[]; };

export default function MandatesClient({ initialMandates }: { initialMandates: Mandate[] }) {
  const router = useRouter();
  const [mandates, setMandates] = useState(initialMandates);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [internalFilter, setInternalFilter] = useState("");

  const uniqueCompanies = Array.from(new Set(mandates.map(m => m.company))).sort();
  const uniqueRoles = Array.from(new Set(mandates.map(m => m.role))).sort();
  const uniqueSectors = Array.from(new Set(mandates.flatMap(m => m.sectors))).sort();

  const filtered = mandates.filter(m => {
    const matchSearch = m.company.toLowerCase().includes(search.toLowerCase()) || m.role.toLowerCase().includes(search.toLowerCase());
    const matchCompany = !companyFilter || m.company === companyFilter;
    const matchRole = !roleFilter || m.role === roleFilter;
    const matchSector = !sectorFilter || m.sectors.includes(sectorFilter);
    const matchStatus = !statusFilter || m.status === statusFilter;
    const matchInternal = !internalFilter || m.internalStatus === internalFilter;
    return matchSearch && matchCompany && matchRole && matchSector && matchStatus && matchInternal;
  });

  async function handleStatusChange(id: number, field: "status" | "internalStatus", value: string) {
    setMandates(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    await fetch("/api/mandates/" + id, { method: "PATCH", body: JSON.stringify({ field, value }), headers: { "Content-Type": "application/json" } });
    router.refresh();
  }

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="text-[14px] text-gray-500 mb-1">Home / Mandates</div>
          <h1 className="text-3xl font-serif font-bold text-[#133255] tracking-tight">All Mandates</h1>
        </div>
        <Link href="/dashboard/mandates/new" className="px-5 py-2.5 bg-[#D8B15B] text-[#133255] rounded-lg text-sm font-bold shadow-sm hover:bg-[#e8c97a] transition-colors inline-block mb-1">
          + Add New Mandate
        </Link>
      </div>
      <div className="flex flex-wrap gap-3 mb-6 bg-white p-3 border border-gray-200 rounded-xl shadow-sm">
        <input type="text" placeholder="Search mandates..." value={search} onChange={e => setSearch(e.target.value)} className="min-w-[200px] flex-1 px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-[#133255]"/>
        
        <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none max-w-[180px]">
          <option value="">All Companies</option>
          {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none max-w-[180px]">
          <option value="">All Roles</option>
          {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none max-w-[180px]">
          <option value="">All Sectors</option>
          {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none max-w-[180px]">
          <option value="">All Statuses</option>
          {STAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        
        <select value={internalFilter} onChange={e => setInternalFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none max-w-[180px]">
          <option value="">All Internal</option>
          {INTERNAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Company</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Budget</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Experience</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Sectors</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Internal</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer" onClick={() => router.push("/dashboard/mandates/" + m.id)}>
                  <td className="px-4 py-3 font-semibold text-[#133255]">{m.company}</td>
                  <td className="px-4 py-3 text-gray-700">{m.role}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatMandateCtc(m.ctc)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{m.exp}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">{m.sectors.map(s => <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{s}</span>)}</div>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <select value={m.status || ""} onChange={e => handleStatusChange(m.id, "status", e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-xs bg-white outline-none cursor-pointer">
                      {STAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <select value={m.internalStatus || ""} onChange={e => handleStatusChange(m.id, "internalStatus", e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-xs bg-white outline-none cursor-pointer">
                      {INTERNAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <button className="px-3 py-1 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255]" onClick={() => router.push("/dashboard/mandates/" + m.id)}>Open</button>
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