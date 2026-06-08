"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { STAGE_OPTIONS, INTERNAL_OPTIONS } from "@/lib/helpers";

type Candidate = { id: number; externalId: string; name: string; stage: string | null; score: number | null; hasReport: boolean | null; initials: string | null; mandateId: number; };
type Mandate = { id: number; company: string; role: string; ctc: string | null; exp: string | null; sectors: string[]; status: string | null; internalStatus: string | null; consultant: string | null; candidates: Candidate[]; };

export default function MandatesClient({ initialMandates }: { initialMandates: Mandate[] }) {
  const router = useRouter();
  const [mandates, setMandates] = useState(initialMandates);
  const [search, setSearch] = useState("");

  const filtered = mandates.filter(m =>
    m.company.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase())
  );

  async function handleStatusChange(id: number, field: "status" | "internalStatus", value: string) {
    setMandates(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    await fetch("/api/mandates/" + id, { method: "PATCH", body: JSON.stringify({ field, value }), headers: { "Content-Type": "application/json" } });
  }

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Mandates</h1>
        <Link href="/dashboard/mandates/new" className="px-4 py-2 bg-yellow-500 text-blue-900 rounded text-xs font-bold hover:bg-yellow-400">+ Add New Mandate</Link>
      </div>
      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="Search mandates..." value={search} onChange={e => setSearch(e.target.value)} className="w-56 px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-blue-900"/>
        <select className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none">
          <option value="">All Statuses</option>
          {STAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
                  <td className="px-4 py-3 font-semibold text-blue-900">{m.company}</td>
                  <td className="px-4 py-3 text-gray-700">{m.role}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{m.ctc}</td>
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
                    <button className="px-3 py-1 bg-blue-900 text-white rounded text-xs font-bold hover:bg-blue-800" onClick={() => router.push("/dashboard/mandates/" + m.id)}>Open</button>
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