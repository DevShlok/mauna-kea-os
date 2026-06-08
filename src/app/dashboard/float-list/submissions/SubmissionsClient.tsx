"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addSubmissionAction } from "@/app/actions";

const STATUS_COLORS: Record<string, string> = {
  Shortlisted: "bg-green-100 text-green-800",
  Interviewing: "bg-blue-100 text-blue-800",
  Shared: "bg-yellow-100 text-yellow-800",
  "Under Review": "bg-purple-100 text-purple-800",
};

export default function SubmissionsClient({ initialSubmissions }: { initialSubmissions: any[] }) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ candName: "", candId: "", client: "", role: "" });

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submissions Tracker</h1>
        <button onClick={() => setIsAdding(true)} className="px-4 py-2 bg-yellow-500 text-blue-900 rounded text-xs font-bold hover:bg-yellow-400">+ Add Submission</button>
      </div>
      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="Search submissions..." className="w-56 px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-blue-900"/>
        <select className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none">
          <option>All Statuses</option>
          <option>Shared</option>
          <option>Under Review</option>
          <option>Shortlisted</option>
          <option>Interviewing</option>
        </select>
        <select className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none">
          <option>All Consultants</option>
          <option>Priya Menon</option>
          <option>Amit Sharma</option>
          <option>Sanya Rao</option>
        </select>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Candidate</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Client / Role</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Consultant</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Date Shared</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Via</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Follow-Up</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Response</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s: any) => {
                const colorCls = STATUS_COLORS[s.status || ""] || "bg-gray-100 text-gray-600";
                return (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer" onClick={() => router.push("/dashboard/float-list/" + s.candId)}>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">{s.id}</td>
                    <td className="px-4 py-3 font-semibold text-blue-900">{s.candName}</td>
                    <td className="px-4 py-3 text-gray-600">{s.role}<br/><span className="text-gray-400 text-xs">{s.client}</span></td>
                    <td className="px-4 py-3 text-gray-500">{s.consultant}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.dateShared}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(s.via || []).map((v: string) => (<span key={v} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{v}</span>))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{s.followUp}</td>
                    <td className="px-4 py-3"><span className={"px-2 py-0.5 rounded-full text-xs font-bold " + colorCls}>{s.status}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{s.response}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[400px] overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900">Add New Submission</div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!form.candName) return;
              const { id: newId, candId } = await addSubmissionAction(form);
              
              setSubmissions([{
                id: newId,
                candName: form.candName,
                candId: candId,
                client: form.client,
                role: form.role,
                consultant: "System",
                dateShared: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
                status: "Shared",
                via: []
              }, ...submissions]);

              setIsAdding(false);
              setForm({ candName: "", candId: "", client: "", role: "" });
              router.refresh();
            }} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Candidate Name *</label>
                <input required value={form.candName} onChange={e => setForm({...form, candName: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Candidate ID</label>
                <input value={form.candId} onChange={e => setForm({...form, candId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" placeholder="e.g. CAND-123" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Client Company</label>
                <input value={form.client} onChange={e => setForm({...form, client: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Role / Position</label>
                <input value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-900 text-white rounded text-xs font-bold hover:bg-blue-800">Add Submission</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
