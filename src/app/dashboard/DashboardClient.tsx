"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, Users, FileText, IndianRupee } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { FunnelChart } from "@/components/ui/FunnelChart";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getClosurePercent, getDaysOpen } from "@/lib/helpers";

const FUNNEL_DATA = [
  { label: "Mapped", count: 42, color: "#4a7ab5" },
  { label: "Assessed", count: 28, color: "#133255" },
  { label: "Shortlisted", count: 18, color: "#D8B15B" },
  { label: "Interviewing", count: 9, color: "#1a4fa8" },
  { label: "Offered", count: 3, color: "#1A7340" },
];

type Candidate = { id: number; externalId: string; name: string; company: string | null; role: string | null; stage: string | null; score: number | null; hasReport: boolean | null; initials: string | null; mandateId: number; };
type Mandate = { id: number; company: string; role: string; status: string | null; consultant: string | null; opened: string | null; candidates: Candidate[]; };

export default function DashboardClient({ mandates }: { mandates: Mandate[] }) {
  const router = useRouter();

  const awaiting = mandates
    .flatMap((m) => m.candidates.filter((c) => c.hasReport && c.stage === "shortlist").map((c) => ({ ...c, mRole: m.role, mCompany: m.company, mId: m.id, consultant: m.consultant })))
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-6 max-w-screen-xl mx-auto pb-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Mandates" value={mandates.length} trend="Current engagements" icon={<ClipboardList size={18} />} />
        <StatCard label="Candidates Assessed" value={mandates.flatMap(m => m.candidates).filter(c => c.score).length} trend="With AI scores" icon={<Users size={18} />} />
        <StatCard label="Reports Pending" value={mandates.flatMap(m => m.candidates).filter(c => !c.hasReport).length} trend="Awaiting report" icon={<FileText size={18} />} warn />
        <StatCard label="Revenue Forecast" value="2.4Cr" trend="Q2 projection" icon={<IndianRupee size={18} />} gold />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-base">Portfolio Pipeline</h2>
            <p className="text-gray-400 text-xs mt-0.5">Candidate distribution across stages</p>
          </div>
          <div className="p-5"><FunnelChart data={FUNNEL_DATA} total={42} /></div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-base">Awaiting Approval</h2>
            <p className="text-gray-400 text-xs mt-0.5">Reports ready for review</p>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-2 text-left text-xs font-bold text-gray-400 uppercase">Candidate</th>
              <th className="px-4 py-2 text-left text-xs font-bold text-gray-400 uppercase">Mandate</th>
              <th className="px-4 py-2 text-left text-xs font-bold text-gray-400 uppercase">Consultant</th>
              <th className="px-4 py-2 text-left text-xs font-bold text-gray-400 uppercase">Action</th>
            </tr></thead>
            <tbody>
              {awaiting.length > 0 ? awaiting.map((c, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-[#133255] text-white flex items-center justify-center text-xs font-bold">{c.initials}</div>
                      <span className="font-semibold text-[#133255] text-sm">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.mRole} at {c.mCompany}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.consultant}</td>
                  <td className="px-4 py-3">
                    <Link href={"/dashboard/workbench?candId=" + c.externalId + "&mandateId=" + c.mId} className="px-3 py-1 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255]">Review</Link>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="text-center text-gray-400 py-8 text-sm">No pending approvals</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-gray-900 text-base">Active Mandates</h2>
            <p className="text-gray-400 text-xs mt-0.5">Current search engagements</p>
          </div>
          <Link href="/dashboard/mandates/new" className="px-4 py-2 bg-yellow-500 text-[#133255] rounded text-xs font-bold hover:bg-yellow-400">+ New Mandate</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Company</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Days Open</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase w-36">Closure</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Action</th>
            </tr></thead>
            <tbody>
              {mandates.map((m) => {
                const closure = getClosurePercent(m.status || "");
                const days = getDaysOpen(m.opened || "");
                return (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer" onClick={() => router.push("/dashboard/mandates/" + m.id)}>
                    <td className="px-4 py-4 font-semibold text-[#133255]">{m.company}</td>
                    <td className="px-4 py-4 text-gray-600">{m.role}</td>
                    <td className="px-4 py-4"><StatusBadge status={m.status || "universe"} /></td>
                    <td className="px-4 py-4 text-gray-500">{days} days</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-[#133255] h-full rounded-full" style={{ width: closure + "%" }} />
                        </div>
                        <span className="text-xs text-gray-400 w-8">{closure}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button className="px-3 py-1 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255]" onClick={(e) => { e.stopPropagation(); router.push("/dashboard/mandates/" + m.id); }}>Open</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}