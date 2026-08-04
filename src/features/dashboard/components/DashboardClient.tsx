"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, Users, FileText, IndianRupee } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { FunnelChart } from "@/components/ui/FunnelChart";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getClosurePercent, getDaysOpen } from "@/lib/helpers";

type Candidate = { id: number; externalId: string; name: string; stage: string | null; score: number | null; hasReport: boolean | null; initials: string | null; mandateId: number; isSentToClient: boolean | null; };
type Mandate = { id: number; company: string; role: string; status: string | null; consultant: string | null; opened: string | null; candidates: Candidate[]; };

export default function DashboardClient({ mandates, totalCandidates, user }: { mandates: Mandate[], totalCandidates: number, user: any }) {
  const router = useRouter();

  const allCands = mandates.flatMap(m => m.candidates);

  const funnelData = [
    { label: "Mapped", count: 0, color: "#4a7ab5" },
    { label: "Assessed", count: 0, color: "#133255" },
    { label: "Shortlisted", count: 0, color: "#D8B15B" },
    { label: "Interviewing", count: 0, color: "#1a4fa8" },
    { label: "Offered", count: 0, color: "#1A7340" },
  ];

  allCands.forEach(c => {
    if (['universe', 'mapping', 'longlist', 'calllist'].includes(c.stage || '')) funnelData[0].count++;
    if (c.score || c.hasReport) funnelData[1].count++;
    if (c.stage === 'shortlist') funnelData[2].count++;
    if (c.stage === 'interview') funnelData[3].count++;
    if (['offer-sent', 'offer-accepted', 'closed'].includes(c.stage || '')) funnelData[4].count++;
  });

  const funnelTotal = funnelData[0].count || 1; // avoid div by zero if mapped is 0

  const awaiting = mandates
    .flatMap((m) => m.candidates.filter((c) => c.hasReport && c.stage === "shortlist").map((c) => ({ ...c, mRole: m.role, mCompany: m.company, mId: m.id, consultant: m.consultant })))
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-6 max-w-screen-xl mx-auto pb-10">
      
      {/* Welcome Banner */}
      <div
        className="neo-card p-6 text-white relative overflow-hidden flex justify-between items-center"
        style={{
          background: "linear-gradient(135deg, #133255 0%, #1d4d82 100%)",
        }}
      >
        <div className="relative z-10">
          <h1 className="text-2xl font-bold font-serif mb-1">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.platformUser?.name?.split(' ')[0] || 'Consultant'}!
          </h1>
          <p className="text-white/80 text-sm">Here is a summary of your portfolio and active mandates.</p>
        </div>
        <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#D8B15B] bg-white/10 border border-white/20 shrink-0 hidden sm:block">
          Executive OS
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <StatCard label="Active Mandates" value={mandates.length} trend="Current engagements" icon={<ClipboardList size={20} />} />
        <StatCard label="Candidates Assessed" value={allCands.filter(c => c.score || c.hasReport).length} trend="With AI scores" icon={<Users size={20} />} />
        <StatCard label="Reports Pending" value={allCands.filter(c => !c.hasReport).length} trend="Awaiting report" icon={<FileText size={20} />} warn />
        <StatCard label="Candidates in DB" value={totalCandidates} trend="Total Talent Pool" icon={<Users size={20} />} gold />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div
          className="neo-card overflow-hidden"
        >
          <div className="p-6 border-b border-slate-300/40">
            <h2 className="font-bold text-slate-800 text-base">Portfolio Pipeline</h2>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">Candidate distribution across stages</p>
          </div>
          <div className="p-6"><FunnelChart data={funnelData} total={funnelTotal} /></div>
        </div>

        <div
          className="neo-card overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-slate-300/40">
            <h2 className="font-bold text-slate-800 text-base">Awaiting Approval</h2>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">Reports ready for review</p>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300/40">
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Candidate</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Mandate</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Consultant</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {awaiting.length > 0 ? awaiting.map((c, i) => (
                  <tr key={i} className="border-b border-slate-300/20 last:border-b-0 hover:bg-slate-200/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl font-serif text-xs font-bold text-[#D8B15B] flex items-center justify-center shrink-0"
                          style={{ background: "linear-gradient(135deg, #133255, #1d4d82)" }}
                        >
                          {c.initials}
                        </div>
                        <span className="font-bold text-slate-800 text-sm">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs font-medium">{c.mRole} at {c.mCompany}</td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs font-medium">{c.consultant}</td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={"/dashboard/workbench?candId=" + c.externalId + "&mandateId=" + c.mId}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white tracking-wide transition-all inline-block hover:-translate-y-0.5 neo-btn"
                        style={{
                          background: "linear-gradient(135deg, #133255, #1d4d82)",
                        }}
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="text-center text-slate-500 py-8 text-sm font-medium">No pending approvals</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        className="neo-card overflow-hidden"
      >
        <div className="p-6 border-b border-slate-300/40 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-slate-800 text-base">Active Mandates</h2>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">Current search engagements</p>
          </div>
          <Link
            href="/dashboard/mandates/new"
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#133255] transition-all hover:-translate-y-0.5 neo-btn"
            style={{
              background: "linear-gradient(135deg, #D8B15B, #f0c96a)",
            }}
          >
            + New Mandate
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-300/40">
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Role / Company</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Consultant</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Candidates</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Closure</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {mandates.length > 0 ? mandates.map((m) => {
                const closure = getClosurePercent(m.status || "");
                const days = getDaysOpen(m.opened || "");
                return (
                  <tr key={m.id} className="border-b border-slate-300/20 last:border-b-0 hover:bg-slate-200/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={"/dashboard/mandates?id=" + m.id} className="font-bold text-slate-800 hover:text-[#133255] block text-sm">
                        {m.role}
                      </Link>
                      <span className="text-slate-500 text-xs font-medium">{m.company}</span>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={m.status || "Active"} /></td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs font-medium">{m.consultant || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-bold text-slate-700 inline-block"
                        style={{ background: "#eef2f7", boxShadow: "inset 2px 2px 4px #cbd5e1, inset -2px -2px 4px #ffffff" }}
                      >
                        {m.candidates.length} mapped
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-medium">
                      {days}d open ({closure}%)
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={"/dashboard/mandates?id=" + m.id}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white tracking-wide transition-all inline-block hover:-translate-y-0.5"
                        style={{
                          background: "linear-gradient(135deg, #133255, #1d4d82)",
                          boxShadow: "3px 3px 6px #cbd5e1, -3px -3px 6px #ffffff",
                        }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} className="text-center text-slate-500 py-8 text-sm font-medium">No active mandates</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}