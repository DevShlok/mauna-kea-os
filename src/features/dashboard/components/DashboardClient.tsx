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
        className="neo-card p-7 text-white relative overflow-hidden flex justify-between items-center"
        style={{ background: "linear-gradient(135deg, #0d2444 0%, #1a4270 50%, #133255 100%)" }}
      >
        {/* Aurora orbs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #4a9eff, transparent 70%)' }} />
        <div className="absolute -bottom-8 left-1/3 w-36 h-36 rounded-full opacity-8 blur-2xl pointer-events-none" style={{ background: 'radial-gradient(circle, #D8B15B, transparent 70%)' }} />
        <div className="relative z-10">
          <p className="text-[#D8B15B]/80 text-[11px] font-bold uppercase tracking-widest mb-1">Executive Search OS</p>
          <h1 className="text-[26px] font-bold font-serif mb-1.5 leading-tight">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.platformUser?.name?.split(' ')[0] || 'Consultant'}!
          </h1>
          <p className="text-white/65 text-[13px]">Here is a summary of your portfolio and active mandates.</p>
        </div>
        <span
          className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest text-[#133255] shrink-0 hidden sm:flex items-center gap-2"
          style={{ background: "linear-gradient(135deg, #D8B15B, #f0c96a)", boxShadow: "0 4px 14px rgba(216,177,91,0.4)" }}
        >
          MK OS
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
          <div className="p-6 border-b border-slate-200/60 flex items-start gap-3">
            <div className="w-1 h-8 rounded-full shrink-0" style={{ background: "linear-gradient(180deg, #D8B15B, #f0c96a)" }} />
            <div>
              <h2 className="font-bold text-[#133255] text-[16px]">Portfolio Pipeline</h2>
              <p className="text-slate-500 text-[12px] mt-0.5 font-medium">Candidate distribution across stages</p>
            </div>
          </div>
          <div className="p-6"><FunnelChart data={funnelData} total={funnelTotal} /></div>
        </div>

        <div
          className="neo-card overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-slate-200/60 flex items-start gap-3">
            <div className="w-1 h-8 rounded-full shrink-0" style={{ background: "linear-gradient(180deg, #f97316, #ea580c)" }} />
            <div>
              <h2 className="font-bold text-[#133255] text-[16px]">Awaiting Approval</h2>
              <p className="text-slate-500 text-[12px] mt-0.5 font-medium">Reports ready for review</p>
            </div>
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
                  <tr key={i} className="neo-table-row border-b border-slate-200/50 last:border-b-0">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-xl font-serif text-[11px] font-bold text-[#D8B15B] flex items-center justify-center shrink-0"
                          style={{ background: "linear-gradient(135deg, #133255, #1d4d82)", boxShadow: "0 3px 10px rgba(19,50,85,0.25)" }}
                        >
                          {c.initials}
                        </div>
                        <span className="font-bold text-[#133255] text-[13px]">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-[12px] font-medium">{c.mRole} at {c.mCompany}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-[12px]">{c.consultant}</td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={"/dashboard/workbench?candId=" + c.externalId + "&mandateId=" + c.mId}
                        className="neo-btn-primary px-3.5 py-1.5 text-[11px] font-bold tracking-wide transition-all inline-block hover:-translate-y-0.5"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="text-center text-slate-400 py-10 text-[13px] font-medium">✓ No pending approvals</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        className="neo-card overflow-hidden"
      >
        <div className="p-6 border-b border-slate-200/60 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-start gap-3">
            <div className="w-1 h-8 rounded-full shrink-0 mt-0.5" style={{ background: "linear-gradient(180deg, #133255, #1d4d82)" }} />
            <div>
              <h2 className="font-bold text-[#133255] text-[16px]">Active Mandates</h2>
              <p className="text-slate-500 text-[12px] mt-0.5 font-medium">Current search engagements</p>
            </div>
          </div>
          <Link
            href="/dashboard/mandates/new"
            className="neo-btn-gold px-5 py-2 text-[12px] font-bold text-[#133255] transition-all inline-flex items-center gap-1.5"
          >
            <span className="text-lg leading-none">+</span> New Mandate
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
                  <tr key={m.id} className="neo-table-row border-b border-slate-200/50 last:border-b-0">
                    <td className="px-5 py-4">
                      <Link href={"/dashboard/mandates?id=" + m.id} className="font-bold text-[#133255] hover:text-[#1d4d82] block text-[13px] hover:underline">
                        {m.role}
                      </Link>
                      <span className="text-slate-500 text-[11px] font-medium">{m.company}</span>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={m.status || "Active"} /></td>
                    <td className="px-5 py-4 text-slate-600 text-[12px] font-medium">{m.consultant || "—"}</td>
                    <td className="px-5 py-4">
                      <span className="neo-card-xs px-2.5 py-1 text-[11px] font-bold text-[#133255] inline-block">
                        {m.candidates.length} mapped
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[11px] text-slate-400 font-medium tabular-nums">
                      {days}d · {closure}%
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={"/dashboard/mandates?id=" + m.id}
                        className="neo-btn-primary px-3.5 py-1.5 text-[11px] font-bold tracking-wide transition-all inline-block hover:-translate-y-0.5"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} className="text-center text-slate-400 py-10 text-[13px] font-medium">No active mandates</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}