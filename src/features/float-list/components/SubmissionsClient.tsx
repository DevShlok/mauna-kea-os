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

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-serif text-slate-800">Submissions Tracker</h1>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs text-[#133255] transition-all hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #D8B15B, #f0c96a)",
            boxShadow: "3px 3px 6px #cbd5e1, -3px -3px 6px #ffffff",
          }}
        >
          + Add Submission
        </button>
      </div>

      <div className="flex gap-3 mb-6 p-4 rounded-[28px]" style={{ background: "#eef2f7", boxShadow: "10px 10px 20px #cbd5e1, -10px -10px 20px #ffffff" }}>
        <input
          type="text"
          placeholder="Search submissions..."
          className="w-64 px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-800 bg-[#eef2f7] outline-none placeholder-slate-400"
          style={{ boxShadow: "inset 4px 4px 8px #cbd5e1, inset -4px -4px 8px #ffffff" }}
        />
        <select
          className="px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-800 bg-[#eef2f7] outline-none"
          style={{ boxShadow: "inset 3px 3px 6px #cbd5e1, inset -3px -3px 6px #ffffff" }}
        >
          <option>All Statuses</option>
          <option>Shared</option>
          <option>Under Review</option>
          <option>Shortlisted</option>
          <option>Interviewing</option>
        </select>
        <select
          className="px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-800 bg-[#eef2f7] outline-none"
          style={{ boxShadow: "inset 3px 3px 6px #cbd5e1, inset -3px -3px 6px #ffffff" }}
        >
          <option>All Consultants</option>
          <option>Priya Menon</option>
          <option>Amit Sharma</option>
          <option>Sanya Rao</option>
        </select>
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
