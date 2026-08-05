"use client";

import { confirmDialog } from "@/components/ConfirmDialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addSubmissionAction, updateSubmissionAction, deleteSubmissionAction } from "@/actions";
import { useDataTable } from "@/hooks/useDataTable";
import { Pagination } from "@/components/DataTable/Pagination";

const STATUS_COLORS: Record<string, string> = {
  Shortlisted: "bg-green-100 text-green-800",
  Interviewing: "bg-blue-100 text-[#133255]",
  Shared: "bg-yellow-100 text-yellow-800",
  "Under Review": "bg-purple-100 text-purple-800",
};

export default function SubmissionsClient({ initialSubmissions }: { initialSubmissions: any[] }) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const _dt = useDataTable({ data: submissions, defaultSortKey: "id", defaultSortDir: "desc" });
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ candName: "", candId: "", client: "", role: "" });
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const shortlistedCount = submissions.filter((s: any) => s.status === 'Shortlisted').length;
  const interviewingCount = submissions.filter((s: any) => s.status === 'Interviewing').length;
  const sharedCount = submissions.filter((s: any) => s.status === 'Shared' || s.status === 'Under Review').length;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 pb-10 pt-6">
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[26px] font-serif font-bold text-[#133255] tracking-tight">
            Submissions Tracker
          </h1>
          <p className="text-[13.5px] text-[#6b7a99] mt-1">
            {submissions.length.toLocaleString()} total client submissions
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="h-10 px-5 neo-btn text-[#133255] text-[13.5px] font-bold transition-all flex items-center gap-2"
        >
          + Add Submission
        </button>
      </div>

      {/* ── KPI Stat Cards ─────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { label: "Total Submissions", value: submissions.length, color: "text-[#133255]" },
          { label: "Shared / Under Review", value: sharedCount, color: "text-[#b7791f]" },
          { label: "Interviewing", value: interviewingCount, color: "text-[#2a44a0]" },
          { label: "Shortlisted", value: shortlistedCount, color: "text-[#127a41]" },
        ].map((kpi, i) => (
          <div
            key={i}
            className="flex-1 min-w-[150px] neo-card-sm px-6 py-4 transition-transform hover:-translate-y-0.5"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {kpi.label}
            </div>
            <div className={`text-[24px] font-serif font-bold ${kpi.color}`}>
              {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Bar ──────────────────────────── */}
      <div className="neo-card mb-6 p-2 relative z-10">
        <div className="flex flex-wrap gap-3 items-center p-1">
          <div className="flex-1 flex items-center gap-2.5 px-4 py-2 min-w-[220px] neo-inset">
            <input
              type="text"
              placeholder="Search submissions..."
              className="flex-1 text-[14px] font-bold text-slate-800 bg-transparent outline-none placeholder-slate-400"
            />
          </div>
          <select className="px-4 h-10 neo-inset text-sm text-slate-700 font-semibold outline-none min-w-[140px]">
            <option>All Statuses</option>
            <option>Shared</option>
            <option>Under Review</option>
            <option>Shortlisted</option>
            <option>Interviewing</option>
          </select>
          <select className="px-4 h-10 neo-inset text-sm text-slate-700 font-semibold outline-none min-w-[150px]">
            <option>All Consultants</option>
            <option>Priya Menon</option>
            <option>Amit Sharma</option>
            <option>Sanya Rao</option>
          </select>
        </div>
      </div>

      <div className="rounded-[32px] overflow-hidden" style={{ background: "#eef2f7", boxShadow: "12px 12px 24px #cbd5e1, -12px -12px 24px #ffffff" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-300/40">
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">ID</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Candidate</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Client / Role</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Consultant</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date Shared</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Via</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Follow-Up</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Response</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s: any) => {
                const colorCls = STATUS_COLORS[s.status || ""] || "bg-slate-200 text-slate-700";
                return (
                  <tr key={s.id} className="border-b border-slate-300/20 last:border-b-0 hover:bg-slate-200/40 transition-colors cursor-pointer" onClick={() => { setSelectedSubmission(s); setEditForm(s); }}>
                    <td className="px-5 py-3.5 text-slate-500 text-xs font-mono">{s.id}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{s.candName}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{s.role}<br/><span className="text-slate-400 text-xs">{s.client}</span></td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs font-medium">{s.consultant}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs font-medium">{s.dateShared}</td>
                    <td className="px-5 py-3.5">
                      <input 
                        type="text" 
                        className="w-full text-xs p-1 bg-transparent border border-transparent hover:border-slate-300 hover:bg-white focus:bg-white focus:border-blue-500 rounded outline-none" 
                        placeholder="e.g. Email, WhatsApp"
                        value={(s.via || []).join(", ")}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        onChange={(e) => {
                          const val = e.target.value.split(",").map(v=>v.trim()).filter(Boolean);
                          setSubmissions(submissions.map((sub: any) => sub.id === s.id ? { ...sub, via: val } : sub));
                        }}
                        onBlur={async (e) => {
                          const val = e.target.value.split(",").map(v=>v.trim()).filter(Boolean);
                          await updateSubmissionAction(s.id, { via: val });
                        }}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs font-medium">{s.lastFollowUp || "-"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colorCls}`}>{s.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs font-medium">{s.clientResponse || "-"}</td>
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
