"use client";
import { confirmDialog } from "@/components/ConfirmDialog";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addSubmissionAction, updateSubmissionAction, deleteSubmissionAction } from "@/actions";

const STATUS_COLORS: Record<string, string> = {
  Shortlisted: "bg-green-100 text-green-800",
  Interviewing: "bg-blue-100 text-[#133255]",
  Shared: "bg-yellow-100 text-yellow-800",
  "Under Review": "bg-purple-100 text-purple-800",
};

export default function SubmissionsClient({ initialSubmissions }: { initialSubmissions: any[] }) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ candName: "", candId: "", client: "", role: "" });
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submissions Tracker</h1>
        <button onClick={() => setIsAdding(true)} className="px-4 py-2 bg-yellow-500 text-[#133255] rounded text-xs font-bold hover:bg-yellow-400">+ Add Submission</button>
      </div>
      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="Search submissions..." className="w-56 px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-[#133255]"/>
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
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer" onClick={() => { setSelectedSubmission(s); setEditForm(s); }}>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">{s.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#133255]">{s.candName}</td>
                    <td className="px-4 py-3 text-gray-600">{s.role}<br/><span className="text-gray-400 text-xs">{s.client}</span></td>
                    <td className="px-4 py-3 text-gray-500">{s.consultant}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.dateShared}</td>
                    <td className="px-4 py-3">
                      <input 
                        type="text" 
                        className="w-full text-xs p-1 bg-transparent border border-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 rounded outline-none" 
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
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      <input 
                        type="date" 
                        className="w-full text-xs p-1 bg-transparent border border-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 rounded outline-none text-gray-500 cursor-pointer" 
                        value={s.followUp || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          setSubmissions(submissions.map((sub: any) => sub.id === s.id ? { ...sub, followUp: e.target.value } : sub));
                        }}
                        onBlur={async (e) => {
                          await updateSubmissionAction(s.id, { followUp: e.target.value });
                        }}
                      />
                    </td>
                    <td className="px-4 py-3"><span className={"px-2 py-0.5 rounded-full text-xs font-bold " + colorCls}>{s.status}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      <input 
                        type="text" 
                        className="w-full text-xs p-1 bg-transparent border border-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 rounded outline-none text-gray-500" 
                        placeholder="Enter client response..."
                        value={s.response || ""}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        onChange={(e) => {
                          setSubmissions(submissions.map((sub: any) => sub.id === s.id ? { ...sub, response: e.target.value } : sub));
                        }}
                        onBlur={async (e) => {
                          await updateSubmissionAction(s.id, { response: e.target.value });
                        }}
                      />
                    </td>
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
                <button type="submit" className="px-4 py-2 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255]">Add Submission</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[450px] overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="font-bold text-gray-900">Submission Details</div>
              <div className="flex gap-2">
                <button 
                  onClick={() => router.push("/dashboard/candidates/" + selectedSubmission.candId)}
                  className="text-xs text-[#133255] font-bold hover:underline"
                >
                  View Profile
                </button>
                <button 
                  onClick={() => router.push("/dashboard/float-list/" + selectedSubmission.candId)}
                  className="text-xs text-purple-600 font-bold hover:underline"
                >
                  Submission History
                </button>
              </div>
            </div>
            <div className="p-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Candidate Name</label>
                <input value={editForm.candName || ""} onChange={e => setEditForm({...editForm, candName: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Target Company</label>
                  <input value={editForm.client || ""} onChange={e => setEditForm({...editForm, client: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Target Role</label>
                  <input value={editForm.role || ""} onChange={e => setEditForm({...editForm, role: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Consultant Name</label>
                  <input value={editForm.consultant || ""} onChange={e => setEditForm({...editForm, consultant: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Status</label>
                  <select value={editForm.status || "Shared"} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white">
                    <option value="Shared">Shared</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Hired">Hired</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <button 
                disabled={isDeleting}
                onClick={async () => {
                  if (!await confirmDialog("Are you sure you want to delete this submission? It will also be removed from the Mandate Pipeline.")) return;
                  setIsDeleting(true);
                  await deleteSubmissionAction(selectedSubmission.id);
                  setSubmissions(submissions.filter((s: any) => s.id !== selectedSubmission.id));
                  setIsDeleting(false);
                  setSelectedSubmission(null);
                }} 
                className="px-4 py-2 border border-red-200 text-red-500 rounded text-xs font-bold hover:bg-red-50 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
              <div className="flex gap-2">
                <button onClick={() => setSelectedSubmission(null)} className="px-4 py-2 text-gray-500 font-semibold text-xs hover:text-gray-700">Cancel</button>
                <button 
                  disabled={isSaving}
                  onClick={async () => {
                    setIsSaving(true);
                    await updateSubmissionAction(selectedSubmission.id, {
                      candName: editForm.candName,
                      client: editForm.client,
                      role: editForm.role,
                      consultant: editForm.consultant,
                      status: editForm.status
                    });
                    setSubmissions(submissions.map((s: any) => s.id === selectedSubmission.id ? { ...s, ...editForm } : s));
                    setIsSaving(false);
                    setSelectedSubmission(null);
                  }} 
                  className="px-4 py-2 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255] disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
