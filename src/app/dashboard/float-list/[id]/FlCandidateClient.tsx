"use client";
import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addSubmissionAction, addReferenceAction, deleteFloatListEntryAction } from "@/app/actions";

function Tile({ id, icon, name, meta, content, isOpen, toggle }: any) {
  return (
    <div className="bg-white border border-[#D4E0F0] rounded-[10px] shadow-sm overflow-hidden mb-3">
      <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[#fafbfd]" onClick={() => toggle(id)}>
        <span className="text-[24px]">{icon}</span>
        <div className="flex-1">
          <div className="text-[15px] font-bold text-[#111]">{name}</div>
          <div className="text-[12px] text-[#6b7a99]">{meta}</div>
        </div>
        <span className={`text-[#D4E0F0] text-[12px] transform transition-transform ${isOpen ? "rotate-90" : ""}`}>▶</span>
      </div>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-[#D4E0F0] pt-4 mt-0">
          {content}
        </div>
      )}
    </div>
  );
}

export default function FlCandidateClient({ candidate, mandates = [] }: { candidate: any; mandates?: any[] }) {
  const router = useRouter();
  const [activeTiles, setActiveTiles] = useState<Record<string, boolean>>({});
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subForm, setSubForm] = useState({ client: "", role: "", consultant: "", mandateId: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefModalOpen, setIsRefModalOpen] = useState(false);
  const [refForm, setRefForm] = useState({ type: "Superior", name: "", org: "", rel: "", text: "" });
  const [isSubmittingRef, setIsSubmittingRef] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUploadCV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("candId", candidate.id);

    try {
      const res = await fetch("/api/upload-cv", { method: "POST", body: formData });
      if (res.ok) {
        alert("CV uploaded successfully!");
        router.refresh();
      } else {
        alert("Upload failed.");
      }
    } catch (err) {
      alert("Error uploading CV.");
    }
    setIsUploading(false);
  };

  const handleAddSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.client || !subForm.role) {
      alert("Client and Role are required");
      return;
    }
    setIsSubmitting(true);
    await addSubmissionAction({
      candId: candidate.id,
      candName: candidate.name,
      candCompany: candidate.company,
      client: subForm.client,
      role: subForm.role,
      consultant: subForm.consultant,
      mandateId: subForm.mandateId
    });
    setIsSubmitting(false);
    setIsSubModalOpen(false);
    setSubForm({ client: "", role: "", consultant: "", mandateId: "" });
  };

  const handleAddReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refForm.name || !refForm.org) {
      alert("Name and Organization are required");
      return;
    }
    setIsSubmittingRef(true);
    await addReferenceAction({
      candId: candidate.id,
      ...refForm
    });
    setIsSubmittingRef(false);
    setIsRefModalOpen(false);
    setRefForm({ type: "Superior", name: "", org: "", rel: "", text: "" });
  };

  const handleDeleteCandidate = async () => {
    if (confirm(`Are you sure you want to permanently delete ${candidate.name}? This action cannot be undone and will delete all associated references, submissions, and reports.`)) {
      setIsDeleting(true);
      await deleteFloatListEntryAction(candidate.id);
      router.push("/dashboard/float-list/database");
      router.refresh();
    }
  };

  const toggleTile = (id: string) => {
    setActiveTiles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const statusClass = candidate.status === 'Active' ? 'bg-[#e0f5e9] text-[#137a43] border-[#137a43]' :
                      candidate.status === 'Passive' ? 'bg-[#fef4e6] text-[#b36b00] border-[#b36b00]' :
                      'bg-[#fae6e6] text-[#c92a2a] border-[#c92a2a]';

  const subHistory = candidate.submissions || [];
  const refCards = candidate.references || [];

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-6 flex gap-1 cursor-pointer">
        <Link href="/dashboard" className="hover:text-[#111]">Home</Link> / 
        <Link href="/dashboard/float-list/database" className="hover:text-[#111]">Float List</Link> / 
        <span className="text-[#111]">{candidate.name}</span>
      </div>

      <div className="bg-white border border-[#D4E0F0] rounded-[10px] p-6 mb-6 shadow-sm flex items-start gap-5">
        <div className="w-16 h-16 rounded-full flex items-center justify-center font-serif text-[24px] bg-[#D8B15B] text-[#0d2f6e] flex-shrink-0">
          {candidate.initials}
        </div>
        <div className="flex-1">
          <div className="font-serif text-[22px] font-bold text-[#111] mb-1">{candidate.name}</div>
          <div className="text-[13px] font-semibold text-[#123D8D] mb-2">{candidate.designation} · {candidate.company}</div>
          <div className="flex gap-3 items-center text-[12px] text-[#6b7a99] mb-3 flex-wrap">
            {candidate.qual?.map((q: string) => (
              <span key={q} className="px-2 py-[1px] bg-[#f0f4f8] text-[#4a5568] border border-[#d1d5db] rounded-[3px] text-[10px] font-bold whitespace-nowrap">{q}</span>
            ))}
            <span>📍 {candidate.location}</span>
            <span>💼 {candidate.exp} yrs</span>
          </div>
          <div className="flex gap-2 items-center flex-wrap mb-4">
            <span className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold tracking-wide uppercase border ${statusClass}`}>{candidate.status}</span>
            {candidate.score ? (
              <span className="px-2 py-1 rounded-[4px] text-[11px] font-bold bg-[#DCE5F4] text-[#123D8D]">Score: {candidate.score}/10</span>
            ) : (
              <span className="text-[12px] text-[#6b7a99]">Not assessed</span>
            )}
            <span className="text-[12px] text-[#6b7a99]">Notice: {candidate.notice} days</span>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4">
            <div className="text-[12px]"><span className="font-bold text-[#6b7a99]">Target Company:</span> <span className="font-medium text-[#111]">{candidate.targetCompany || 'Not specified'}</span></div>
            <div className="text-[12px]"><span className="font-bold text-[#6b7a99]">LinkedIn:</span> {candidate.linkedin ? <a href={candidate.linkedin} target="_blank" className="text-[#123D8D] underline">View Profile</a> : 'Not provided'}</div>
          </div>

          {candidate.notes && (
            <div className="mb-4 p-3 bg-[#fff9ed] border border-[#f5e1b5] rounded-md text-[12px] text-[#444]">
              <span className="font-bold text-[#b38a36] block mb-1">Additional Notes</span>
              <p className="italic">"{candidate.notes}"</p>
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <Link href="/dashboard/float-list/database" className="px-3 py-1.5 rounded-md text-[12px] font-semibold text-[#6b7a99] hover:bg-[#f4f7fd] transition-all border border-[#D4E0F0]">← Back</Link>
            <button className="px-3 py-1.5 rounded-md text-[12px] font-semibold text-[#6b7a99] hover:bg-[#f4f7fd] transition-all border border-[#D4E0F0]">Add Note</button>
            <button onClick={() => setIsSubModalOpen(true)} className="px-3 py-1.5 rounded-md text-[12px] font-semibold bg-[#D8B15B] text-[#0d2f6e] hover:bg-[#e8c97a] transition-all">Submit to Client</button>
            <button className="px-3 py-1.5 rounded-md text-[12px] font-semibold text-[#6b7a99] hover:bg-[#f4f7fd] transition-all border border-[#D4E0F0]">Export</button>
            <div className="flex-1"></div>
            <button 
              onClick={handleDeleteCandidate} 
              disabled={isDeleting}
              className="px-3 py-1.5 rounded-md text-[12px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-all border border-red-200"
            >
              {isDeleting ? "Deleting..." : "Delete Candidate"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col mb-6">
        {/* Tile 1: CV */}
        <Tile 
          id="cv" icon="📄" name="CV / Resume" meta={candidate.hasCv ? '1 file uploaded' : 'No file uploaded'} 
          isOpen={activeTiles['cv']} toggle={toggleTile}
          content={
            <div>
              <div className="border-2 border-dashed border-[#D4E0F0] rounded-[10px] p-6 text-center cursor-pointer hover:border-[#123D8D] bg-[#f4f7fd] transition-colors relative mb-3">
                <input type="file" accept="application/pdf" className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" onChange={handleUploadCV} disabled={isUploading} title="Upload CV" />
                <div className="text-[24px] mb-2">📎</div>
                <div className="font-semibold text-[#111] mb-1 text-[14px]">{candidate.hasCv ? 'Replace CV' : 'Upload CV'}</div>
                <div className="text-[12px] text-[#6b7a99]">{isUploading ? 'Uploading...' : 'PDF format'}</div>
              </div>

              {candidate.hasCv && (
                <div className="flex items-center gap-2 p-2 bg-[#f4f7fd] rounded-md text-[13px] mb-3">
                  <span>📄</span>
                  <span className="flex-1 font-semibold">{candidate.cvFileName?.split('/').pop() || `${candidate.name.replace(' ', '_')}_CV.pdf`}</span>
                  <a 
                    href={candidate.cvFileName?.startsWith('http') ? candidate.cvFileName : "#"} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="px-3 py-1 bg-white text-[#123D8D] rounded text-[12px] font-bold border border-[#D4E0F0] hover:bg-gray-50 z-20"
                    onClick={(e) => {
                      if (!candidate.cvFileName?.startsWith('http')) {
                        e.preventDefault();
                        alert("File hasn't been successfully uploaded to the cloud. Please try uploading the CV again.");
                      }
                    }}
                  >
                    View / Download
                  </a>
                </div>
              )}

              {candidate.linkedinPdf && (
                <div className="flex items-center gap-2 p-2 bg-[#f0f9ff] rounded-md text-[13px] mb-3 border border-[#bae6fd]">
                  <span>📘</span>
                  <span className="flex-1 font-semibold">LinkedIn_Profile.pdf</span>
                  <a 
                    href={candidate.linkedinPdf?.startsWith('http') ? candidate.linkedinPdf : "#"} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="px-3 py-1 bg-white text-[#0369a1] rounded text-[12px] font-bold border border-[#bae6fd] hover:bg-white z-20"
                    onClick={(e) => {
                      if (!candidate.linkedinPdf?.startsWith('http')) {
                        e.preventDefault();
                        alert("LinkedIn PDF hasn't been successfully uploaded to the cloud. Please try uploading it again.");
                      }
                    }}
                  >
                    View / Download
                  </a>
                </div>
              )}

              <button className="px-3 py-1.5 rounded-md text-[12px] font-semibold text-[#6b7a99] hover:bg-[#f4f7fd] transition-all border border-[#D4E0F0]">Extract Tags via AI</button>
            </div>
          }
        />

        {/* Tile 2: Assessment */}
        <Tile 
          id="assess" icon="📊" name="View Assessment Report" meta={candidate.score ? `Score: ${candidate.score}/10` : 'Not assessed'}
          isOpen={activeTiles['assess']} toggle={toggleTile}
          content={
            candidate.score ? (
              <div>
                <div className="p-3 bg-[#DCE5F4] rounded-lg flex justify-between items-center mt-2 mb-3">
                  <span className="text-[14px] font-bold text-[#123D8D]">Overall Score</span>
                  <span className="px-2 py-1 rounded-[4px] text-[13px] font-bold bg-white text-[#123D8D]">{candidate.score}/10</span>
                </div>
                <button onClick={() => router.push(`/dashboard/workbench?flCandId=${candidate.id}`)} className="px-3 py-1.5 rounded-md text-[12px] font-semibold bg-[#123D8D] text-white hover:bg-[#0d2f6e] transition-all">Open in Workbench</button>
              </div>
            ) : (
              <div className="text-center p-5 text-[#6b7a99]">
                <div className="mb-3">No assessment completed yet</div>
                <button onClick={() => router.push(`/dashboard/workbench?flCandId=${candidate.id}`)} className="px-3 py-1.5 rounded-md text-[12px] font-semibold bg-[#123D8D] text-white hover:bg-[#0d2f6e] transition-all">Start Assessment</button>
              </div>
            )
          }
        />

        {/* Tile 3: References */}
        <Tile 
          id="refs" icon="👥" name="References" meta={`${refCards.length} references completed`}
          isOpen={activeTiles['refs']} toggle={toggleTile}
          content={
            <div>
              {refCards.map((r: { name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; type: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; org: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; rel: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; text: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }, i: Key | null | undefined) => (
                <div key={i} className="mb-3 p-3 bg-[#fafbfd] border border-[#D4E0F0] rounded-md">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[#111]">{r.name}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 bg-[#e0e5f0] text-[#444] rounded">{r.type}</span>
                  </div>
                  <div className="text-[12px] text-[#6b7a99] mb-2">{r.org} · {r.rel}</div>
                  <div className="text-[13px] text-[#444] italic">"{r.text}"</div>
                </div>
              ))}
              {refCards.length === 0 && <div className="text-[#6b7a99] text-[13px] mb-3">No references added yet.</div>}
              <button onClick={() => setIsRefModalOpen(true)} className="mt-2 px-3 py-1.5 rounded-md text-[12px] font-semibold text-[#6b7a99] hover:bg-[#f4f7fd] transition-all border border-[#D4E0F0]">+ Add Reference</button>
            </div>
          }
        />

        {/* Tile 4: Dream Jobs */}
        <Tile 
          id="dreams" icon="💼" name="Dream Jobs & Companies" meta={`${candidate.dreamRoles?.length || 0} roles · ${candidate.dreamCos?.length || 0} companies`}
          isOpen={activeTiles['dreams']} toggle={toggleTile}
          content={
            <div className="grid grid-cols-2 gap-5">
              <div>
                <div className="text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-2">DREAM ROLES</div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {candidate.dreamRoles?.map((r: string) => (
                    <span key={r} className="px-2 py-0.5 bg-[#f0f4f8] text-[#4a5568] border border-[#d1d5db] rounded-[3px] text-[11px] font-bold">{r}</span>
                  ))}
                  {!candidate.dreamRoles?.length && <span className="text-[12px] text-[#6b7a99]">None added</span>}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-2">DREAM COMPANIES</div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {candidate.dreamCos?.map((c: string) => (
                    <span key={c} className="px-2 py-0.5 bg-[#f0f4f8] text-[#4a5568] border border-[#d1d5db] rounded-[3px] text-[11px] font-bold">{c}</span>
                  ))}
                  {!candidate.dreamCos?.length && <span className="text-[12px] text-[#6b7a99]">None added</span>}
                </div>
              </div>
            </div>
          }
        />

        {/* Tile 5: Compensation */}
        <Tile 
          id="comp" icon="💰" name="Compensation & Benchmarking" meta={`Current: ₹${candidate.ctc}L · Expected: ₹${candidate.expected}L`}
          isOpen={activeTiles['comp']} toggle={toggleTile}
          content={
            <div className="grid grid-cols-4 gap-3">
              {[
                ['Current Fixed', `${candidate.currency || 'INR'} ` + Math.round(candidate.ctc * 0.85) + 'L'],
                ['Variable', `${candidate.currency || 'INR'} ` + Math.round(candidate.ctc * 0.15) + 'L'],
                ['Total Current', `${candidate.currency || 'INR'} ` + candidate.ctc + 'L'],
                ['Expected', `${candidate.currency || 'INR'} ` + candidate.expected + 'L']
              ].map(([l, v]) => (
                <div key={l} className="text-center p-3 bg-[#f4f7fd] rounded-lg">
                  <div className="text-[10px] font-bold uppercase text-[#6b7a99] tracking-wide mb-1">{l}</div>
                  <div className="font-serif text-[18px] font-bold text-[#123D8D]">{v}</div>
                </div>
              ))}
            </div>
          }
        />
      </div>

      <div className="bg-white border border-[#D4E0F0] rounded-[10px] p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <span className="font-serif text-[16px] font-bold text-[#111]">Submission History</span>
          <button onClick={() => setIsSubModalOpen(true)} className="px-3 py-1.5 rounded-md text-[12px] font-semibold bg-[#123D8D] text-white hover:bg-[#0d2f6e] transition-all">+ Add Submission</button>
        </div>
        {subHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6b7a99] border-b-2 border-[#D4E0F0] whitespace-nowrap bg-[#fafbfd]">Client</th>
                  <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6b7a99] border-b-2 border-[#D4E0F0] whitespace-nowrap bg-[#fafbfd]">Role</th>
                  <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6b7a99] border-b-2 border-[#D4E0F0] whitespace-nowrap bg-[#fafbfd]">Consultant</th>
                  <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6b7a99] border-b-2 border-[#D4E0F0] whitespace-nowrap bg-[#fafbfd]">Date Shared</th>
                  <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6b7a99] border-b-2 border-[#D4E0F0] whitespace-nowrap bg-[#fafbfd]">Status</th>
                </tr>
              </thead>
              <tbody>
                {subHistory.map((s: any) => (
                  <tr key={s.id} className="hover:bg-[#fafbff]">
                    <td className="px-3 py-2.5 border-b border-[#f0f0f0] align-middle text-[13px] font-semibold text-[#111]">{s.client}</td>
                    <td className="px-3 py-2.5 border-b border-[#f0f0f0] align-middle text-[13px]">{s.role}</td>
                    <td className="px-3 py-2.5 border-b border-[#f0f0f0] align-middle text-[13px]">{s.consultant}</td>
                    <td className="px-3 py-2.5 border-b border-[#f0f0f0] align-middle text-[13px] text-[#6b7a99]">{s.dateShared}</td>
                    <td className="px-3 py-2.5 border-b border-[#f0f0f0] align-middle text-[13px]">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#e0f5e9] text-[#137a43]">{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-6 text-center text-[#6b7a99] text-[13px]">
            No submissions yet — click "+ Add Submission" to submit this candidate to a client.
          </div>
        )}
      </div>

      {isSubModalOpen && (
        <div className="fixed inset-0 bg-[#111]/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-[10px] shadow-lg w-[400px] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D4E0F0] font-serif text-[18px] font-bold text-[#111] flex justify-between items-center">
              Submit to Client
              <button onClick={() => setIsSubModalOpen(false)} className="text-[#6b7a99] hover:text-[#111]">✕</button>
            </div>
            <form onSubmit={handleAddSubmission} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Submit to active mandate?</label>
                <select
                  value={subForm.mandateId}
                  onChange={e => {
                    const mId = e.target.value;
                    const mandate = mandates.find(m => m.id.toString() === mId);
                    if (mandate) {
                      setSubForm({...subForm, mandateId: mId, client: mandate.company, role: mandate.role});
                    } else {
                      setSubForm({...subForm, mandateId: "", client: "", role: ""});
                    }
                  }}
                  className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[13px] outline-none bg-white focus:border-[#123D8D]"
                >
                  <option value="">-- No, manual entry --</option>
                  {mandates.map(m => (
                    <option key={m.id} value={m.id}>{m.company} - {m.role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Client Company <span className="text-red-500">*</span></label>
                <input required value={subForm.client} readOnly={!!subForm.mandateId} onChange={e=>setSubForm({...subForm, client: e.target.value})} className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[13px] outline-none focus:border-[#123D8D] disabled:bg-gray-50" placeholder="E.g. HDFC Bank" />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Role <span className="text-red-500">*</span></label>
                <input required value={subForm.role} readOnly={!!subForm.mandateId} onChange={e=>setSubForm({...subForm, role: e.target.value})} className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[13px] outline-none focus:border-[#123D8D] disabled:bg-gray-50" placeholder="E.g. Chief Financial Officer" />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Consultant</label>
                <input value={subForm.consultant} onChange={e=>setSubForm({...subForm, consultant: e.target.value})} className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[13px] outline-none bg-white focus:border-[#123D8D]" placeholder="Consultant Name" />
              </div>
              <div className="flex gap-2.5 justify-end mt-2">
                <button type="button" onClick={() => setIsSubModalOpen(false)} className="px-4 py-2 rounded-md text-[13px] font-semibold text-[#6b7a99] hover:bg-[#f4f7fd] transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-md text-[13px] font-semibold bg-[#D8B15B] text-[#0d2f6e] hover:bg-[#e8c97a] transition-all">
                  {isSubmitting ? "Submitting..." : "Submit Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRefModalOpen && (
        <div className="fixed inset-0 bg-[#111]/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-[10px] shadow-lg w-[450px] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D4E0F0] font-serif text-[18px] font-bold text-[#111] flex justify-between items-center">
              Add Reference
              <button onClick={() => setIsRefModalOpen(false)} className="text-[#6b7a99] hover:text-[#111]">✕</button>
            </div>
            <form onSubmit={handleAddReference} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Type <span className="text-red-500">*</span></label>
                  <select required value={refForm.type} onChange={e=>setRefForm({...refForm, type: e.target.value})} className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[13px] outline-none bg-white focus:border-[#123D8D]">
                    <option value="Superior">Superior</option>
                    <option value="Peer">Peer</option>
                    <option value="Subordinate">Subordinate</option>
                    <option value="Client">Client</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Name <span className="text-red-500">*</span></label>
                  <input required value={refForm.name} onChange={e=>setRefForm({...refForm, name: e.target.value})} className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[13px] outline-none bg-white focus:border-[#123D8D]" placeholder="Reference Name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Organization <span className="text-red-500">*</span></label>
                  <input required value={refForm.org} onChange={e=>setRefForm({...refForm, org: e.target.value})} className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[13px] outline-none bg-white focus:border-[#123D8D]" placeholder="Company Name" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Relationship</label>
                  <input value={refForm.rel} onChange={e=>setRefForm({...refForm, rel: e.target.value})} className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[13px] outline-none bg-white focus:border-[#123D8D]" placeholder="e.g. Former Manager" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Feedback / Notes</label>
                <textarea rows={3} value={refForm.text} onChange={e=>setRefForm({...refForm, text: e.target.value})} className="w-full border-[1.5px] border-[#D4E0F0] rounded-md p-3 text-[13px] outline-none bg-white focus:border-[#123D8D] resize-none" placeholder="Reference feedback..."></textarea>
              </div>
              <div className="flex gap-2.5 justify-end mt-2">
                <button type="button" onClick={() => setIsRefModalOpen(false)} className="px-4 py-2 rounded-md text-[13px] font-semibold text-[#6b7a99] hover:bg-[#f4f7fd] transition-all">Cancel</button>
                <button type="submit" disabled={isSubmittingRef} className="px-4 py-2 rounded-md text-[13px] font-semibold bg-[#D8B15B] text-[#0d2f6e] hover:bg-[#e8c97a] transition-all">
                  {isSubmittingRef ? "Saving..." : "Add Reference"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
