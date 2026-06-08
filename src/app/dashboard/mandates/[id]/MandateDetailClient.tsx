"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { STAGE_OPTIONS, stageLabel } from "@/lib/helpers";
import { addCandidateToMandateAction } from "@/app/actions";

const PIPELINE_STAGES = [
  "universe","mapping","longlist","calllist","shortlist","interview","offer-sent","offer-accepted","closed",
];

export default function MandateDetailClient({ initialMandate }: { initialMandate: any }) {
  const router = useRouter();
  const [mandate, setMandate] = useState(initialMandate);
  const [isAddingCand, setIsAddingCand] = useState(false);
  const [newCand, setNewCand] = useState({ name: "", role: "", company: "" });

  const currentIdx = PIPELINE_STAGES.indexOf(mandate.status);

  const detailRows = [
    ["CTC Range", mandate.ctc],
    ["Experience", mandate.exp],
    ["Target Sectors", mandate.sectors.join(", ")],
    ["Geography", mandate.geography],
    ["Work Mode", mandate.workMode],
    ["Opened", mandate.opened],
    ["Target Close", mandate.target],
    ["Consultant", mandate.consultant],
    ["Client POC", mandate.clientPOC],
    ["POC Email", mandate.pocEmail],
    ["POC Phone", mandate.pocPhone],
  ];

  async function updateCandidateStage(mandateId: number, candId: number, stage: string) {
    setMandate((prev: any) => ({
      ...prev,
      candidates: prev.candidates.map((c: any) => c.id === candId ? { ...c, stage } : c)
    }));
    await fetch("/api/candidates/" + candId, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage })
    });
  }

  async function handleAddCandidate(e: React.FormEvent) {
    e.preventDefault();
    if (!newCand.name) return;
    
    // Optimistic ID just for UI until refresh
    const tempId = Date.now();
    const extId = "CAND" + Math.floor(Math.random() * 1000);
    
    await addCandidateToMandateAction({
      mandateId: mandate.id,
      externalId: extId,
      name: newCand.name,
      role: newCand.role,
      company: newCand.company,
    });
    
    setIsAddingCand(false);
    setNewCand({ name: "", role: "", company: "" });
    // In a real app we'd refresh the server component, but we can also manually add it to state so it shows up instantly:
    setMandate((prev: any) => ({
      ...prev,
      candidates: [...prev.candidates, {
        id: tempId,
        externalId: extId,
        name: newCand.name,
        role: newCand.role,
        company: newCand.company,
        stage: "universe",
        initials: newCand.name.substring(0, 2).toUpperCase()
      }]
    }));
  }

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex items-center gap-2 text-sm text-gray-400 font-semibold mb-6">
        <Link href="/dashboard" className="hover:text-blue-900">Home</Link>
        <span>/</span>
        <Link href="/dashboard/mandates" className="hover:text-blue-900">Mandates</Link>
        <span>/</span>
        <span className="text-gray-800">{mandate.company} - {mandate.role}</span>
      </div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{mandate.company} - {mandate.role}</h1>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={mandate.status} />
            <StatusBadge status={mandate.internalStatus} type="internal" />
            <span className="text-xs text-gray-400 font-semibold ml-1">Lead: {mandate.consultant}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">Edit</button>
          <button className="px-4 py-2 bg-yellow-500 text-blue-900 rounded text-xs font-bold hover:bg-yellow-400">Send to Client Portal</button>
          <button className="px-4 py-2 bg-blue-900 text-white rounded text-xs font-bold hover:bg-blue-800">Generate Report</button>
        </div>
      </div>
      <div className="flex h-10 rounded-xl overflow-hidden border border-gray-200 mb-8">
        {PIPELINE_STAGES.map((st, i) => {
          let cls = "bg-white text-gray-400";
          if (i < currentIdx) cls = "bg-blue-100 text-blue-800 font-bold";
          if (i === currentIdx) cls = "bg-blue-900 text-white font-bold";
          return (
            <div key={st} className={"flex-1 flex items-center justify-center text-xs uppercase tracking-wide border-r border-gray-200 last:border-r-0 " + cls}>
              {stageLabel(st)}
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-base mb-4">Mandate Details</h3>
          <div className="divide-y divide-gray-50">
            {detailRows.map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 text-sm">
                <span className="text-gray-400">{k}</span>
                <span className="font-semibold text-gray-800 text-right">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <h3 className="font-bold text-gray-900 text-base">Documents</h3>
          {[["Job Description","jd"],["Interview Notes","notes"],["Additional Docs","docs"]].map(([label, docId]) => (
            <div key={docId} className="flex justify-between items-center border border-gray-100 rounded-lg p-3">
              <div>
                <div className="text-sm font-semibold text-gray-800">{label}</div>
                <div className="text-xs text-gray-400">Click to upload</div>
              </div>
              <button className="px-3 py-1 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">Upload</button>
            </div>
          ))}
          <div className="pt-2 border-t border-gray-100 flex-1 flex flex-col">
            <h4 className="text-sm font-bold text-gray-800 mb-2">Search Notes</h4>
            <textarea className="flex-1 min-h-24 p-3 border border-gray-200 rounded text-sm outline-none focus:border-blue-900 resize-none" placeholder="Add internal notes..."/>
          </div>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-base">Candidate Pipeline</h3>
          <button onClick={() => setIsAddingCand(true)} className="px-4 py-2 bg-blue-900 text-white rounded text-xs font-bold hover:bg-blue-800">+ Add Candidate</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Candidate</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Score</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Report</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mandate.candidates.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-gray-400 py-10">No candidates yet</td></tr>
              ) : mandate.candidates.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-900 text-white flex items-center justify-center text-xs font-bold shrink-0">{c.initials}</div>
                      <div>
                        <div className="font-semibold text-gray-800">{c.name}</div>
                        <div className="text-xs text-gray-400">{c.role} - {c.company}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select value={c.stage || ""} onChange={(e) => updateCandidateStage(mandate.id, c.id, e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-xs bg-white outline-none cursor-pointer">
                      {STAGE_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {c.score ? (
                      <span className={"px-2 py-0.5 rounded-full text-xs font-bold " + (c.score >= 8 ? "bg-green-100 text-green-800" : c.score >= 6.5 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-700")}>{c.score}/10</span>
                    ) : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.hasReport ? (
                      <button className="px-3 py-1 bg-blue-900 text-white rounded text-xs font-bold hover:bg-blue-800" onClick={() => router.push("/dashboard/workbench?candId=" + c.externalId + "&mandateId=" + mandate.id)}>View Report</button>
                    ) : <span className="text-gray-300 text-xs">No report</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-2 py-1 border border-gray-200 text-gray-500 rounded text-xs font-bold hover:bg-gray-50">Profile</button>
                      <button className="px-2 py-1 border border-gray-200 text-gray-500 rounded text-xs font-bold hover:bg-gray-50">Export</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Candidate Modal */}
      {isAddingCand && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[400px] overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900">Add New Candidate</div>
            <form onSubmit={handleAddCandidate} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Full Name</label>
                <input required value={newCand.name} onChange={e => setNewCand({...newCand, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Current Role</label>
                <input value={newCand.role} onChange={e => setNewCand({...newCand, role: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Current Company</label>
                <input value={newCand.company} onChange={e => setNewCand({...newCand, company: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setIsAddingCand(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-900 text-white rounded text-xs font-bold hover:bg-blue-800">Add to Pipeline</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
