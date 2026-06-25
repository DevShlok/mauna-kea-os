"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { STAGE_OPTIONS, stageLabel, formatMandateCtc } from "@/lib/helpers";
import { addCandidateToMandateAction, editMandateAction, updateMandateSearchNotesAction, updateMandateCandidateStageAction, deleteMandateAction } from "@/app/actions";

const PIPELINE_STAGES = [
  "universe","mapping","longlist","calllist","shortlist","interview","offer-sent","offer-accepted","closed",
];

export default function MandateDetailClient({ initialMandate }: { initialMandate: any }) {
  const router = useRouter();
  const [mandate, setMandate] = useState(initialMandate);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null); // "jd" | "notes" | "docs"
  const [textModal, setTextModal] = useState<{ isOpen: boolean; type: "jd" | "notes"; text: string }>({ isOpen: false, type: "jd", text: "" });
  const [searchNotes, setSearchNotes] = useState(initialMandate.searchNotes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  const [isEditingMandate, setIsEditingMandate] = useState(false);
  const [editForm, setEditForm] = useState(initialMandate);
  const [isEditingSubmit, setIsEditingSubmit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportFormat, setReportFormat] = useState("1");
  const [selectedReportCands, setSelectedReportCands] = useState<number[]>([]);

  const currentIdx = PIPELINE_STAGES.indexOf(mandate.status);

  async function handleSaveSearchNotes() {
    setIsSavingNotes(true);
    try {
      await updateMandateSearchNotesAction(mandate.id, searchNotes);
    } catch (e: any) {
      alert("Failed to save search notes: " + e.message);
    }
    setIsSavingNotes(false);
  }

  const detailRows = [
    ["CTC Range", formatMandateCtc(mandate.ctc)],
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

  async function handleDocUpload(docType: string, file: File) {
    setUploadingDoc(docType);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("docType", docType);
    formData.append("mandateName", `${mandate.company} - ${mandate.role}`);
    try {
      const res = await fetch(`/api/mandates/${mandate.id}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMandate((prev: any) => ({ 
        ...prev, 
        additionalDocsUrl: docType === "docs" ? data.url : prev.additionalDocsUrl,
        interviewNotesUrl: docType === "notes" ? data.url : prev.interviewNotesUrl,
        interviewNotesText: docType === "notes" && data.extractedText ? data.extractedText : prev.interviewNotesText,
        jdUrl: docType === "jd" ? data.url : prev.jdUrl,
        jdText: docType === "jd" && data.extractedText ? data.extractedText : prev.jdText
      }));
    } catch (e: any) {
      alert("Upload failed: " + e.message);
    }
    setUploadingDoc(null);
  }

  const handleRemoveDoc = async (docType: string) => {
    if (!confirm("Are you sure you want to remove this file link?")) return;
    setUploadingDoc(docType);
    try {
      const res = await fetch(`/api/mandates/${mandate.id}/upload`, {
        method: "DELETE",
        body: JSON.stringify({ docType }),
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error("Failed to remove link");
      window.location.reload();
    } catch(err: any) {
      alert(err.message);
    } finally {
      setUploadingDoc(null);
    }
  };

  async function handleSaveText(e: React.FormEvent) {
    e.preventDefault();
    setUploadingDoc(textModal.type);
    
    const formData = new FormData();
    formData.append("docType", textModal.type);
    formData.append("textContent", textModal.text);
    formData.append("mandateName", `${mandate.company} - ${mandate.role}`);
    
    try {
      const res = await fetch(`/api/mandates/${mandate.id}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const textColMap: Record<string, string> = { jd: "jdText", notes: "interviewNotesText" };
      const urlColMap: Record<string, string> = { jd: "jdUrl", notes: "interviewNotesUrl" };
      
      setMandate((prev: any) => ({ 
        ...prev, 
        [textColMap[textModal.type]]: textModal.text,
        [urlColMap[textModal.type]]: data.url 
      }));
    } catch (e: any) {
      alert("Save failed: " + e.message);
    }
    setUploadingDoc(null);
    setTextModal({ ...textModal, isOpen: false });
  }

  async function updateCandidateStage(mandateId: number, candId: number, stage: string) {
    setMandate((prev: any) => ({
      ...prev,
      candidates: prev.candidates.map((c: any) => c.id === candId ? { ...c, stage } : c)
    }));
    await updateMandateCandidateStageAction(candId, stage, mandateId);
  }

  // Replaced manual add with Float List redirect
  function handleAddCandidateClick() {
    router.push(`/dashboard/candidates?assignToMandate=${mandate.id}&assignClient=${encodeURIComponent(mandate.company || "")}&assignRole=${encodeURIComponent(mandate.role || "")}`);
  }

  async function handleEditMandate(e: React.FormEvent) {
    e.preventDefault();
    setIsEditingSubmit(true);
    await editMandateAction(mandate.id, editForm);
    setMandate(editForm);
    setIsEditingSubmit(false);
    setIsEditingMandate(false);
  }

  async function handleDeleteMandate() {
    if (confirm(`Are you sure you want to permanently delete the mandate for ${mandate.company} - ${mandate.role}? This will also delete all associated mandate candidates.`)) {
      setIsDeleting(true);
      await deleteMandateAction(mandate.id);
      router.push("/dashboard/mandates");
      router.refresh();
    }
  }

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex items-center gap-2 text-sm text-gray-400 font-semibold mb-6">
        <Link href="/dashboard" className="hover:text-[#133255]">Home</Link>
        <span>/</span>
        <Link href="/dashboard/mandates" className="hover:text-[#133255]">Mandates</Link>
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
          <button onClick={handleDeleteMandate} disabled={isDeleting} className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded text-xs font-bold hover:bg-red-100">{isDeleting ? "Deleting..." : "Delete"}</button>
          <button onClick={() => { setEditForm(mandate); setIsEditingMandate(true); }} className="px-4 py-2 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">Edit</button>
          <button className="px-4 py-2 bg-yellow-500 text-[#133255] rounded text-xs font-bold hover:bg-yellow-400">Send to Client Portal</button>
          <button onClick={() => setIsReportModalOpen(true)} className="px-4 py-2 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255]">Generate Report</button>
        </div>
      </div>
      <div className="flex h-10 rounded-xl overflow-hidden border border-gray-200 mb-8">
        {PIPELINE_STAGES.map((st, i) => {
          let cls = "bg-white text-gray-400";
          if (i < currentIdx) cls = "bg-blue-100 text-[#133255] font-bold";
          if (i === currentIdx) cls = "bg-[#133255] text-white font-bold";
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
          
          {/* JD as PDF/Word */}
          <div className="border border-gray-100 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-gray-800">Job Description</div>
                {mandate.jdUrl
                  ? <a href={mandate.jdUrl} target="_blank" rel="noreferrer" className="text-xs text-[#133255] underline hover:text-[#133255] mt-1 block">View in Drive ↗</a>
                  : <div className="text-xs text-gray-400">{uploadingDoc === "jd" ? "Uploading..." : "No PDF/Word uploaded"}</div>
                }
              </div>
              <label className={`px-3 py-1 border rounded text-xs font-bold cursor-pointer transition-colors ${
                uploadingDoc === "jd"
                  ? "border-gray-200 text-gray-400 cursor-not-allowed"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  disabled={uploadingDoc !== null}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleDocUpload("jd", f); e.target.value = ""; }}
                />
                {uploadingDoc === "jd" ? "Uploading..." : mandate.jdUrl ? "Replace" : "Upload File"}
              </label>
              {mandate.jdUrl && (
                <button 
                  onClick={() => handleRemoveDoc("jd")} 
                  disabled={uploadingDoc !== null}
                  className="px-2 py-1 border border-gray-200 text-red-500 hover:bg-red-50 rounded text-xs transition-colors"
                  title="Remove File"
                >
                  ❌
                </button>
              )}
            </div>
          </div>

          {/* Interview Notes as Text */}
          <div className="border border-gray-100 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-gray-800">Interview Notes</div>
                {mandate.interviewNotesText ? <div className="text-xs text-green-600 font-medium">Text saved</div> : <div className="text-xs text-gray-400">No text added</div>}
                {mandate.interviewNotesUrl && <a href={mandate.interviewNotesUrl} target="_blank" rel="noreferrer" className="text-xs text-[#133255] underline hover:text-[#133255] block mt-1">View in Drive ↗</a>}
              </div>
              <div className="flex gap-2 items-center">
                <label className={`px-3 py-1 border rounded text-xs font-bold cursor-pointer transition-colors ${
                  uploadingDoc === "notes"
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    disabled={uploadingDoc !== null}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleDocUpload("notes", f); e.target.value = ""; }}
                  />
                  {uploadingDoc === "notes" ? "Uploading..." : "Upload File"}
                </label>
                {mandate.interviewNotesUrl && (
                  <button 
                    onClick={() => handleRemoveDoc("notes")} 
                    disabled={uploadingDoc !== null}
                    className="px-2 py-1 border border-gray-200 text-red-500 hover:bg-red-50 rounded text-xs transition-colors"
                    title="Remove File"
                  >
                    ❌
                  </button>
                )}
                <button onClick={() => setTextModal({ isOpen: true, type: "notes", text: mandate.interviewNotesText || "" })} className="px-3 py-1 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">
                  {mandate.interviewNotesText ? "Edit Text" : "Add Text"}
                </button>
              </div>
            </div>
          </div>

          {/* Additional Docs as PDF/Word */}
          <div className="border border-gray-100 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-gray-800">Additional Docs</div>
                {mandate.additionalDocsUrl
                  ? <a href={mandate.additionalDocsUrl} target="_blank" rel="noreferrer" className="text-xs text-[#133255] underline hover:text-[#133255] mt-1 block">View in Drive ↗</a>
                  : <div className="text-xs text-gray-400">{uploadingDoc === "docs" ? "Uploading..." : "No PDF/Word uploaded"}</div>
                }
              </div>
              <label className={`px-3 py-1 border rounded text-xs font-bold cursor-pointer transition-colors ${
                uploadingDoc === "docs"
                  ? "border-gray-200 text-gray-400 cursor-not-allowed"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  disabled={uploadingDoc !== null}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleDocUpload("docs", f); e.target.value = ""; }}
                />
                {uploadingDoc === "docs" ? "Uploading..." : mandate.additionalDocsUrl ? "Replace" : "Upload File"}
              </label>
              {mandate.additionalDocsUrl && (
                <button 
                  onClick={() => handleRemoveDoc("docs")} 
                  disabled={uploadingDoc !== null}
                  className="px-2 py-1 border border-gray-200 text-red-500 hover:bg-red-50 rounded text-xs transition-colors"
                  title="Remove File"
                >
                  ❌
                </button>
              )}
            </div>
          </div>
          <div className="pt-2 border-t border-gray-100 flex-1 flex flex-col relative">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-bold text-gray-800">Search Notes</h4>
              {isSavingNotes && <span className="text-xs text-gray-400">Saving...</span>}
            </div>
            <textarea 
              value={searchNotes}
              onChange={e => setSearchNotes(e.target.value)}
              onBlur={handleSaveSearchNotes}
              className="flex-1 min-h-24 p-3 border border-gray-200 rounded text-sm outline-none focus:border-[#133255] resize-none" 
              placeholder="Add internal notes..."
            />
          </div>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-base">Candidate Pipeline</h3>
          <button onClick={handleAddCandidateClick} className="px-4 py-2 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255]">+ Add Candidate</button>
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
                      <div className="w-8 h-8 rounded bg-[#133255] text-white flex items-center justify-center text-xs font-bold shrink-0">{c.initials}</div>
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
                      <button className="px-3 py-1 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255]" onClick={() => router.push("/dashboard/workbench?candId=" + c.externalId + "&mandateId=" + mandate.id)}>View Report</button>
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

      {/* Text Input Modal */}
      {textModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[700px] overflow-hidden flex flex-col h-[80vh]">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900 flex justify-between items-center">
              <span>{textModal.type === "jd" ? "Job Description" : "Interview Notes"}</span>
            </div>
            <form onSubmit={handleSaveText} className="flex-1 flex flex-col p-5 overflow-hidden gap-4">
              <textarea 
                required
                value={textModal.text} 
                onChange={e => setTextModal({...textModal, text: e.target.value})} 
                className="flex-1 w-full p-4 border border-gray-200 rounded text-sm outline-none resize-none focus:border-[#133255]"
                placeholder={`Paste your ${textModal.type === "jd" ? "Job Description" : "Interview Notes"} here...`}
              />
              <div className="flex justify-end gap-2 shrink-0">
                <button type="button" onClick={() => setTextModal({ ...textModal, isOpen: false })} className="px-4 py-2 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={uploadingDoc !== null} className="px-4 py-2 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255] disabled:opacity-50">
                  {uploadingDoc !== null ? "Saving to Drive..." : "Save Text"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Mandate Modal */}
      {isEditingMandate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[500px] overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900">Edit Mandate</div>
            <form onSubmit={handleEditMandate} className="p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Company</label>
                  <input required value={editForm.company} onChange={e => setEditForm({...editForm, company: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Role</label>
                  <input required value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">CTC</label>
                  <input value={editForm.ctc || ""} onChange={e => setEditForm({...editForm, ctc: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Experience</label>
                  <input value={editForm.exp || ""} onChange={e => setEditForm({...editForm, exp: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Work Mode</label>
                  <input value={editForm.workMode || ""} onChange={e => setEditForm({...editForm, workMode: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Target Companies</label>
                  <input value={editForm.target || ""} onChange={e => setEditForm({...editForm, target: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Geography</label>
                  <input value={editForm.geography || ""} onChange={e => setEditForm({...editForm, geography: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Consultant</label>
                  <input value={editForm.consultant || ""} onChange={e => setEditForm({...editForm, consultant: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Client POC</label>
                  <input value={editForm.clientPOC || ""} onChange={e => setEditForm({...editForm, clientPOC: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none mb-2" placeholder="Name" />
                  <div className="flex gap-2">
                    <input value={editForm.pocEmail || ""} onChange={e => setEditForm({...editForm, pocEmail: e.target.value})} className="w-1/2 px-3 py-2 border border-gray-200 rounded text-sm outline-none" placeholder="Email" />
                    <input value={editForm.pocPhone || ""} onChange={e => setEditForm({...editForm, pocPhone: e.target.value})} className="w-1/2 px-3 py-2 border border-gray-200 rounded text-sm outline-none" placeholder="Phone" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsEditingMandate(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isEditingSubmit} className="px-4 py-2 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255] disabled:opacity-50">
                  {isEditingSubmit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[500px] overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900">Generate Report</div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Select Format</label>
                <div className="flex gap-4">
                  <label className="flex-1 border border-gray-200 rounded-lg p-3 cursor-pointer flex flex-col gap-1 items-center hover:border-blue-500">
                    <input type="radio" name="format" value="1" checked={reportFormat === "1"} onChange={(e) => setReportFormat(e.target.value)} className="mb-2" />
                    <span className="text-sm font-bold text-gray-800 text-center">Multi-Candidate</span>
                    <span className="text-[12px] text-gray-500 text-center">Shortlist format (Horizontal)</span>
                  </label>
                  <label className="flex-1 border border-gray-200 rounded-lg p-3 cursor-pointer flex flex-col gap-1 items-center hover:border-blue-500">
                    <input type="radio" name="format" value="2" checked={reportFormat === "2"} onChange={(e) => setReportFormat(e.target.value)} className="mb-2" />
                    <span className="text-sm font-bold text-gray-800 text-center">Single Profile</span>
                    <span className="text-[12px] text-gray-500 text-center">Detailed format (Vertical)</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Select Candidates</label>
                <div className="max-h-[200px] overflow-y-auto border border-gray-200 rounded p-2 flex flex-col gap-2">
                  {mandate.candidates.map((c: any) => (
                    <label key={c.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedReportCands.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedReportCands([...selectedReportCands, c.id]);
                          else setSelectedReportCands(selectedReportCands.filter(id => id !== c.id));
                        }}
                      />
                      <span className="text-sm text-gray-800">{c.name}</span>
                      <span className="text-xs text-gray-400">({c.company})</span>
                      {!c.hasReport && <span className="text-[12px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded ml-auto">No Draft</span>}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setIsReportModalOpen(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">Cancel</button>
                <button 
                  onClick={() => {
                    if (selectedReportCands.length === 0) return alert("Select at least one candidate");
                    router.push(`/dashboard/mandates/${mandate.id}/report?format=${reportFormat}&cands=${selectedReportCands.join(",")}`);
                  }}
                  className="px-4 py-2 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255]"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
