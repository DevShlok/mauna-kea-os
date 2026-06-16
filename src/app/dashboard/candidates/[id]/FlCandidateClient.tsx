"use client";
import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addSubmissionAction, addReferenceAction, deleteFloatListEntryAction, logCandidateActivityAction } from "@/app/actions";
import { useUser } from "@clerk/nextjs";

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
  const { user } = useUser();
  const getInitialFiles = () => {
    let files = candidate?.files ? [...candidate.files] : [];
    
    if (candidate?.hasCv && candidate?.cvFileName?.startsWith('http')) {
      const hasCvInFiles = files.some((f: any) => f.fileType.toLowerCase().includes('cv') || f.fileType.toLowerCase().includes('resume'));
      if (!hasCvInFiles) {
        files.push({
          id: -1,
          fileType: 'CV / Resume',
          fileName: candidate.cvFileName.split('/').pop() || 'Legacy_CV.pdf',
          fileUrl: candidate.cvFileName,
          createdAt: candidate.createdAt || new Date().toISOString()
        });
      }
    }

    if (candidate?.linkedinPdf && candidate?.linkedinPdf.startsWith('http')) {
      const hasLiInFiles = files.some((f: any) => f.fileType.toLowerCase().includes('linkedin'));
      if (!hasLiInFiles) {
        files.push({
          id: -2,
          fileType: 'LinkedIn Profile',
          fileName: 'Legacy_LinkedIn.pdf',
          fileUrl: candidate.linkedinPdf,
          createdAt: candidate.createdAt || new Date().toISOString()
        });
      }
    }
    return files;
  };

  const [activeTiles, setActiveTiles] = useState<Record<string, boolean>>({'cv': true});
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subForm, setSubForm] = useState({ client: "", role: "", consultant: "", mandateId: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLinkedin, setIsUploadingLinkedin] = useState(false);
  const [isRefModalOpen, setIsRefModalOpen] = useState(false);
  const [refForm, setRefForm] = useState({ type: "Superior", name: "", org: "", rel: "", text: "" });
  const [isSubmittingRef, setIsSubmittingRef] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [candidateFiles, setCandidateFiles] = useState<any[]>(getInitialFiles());
  const [deleteConfirmation, setDeleteConfirmation] = useState<{fileId: number, fileName: string} | null>(null);

  const [activeLogTab, setActiveLogTab] = useState("Meeting");
  const [logForm, setLogForm] = useState({ note: "", type: "In-person meeting", meetingFor: "Exploration", emailType: "Email received from Candidate with Resume/ showing interest", clientName: "", roleName: "", date: "", time: "" });
  const [isLogging, setIsLogging] = useState(false);

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.note) return;
    setIsLogging(true);
    let logType = activeLogTab;
    let finalNote = logForm.note;
    
    if (activeLogTab === "Meeting") {
      logType = `Meeting (${logForm.type})`;
      const consultantName = user?.fullName || "Consultant";
      const formattedDate = logForm.date 
        ? new Date(logForm.date).toLocaleDateString("en-GB", {day: "2-digit", month: "short", year: "2-digit"}).replace(/ /g, '-')
        : "Unknown date";
      const timeStr = logForm.time ? ` ${logForm.time}` : "";
      const meetingForStr = logForm.meetingFor.toLowerCase();
      finalNote = `${consultantName} consultant met ${candidate.name} candidate on ${formattedDate}${timeStr} for ${meetingForStr}.\n\nNotes: ${logForm.note}`;
    }
    else if (activeLogTab === "Email") {
      logType = `Email: ${logForm.emailType}`;
      if (logForm.emailType === "Email sent to Client for profile") {
        const consultantName = user?.fullName || "Consultant";
        const formattedDate = logForm.date 
          ? new Date(logForm.date).toLocaleDateString("en-GB", {day: "2-digit", month: "short", year: "2-digit"}).replace(/ /g, '-')
          : "Unknown date";
        const timeStr = logForm.time ? ` ${logForm.time}` : "";
        finalNote = `${candidate.name} (candidate) profile sent to ${logForm.clientName} Client for ${logForm.roleName} role on ${formattedDate}${timeStr} by ${consultantName} (consultant).\n\nNotes: ${logForm.note}`;
      }
    }
    else if (activeLogTab === "Event") logType = `Event`;
    
    try {
      await logCandidateActivityAction({
        candId: candidate.id,
        type: logType,
        note: finalNote,
        date: logForm.date,
        time: logForm.time,
        consultant: user?.fullName || "System"
      });
      setLogForm({ note: "", type: "In-person meeting", meetingFor: "Exploration", emailType: "Email received from Candidate with Resume/ showing interest", clientName: "", roleName: "", date: "", time: "" });
      alert("Activity logged successfully!");
      router.refresh();
    } catch (err: any) {
      alert(`Error logging activity: ${err.message}`);
    }
    setIsLogging(false);
  };

  const handleDeleteFile = async (fileId: number, fileName: string) => {
    setDeleteConfirmation({ fileId, fileName });
  };

  const confirmDeleteFile = async () => {
    if (!deleteConfirmation) return;
    const { fileId } = deleteConfirmation;
    try {
      const res = await fetch(`/api/candidate-files?id=${fileId}`, { method: 'DELETE' });
      if (res.ok) {
        setCandidateFiles(prev => prev.filter(f => f.id !== fileId));
      } else {
        alert("Failed to delete file");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting file");
    } finally {
      setDeleteConfirmation(null);
    }
  };

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
        const data = await res.json();
        // Optimistically add the file to the list
        setCandidateFiles(prev => [...prev, {
          id: Math.random(), // Temporary ID until page reload
          fileType: 'CV / Resume',
          fileName: `${candidate.name} - CV.pdf`,
          fileUrl: data.url,
          createdAt: new Date().toISOString()
        }]);
        alert("CV uploaded successfully!");
        router.refresh();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Upload failed: ${errData.error || res.statusText}`);
      }
    } catch (err: any) {
      alert(`Error uploading CV: ${err.message}`);
    }
    setIsUploading(false);
    e.target.value = '';
  };

  const handleUploadLinkedIn = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLinkedin(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("candId", candidate.id);

    try {
      const res = await fetch("/api/upload-linkedin-pdf", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setCandidateFiles(prev => [...prev, {
          id: Math.random(),
          fileType: 'LinkedIn Profile',
          fileName: `${candidate.name} - LinkedIn.pdf`,
          fileUrl: data.url,
          createdAt: new Date().toISOString()
        }]);
        alert("LinkedIn PDF uploaded successfully!");
        router.refresh();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Upload failed: ${errData.error || res.statusText}`);
      }
    } catch (err: any) {
      alert(`Error uploading LinkedIn PDF: ${err.message}`);
    }
    setIsUploadingLinkedin(false);
    e.target.value = '';
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
      consultant: "Sahil Bhatia",
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
      router.push("/dashboard/candidates");
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
        <Link href="/dashboard/candidates" className="hover:text-[#111]">Candidate DB</Link> / 
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
            {candidate.qual?.map((q: any, idx: number) => {
              if (typeof q === 'string') {
                return <span key={idx} className="px-2 py-[1px] bg-[#f0f4f8] text-[#4a5568] border border-[#d1d5db] rounded-[3px] text-[10px] font-bold whitespace-nowrap">{q}</span>;
              }
              return (
                <span key={idx} className="px-2 py-[1px] bg-[#f0f4f8] text-[#4a5568] border border-[#d1d5db] rounded-[3px] text-[10px] whitespace-nowrap">
                  <span className="font-bold">{q.degree}</span>
                  {(q.institute || q.year) && <span> · {q.institute}{q.institute && q.year ? ' · ' : ''}{q.year}</span>}
                </span>
              );
            })}
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
            <Link href="/dashboard/candidates" className="px-3 py-1.5 rounded-md text-[12px] font-semibold text-[#6b7a99] hover:bg-[#f4f7fd] transition-all border border-[#D4E0F0]">← Back</Link>
            <button onClick={() => setIsSubModalOpen(true)} className="px-3 py-1.5 rounded-md text-[12px] font-semibold bg-[#D8B15B] text-[#0d2f6e] hover:bg-[#e8c97a] transition-all">Submit to Client</button>
            <button className="px-3 py-1.5 rounded-md text-[12px] font-semibold text-[#6b7a99] hover:bg-[#f4f7fd] transition-all border border-[#D4E0F0]">Export</button>
            <div className="flex-1"></div>
            <Link href={`/dashboard/candidates/${candidate.id}/edit`} className="px-3 py-1.5 rounded-md text-[12px] font-semibold text-[#123D8D] bg-[#DCE5F4] hover:bg-[#c5d3ec] transition-all border border-[#bacce6]">Edit Profile</Link>
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
          id="cv" icon="📄" name="Documents & Files" meta={candidateFiles.length > 0 ? `${candidateFiles.length} file(s) uploaded` : 'No files uploaded'} 
          isOpen={activeTiles['cv']} toggle={toggleTile}
          content={
            <div>
              <div className="flex gap-3 mb-4">
                <label className="flex-1 px-4 py-2 bg-[#DCE5F4] text-[#123D8D] rounded-lg text-[13px] font-bold cursor-pointer hover:bg-[#c5d3ec] transition-colors text-center border border-[#bacce6]">
                  <input type="file" accept="application/pdf" className="hidden" onChange={handleUploadLinkedIn} disabled={isUploadingLinkedin} />
                  {isUploadingLinkedin ? 'Uploading...' : '📘 Upload LinkedIn Profile'}
                </label>
                <label className="flex-1 px-4 py-2 bg-[#123D8D] text-white rounded-lg text-[13px] font-bold cursor-pointer hover:bg-[#0d2f6e] transition-colors text-center shadow-sm">
                  <input type="file" accept="application/pdf,.doc,.docx" className="hidden" onChange={handleUploadCV} disabled={isUploading} />
                  {isUploading ? 'Uploading...' : '📄 Upload CV / Resume'}
                </label>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-4 py-2 border-r border-gray-200 w-32">Type</th>
                      <th className="px-4 py-2 border-r border-gray-200 w-32">Date</th>
                      <th className="px-4 py-2 border-r border-gray-200">File</th>
                      <th className="px-4 py-2 w-16 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {candidateFiles.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-400 italic">
                          No files uploaded yet.
                        </td>
                      </tr>
                    ) : (
                      candidateFiles.map((file) => {
                        const dateStr = new Date(file.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-');
                        return (
                          <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2 border-r border-gray-200 font-medium text-gray-900">{file.fileType}</td>
                            <td className="px-4 py-2 border-r border-gray-200 text-gray-600">{dateStr}</td>
                            <td className="px-4 py-2 border-r border-gray-200">
                              <a href={file.fileUrl} target="_blank" rel="noreferrer" className="text-[#123D8D] hover:underline hover:text-blue-800 break-all">
                                {file.fileName}
                              </a>
                            </td>
                            <td className="px-4 py-2 text-center">
                              {file.id > 0 ? (
                                <button 
                                  onClick={() => handleDeleteFile(file.id, file.fileName)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
                                  title="Delete File"
                                >
                                  ❌
                                </button>
                              ) : (
                                <span className="text-gray-400 text-xs" title="Legacy files cannot be deleted from here">--</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <button className="px-3 py-1.5 rounded-md text-[12px] font-semibold text-[#6b7a99] hover:bg-[#f4f7fd] transition-all border border-[#D4E0F0]">Extract Tags via AI</button>
              </div>
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
          id="comp" icon="💰" name="Compensation & Benchmarking" meta={`Current: ₹${candidate.ctc >= 100 ? (candidate.ctc / 100).toFixed(1).replace(/\.0$/, '') + 'Cr' : candidate.ctc + 'L'} · Expected: ₹${candidate.expected >= 100 ? (candidate.expected / 100).toFixed(1).replace(/\.0$/, '') + 'Cr' : candidate.expected + 'L'}`}
          isOpen={activeTiles['comp']} toggle={toggleTile}
          content={
            <div className="grid grid-cols-4 gap-3">
              {[
                ['Current Fixed', candidate.fixedCtc ? (`${candidate.currency || 'INR'} ` + (candidate.fixedCtc >= 100 ? (candidate.fixedCtc / 100).toFixed(1).replace(/\.0$/, '') + 'Cr' : candidate.fixedCtc + 'L')) : '-'],
                ['Variable', candidate.variableCtc ? (`${candidate.currency || 'INR'} ` + (candidate.variableCtc >= 100 ? (candidate.variableCtc / 100).toFixed(1).replace(/\.0$/, '') + 'Cr' : candidate.variableCtc + 'L')) : '-'],
                ['Total Current', `${candidate.currency || 'INR'} ` + (candidate.ctc >= 100 ? (candidate.ctc / 100).toFixed(1).replace(/\.0$/, '') + 'Cr' : candidate.ctc + 'L')],
                ['Expected', `${candidate.currency || 'INR'} ` + (candidate.expected >= 100 ? (candidate.expected / 100).toFixed(1).replace(/\.0$/, '') + 'Cr' : candidate.expected + 'L')]
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

      <div className="bg-white border border-[#D4E0F0] rounded-[10px] p-5 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-5">
          <span className="font-serif text-[16px] font-bold text-[#111]">Conversation & Activity Log</span>
          <span className="text-[12px] font-bold uppercase tracking-wide text-[#6b7a99] bg-[#f4f7fd] px-2.5 py-1 rounded-md">{candidate?.activities?.length || 0} activities recorded</span>
        </div>
        
        <div className="flex flex-col gap-5">
          {/* Tabs */}
          <div className="flex border-b border-[#D4E0F0]">
            {["Meeting", "Email", "Event"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveLogTab(tab)}
                className={`px-4 py-2.5 text-[13px] font-bold border-b-2 ${activeLogTab === tab ? 'border-[#123D8D] text-[#123D8D]' : 'border-transparent text-[#6b7a99] hover:text-[#111]'}`}
              >
                {tab === "Meeting" ? "🗣️ Log a meeting" : tab === "Email" ? "✉️ Log an email" : "📅 Add follow up"}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <form onSubmit={handleLogActivity} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4 flex flex-col gap-4">
            {activeLogTab === "Meeting" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Meeting Type <span className="text-red-500">*</span></label>
                  <select required value={logForm.type} onChange={e=>setLogForm({...logForm, type: e.target.value})} className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[13px] outline-none bg-white focus:border-[#123D8D]">
                    <option value="In-person meeting">In-person meeting</option>
                    <option value="Phone call">Phone call</option>
                    <option value="Video call">Video call</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Meeting For <span className="text-red-500">*</span></label>
                  <select required value={logForm.meetingFor} onChange={e=>setLogForm({...logForm, meetingFor: e.target.value})} className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[13px] outline-none bg-white focus:border-[#123D8D]">
                    <option value="Exploration">Exploration</option>
                    <option value="Discuss about potential position">Discuss about potential position</option>
                    <option value="Job brief">Job brief</option>
                    <option value="Interview preparation/ set up">Interview preparation/ set up</option>
                    <option value="Interview feedback">Interview feedback</option>
                    <option value="Offer conversation">Offer conversation</option>
                  </select>
                </div>
              </div>
            )}
            {activeLogTab === "Email" && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Email Type <span className="text-red-500">*</span></label>
                  <select required value={logForm.emailType} onChange={e=>setLogForm({...logForm, emailType: e.target.value})} className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[13px] outline-none bg-white focus:border-[#123D8D]">
                    <option value="Email received from Candidate with Resume/ showing interest">Email received from Candidate with Resume/ showing interest</option>
                    <option value="Contract- NDA for confidential roles">Contract- NDA for confidential roles</option>
                    <option value="Email sent to Client for profile">Email sent to Client for profile</option>
                    <option value="Offer acceptance email from future employer">Offer acceptance email from future employer</option>
                    <option value="Resignation & resignation acceptance email from current employes">Resignation & resignation acceptance email from current employes</option>
                    <option value="Joining confirmation (On DOJ)">Joining confirmation (On DOJ)</option>
                  </select>
                </div>
                {logForm.emailType === "Email sent to Client for profile" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Client Name <span className="text-red-500">*</span></label>
                      <input required type="text" value={logForm.clientName} onChange={e=>setLogForm({...logForm, clientName: e.target.value})} placeholder="e.g. ABC Ltd" className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[13px] outline-none bg-white focus:border-[#123D8D]" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Role <span className="text-red-500">*</span></label>
                      <input required type="text" value={logForm.roleName} onChange={e=>setLogForm({...logForm, roleName: e.target.value})} placeholder="e.g. Finance controller" className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[13px] outline-none bg-white focus:border-[#123D8D]" />
                    </div>
                  </div>
                )}
              </div>
            )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Date</label>
                  <input type="date" value={logForm.date} onChange={e=>setLogForm({...logForm, date: e.target.value})} className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[13px] outline-none bg-white focus:border-[#123D8D]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Time</label>
                  <input type="time" value={logForm.time} onChange={e=>setLogForm({...logForm, time: e.target.value})} className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[13px] outline-none bg-white focus:border-[#123D8D]" />
                </div>
              </div>
            <div>
              <label className="block text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">
                {activeLogTab === "Email" ? "Email Body / Notes" : "Notes / Description"} <span className="text-red-500">*</span>
              </label>
              <textarea required rows={3} value={logForm.note} onChange={e=>setLogForm({...logForm, note: e.target.value})} className="w-full border-[1.5px] border-[#D4E0F0] rounded-md p-3 text-[13px] outline-none bg-white focus:border-[#123D8D] resize-vertical" placeholder={`Enter ${activeLogTab.toLowerCase()} details here...`}></textarea>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={isLogging} className="px-5 py-2 rounded-md text-[13px] font-bold bg-[#123D8D] text-white hover:bg-[#0d2f6e] transition-all">
                {isLogging ? "Saving..." : `Save ${activeLogTab}`}
              </button>
            </div>
          </form>

          {/* Activity Timeline */}
          <div className="mt-4">
            <h4 className="text-[14px] font-bold text-[#111] mb-4">Activity Timeline</h4>
            <div className="flex flex-col gap-0">
              {candidate?.activities?.length > 0 ? [...candidate.activities].sort((a,b) => b.id - a.id).map((act: any, idx: number) => (
                <div key={act.id} className="flex gap-4 relative pb-6 group">
                  {idx !== candidate.activities.length - 1 && <div className="absolute top-8 bottom-0 left-[19px] w-[2px] bg-[#e2e8f0] group-hover:bg-[#cbd5e1] transition-colors"></div>}
                  <div className="w-10 h-10 rounded-full bg-[#f1f5f9] border-2 border-[#e2e8f0] flex items-center justify-center shrink-0 z-10 text-[16px]">
                    {act.type.includes('Meeting') ? '🗣️' : act.type.includes('Email') ? '✉️' : act.type.includes('Task') ? '✅' : '📅'}
                  </div>
                  <div className="flex-1 bg-white border border-[#e2e8f0] rounded-lg p-4 shadow-sm group-hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-[13px] font-bold text-[#111]">{act.type}</div>
                        <div className="text-[11px] font-medium text-[#6b7a99] mt-0.5">Logged by {act.consultant}</div>
                      </div>
                      <div className="text-[11px] font-semibold text-[#94a3b8] bg-[#f8fafc] px-2 py-1 rounded">
                        {act.date} {act.time && `at ${act.time}`}
                      </div>
                    </div>
                    <div className="text-[13px] text-[#475569] leading-relaxed whitespace-pre-wrap">{act.note}</div>
                  </div>
                </div>
              )) : (
                <div className="text-[13px] text-[#6b7a99] italic text-center py-4 bg-[#f8fafc] rounded-lg border border-dashed border-[#cbd5e1]">No activities logged yet.</div>
              )}
            </div>
          </div>

        </div>
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
                  <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6b7a99] border-b-2 border-[#D4E0F0] whitespace-nowrap bg-[#fafbfd]">Type</th>
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
                    <td className="px-3 py-2.5 border-b border-[#f0f0f0] align-middle text-[13px]">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.type === 'Mandate' ? 'bg-[#eef2ff] text-[#4f46e5]' : 'bg-[#fff7ed] text-[#ea580c]'}`}>
                        {s.type}
                      </span>
                    </td>
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
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-[#111]/50 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-[10px] shadow-lg w-[400px] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D4E0F0] font-serif text-[18px] font-bold text-[#111] flex justify-between items-center">
              Delete File
              <button onClick={() => setDeleteConfirmation(null)} className="text-[#6b7a99] hover:text-[#111]">✕</button>
            </div>
            <div className="p-5">
              <p className="text-[14px] text-[#4a5568] mb-6">
                Are you sure you want to permanently delete <strong>{deleteConfirmation.fileName}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setDeleteConfirmation(null)}
                  className="px-4 py-2 border border-[#D4E0F0] rounded-[6px] text-[#4a5568] text-[13px] font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteFile}
                  className="px-4 py-2 bg-red-600 text-white rounded-[6px] text-[13px] font-bold hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
