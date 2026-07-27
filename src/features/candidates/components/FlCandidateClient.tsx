"use client";
import { confirmDialog } from "@/components/ConfirmDialog";
import toast from "react-hot-toast";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  addSubmissionAction, 
  addReferenceAction, 
  deleteFloatListEntryAction, 
  logCandidateActivityAction, 
  toggleActivityPinAction, 
  resolveClientRemarkAction, 
  bulkAssignToMandateAction, 
  bulkAddToEngagementListAction 
} from "@/actions";
import { convertToClientContactAction, updatePastCompaniesAction } from "@/actions/candidates";
import { formatCtcValue } from "@/lib/helpers";
import { createClient } from "@/utils/supabase/client";
import { Pin, Download, User, FileText, CheckSquare, Target, Briefcase, IndianRupee, MapPin, Building2, Brain, Link as LinkIcon, Edit, Trash2, ArrowLeft, Plus } from "lucide-react";

import { useWidgetLayout } from "@/hooks/useWidgetLayout";
import { WidgetCard } from "@/components/ui/WidgetCard";

import { Responsive } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

function withWidthProvider(ComposedComponent: any) {
  return function WidthProviderWrapper(props: any) {
    const [width, setWidth] = useState(1200);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (ref.current) setWidth(ref.current.offsetWidth);
      const onResize = () => { if (ref.current) setWidth(ref.current.offsetWidth); };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, []);
    return (
      <div ref={ref} style={{ width: "100%" }}>
        <ComposedComponent width={width} {...props} />
      </div>
    );
  };
}

const ResponsiveGridLayout = withWidthProvider(Responsive);

export default function FlCandidateClient({ 
  candidate, 
  mandates = [], 
  userRole = "consultant", 
  readOnly = false, 
  clientRemarks = [], 
  allClients = [] 
}: { 
  candidate: any; 
  mandates?: any[]; 
  userRole?: string; 
  readOnly?: boolean; 
  clientRemarks?: any[]; 
  allClients?: any[] 
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // Layout hook
  const {
    widgets,
    isLocked,
    setIsLocked,
    onLayoutChange,
    toggleCollapse,
    resetLayout,
    publishAsOrgDefault,
    isAdmin
  } = useWidgetLayout(userRole);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser({ fullName: user?.user_metadata?.full_name || user?.email });
    };
    fetchUser();
  }, []);

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

  // State
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subForm, setSubForm] = useState({ client: "", role: "", consultant: "", mandateId: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLinkedin, setIsUploadingLinkedin] = useState(false);
  const [candidateFiles, setCandidateFiles] = useState<any[]>(getInitialFiles());
  const [deleteConfirmation, setDeleteConfirmation] = useState<{fileId: number, fileName: string} | null>(null);

  const [isRefModalOpen, setIsRefModalOpen] = useState(false);
  const [refForm, setRefForm] = useState({ type: "Superior", name: "", org: "", rel: "", text: "" });
  const [isSubmittingRef, setIsSubmittingRef] = useState(false);

  const [submittingNotes, setSubmittingNotes] = useState<{ [key: number]: boolean }>({});
  const [localRemarks, setLocalRemarks] = useState<any[]>(clientRemarks);

  const [isMandateModalOpen, setIsMandateModalOpen] = useState(false);
  const [mandateIdToAssign, setMandateIdToAssign] = useState("");

  const [isDeleting, setIsDeleting] = useState(false);

  const [activeLogTab, setActiveLogTab] = useState("Meeting");
  const [logForm, setLogForm] = useState({ note: "", type: "In-person meeting", meetingFor: "Exploration", emailType: "Email received from Candidate with Resume/ showing interest", clientName: "", roleName: "", date: "", time: "" });
  const [isLogging, setIsLogging] = useState(false);
  const [localActivities, setLocalActivities] = useState(candidate?.activities || []);

  const [isClientContactModalOpen, setIsClientContactModalOpen] = useState(false);
  const [clientContactForm, setClientContactForm] = useState({ clientId: "", name: candidate.name || "", designation: candidate.designation || "", number: candidate.mobile || "", email: candidate.email || "" });
  const [isConvertingClient, setIsConvertingClient] = useState(false);

  const [isPastCompanyModalOpen, setIsPastCompanyModalOpen] = useState(false);
  const [pastCompanyInput, setPastCompanyInput] = useState("");
  const [localPastCompanies, setLocalPastCompanies] = useState<string[]>(candidate.pastCompanies || []);
  const [isUpdatingPastCompanies, setIsUpdatingPastCompanies] = useState(false);

  useEffect(() => {
    setLocalActivities(candidate?.activities || []);
  }, [candidate?.activities]);

  // Handlers
  const handleAddToMandate = async () => {
    if (!mandateIdToAssign) return toast.error("Please select a mandate.");
    const mandate = mandates.find((m: any) => m.id.toString() === mandateIdToAssign);
    if (!mandate) return;
    setIsSubmitting(true);
    try {
      await bulkAssignToMandateAction({ mandateId: Number(mandateIdToAssign), candIds: [candidate.id], role: mandate.role });
      setIsMandateModalOpen(false);
      setMandateIdToAssign("");
      toast.success("Candidate added to mandate successfully!");
      router.refresh();
    } catch (e) {
      toast.error("Failed to assign candidate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToBdList = async () => {
    setIsSubmitting(true);
    try {
      const res = await bulkAddToEngagementListAction([candidate.id], "BD");
      if (res.duplicateCount > 0) toast.success(`Candidate moved to Today's view.`);
      if (res.addedCount > 0) toast.success(`Added candidate to BD List!`);
      router.refresh();
    } catch (e) {
      toast.error("Failed to add to BD List.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToCallingList = async () => {
    setIsSubmitting(true);
    try {
      const res = await bulkAddToEngagementListAction([candidate.id], "Calling");
      if (res.duplicateCount > 0) toast.success(`Candidate moved to Today's view.`);
      if (res.addedCount > 0) toast.success(`Added candidate to Calling List!`);
      router.refresh();
    } catch (e) {
      toast.error("Failed to add to Calling List.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFloatSubmit = async () => {
    setIsSubmitting(true);
    try {
      const existingStr = localStorage.getItem("fl_pending_cands") || "[]";
      const existing = JSON.parse(existingStr);
      if (!existing.includes(candidate.id)) {
        existing.push(candidate.id);
        localStorage.setItem("fl_pending_cands", JSON.stringify(existing));
      }
      toast.success("Added to floating batch.");
      router.push("/dashboard/float-list");
    } catch (e) {
      toast.error("Error generating float link");
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCandidate = async () => {
    toast.success("Exporting...");
    const ExcelJS = (await import('exceljs')).default;
    const { saveAs } = await import('file-saver');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Candidate');
    worksheet.columns = [{ header: 'Name', key: 'name', width: 25 }, { header: 'Current Company', key: 'company', width: 25 }];
    worksheet.addRow({ name: candidate.name, company: candidate.company });
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${candidate.name || 'Candidate'}_Export.xlsx`);
  };

  const handleResolveRemark = async (id: number, status: string) => {
    setSubmittingNotes({ ...submittingNotes, [id]: true });
    try {
      await resolveClientRemarkAction(id, status, `Your remark for ${candidate.name} has been marked as ${status}.`);
      setLocalRemarks(localRemarks.map(r => r.id === id ? { ...r, status } : r));
      router.refresh();
    } finally {
      setSubmittingNotes({ ...submittingNotes, [id]: false });
    }
  };

  const handleTogglePin = async (id: number, currentPinned: boolean) => {
    setLocalActivities((prev: any[]) => prev.map((a: any) => a.id === id ? { ...a, isPinned: !currentPinned } : a));
    await toggleActivityPinAction(id, !currentPinned);
  };

  const handleConvertToClientContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientContactForm.clientId) return toast.error("Please select a client.");
    setIsConvertingClient(true);
    try {
      await convertToClientContactAction(candidate.id, clientContactForm.clientId, {
        name: clientContactForm.name, designation: clientContactForm.designation,
        number: clientContactForm.number, email: clientContactForm.email
      });
      toast.success("Converted to Client Contact!");
      setIsClientContactModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to convert");
    } finally {
      setIsConvertingClient(false);
    }
  };

  const handleAddPastCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastCompanyInput.trim()) return;
    const newArr = [...localPastCompanies, pastCompanyInput.trim()];
    setIsUpdatingPastCompanies(true);
    try {
      await updatePastCompaniesAction(candidate.id, newArr);
      setLocalPastCompanies(newArr);
      setPastCompanyInput("");
      toast.success("Added past company");
    } catch (err: any) {
      toast.error(err.message || "Failed to update past companies");
    } finally {
      setIsUpdatingPastCompanies(false);
    }
  };

  const handleRemovePastCompany = async (company: string) => {
    const newArr = localPastCompanies.filter(c => c !== company);
    try {
      await updatePastCompaniesAction(candidate.id, newArr);
      setLocalPastCompanies(newArr);
      toast.success("Removed past company");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove");
    }
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.note) return;
    setIsLogging(true);
    let logType = activeLogTab;
    let finalNote = logForm.note;
    
    if (activeLogTab === "Meeting") {
      logType = `Meeting (${logForm.type})`;
      const formattedDate = logForm.date ? new Date(logForm.date).toLocaleDateString("en-GB", {day: "2-digit", month: "short", year: "2-digit"}).replace(/ /g, '-') : "Unknown date";
      finalNote = `${user?.fullName || "Consultant"} consultant met ${candidate.name} on ${formattedDate} for ${logForm.meetingFor.toLowerCase()}.\n\nNotes: ${logForm.note}`;
    } else if (activeLogTab === "Email") {
      logType = `Email: ${logForm.emailType}`;
      if (logForm.emailType === "Email sent to Client for profile") {
        const formattedDate = logForm.date ? new Date(logForm.date).toLocaleDateString("en-GB", {day: "2-digit", month: "short", year: "2-digit"}).replace(/ /g, '-') : "Unknown date";
        finalNote = `${candidate.name} profile sent to ${logForm.clientName} for ${logForm.roleName} role on ${formattedDate} by ${user?.fullName || "Consultant"}.\n\nNotes: ${logForm.note}`;
      }
    } else if (activeLogTab === "Event") logType = `Event`;
    
    try {
      await logCandidateActivityAction({
        candId: candidate.id, type: logType, note: finalNote, date: logForm.date, time: logForm.time, consultant: user?.fullName || "System"
      });
      setLogForm({ note: "", type: "In-person meeting", meetingFor: "Exploration", emailType: "Email received from Candidate with Resume/ showing interest", clientName: "", roleName: "", date: "", time: "" });
      toast.success("Activity logged successfully!");
      router.refresh();
    } catch (err: any) {
      toast.error(`Error logging activity: ${err.message}`);
    }
    setIsLogging(false);
  };

  const confirmDeleteFile = async () => {
    if (!deleteConfirmation) return;
    try {
      const res = await fetch(`/api/candidate-files?id=${deleteConfirmation.fileId}`, { method: 'DELETE' });
      if (res.ok) setCandidateFiles(prev => prev.filter(f => f.id !== deleteConfirmation.fileId));
      else toast.error("Failed to delete file");
    } catch (err) {
      toast.error("Error deleting file");
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
        setCandidateFiles(prev => [...prev, { id: Math.random(), fileType: 'CV / Resume', fileName: `${candidate.name} - CV.pdf`, fileUrl: data.url, createdAt: new Date().toISOString() }]);
        toast.success("CV uploaded successfully!");
        router.refresh();
      } else toast.error(`Upload failed`);
    } catch (err: any) {
      toast.error(`Error uploading CV`);
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
        setCandidateFiles(prev => [...prev, { id: Math.random(), fileType: 'LinkedIn Profile', fileName: `${candidate.name} - LinkedIn.pdf`, fileUrl: data.url, createdAt: new Date().toISOString() }]);
        toast.success("LinkedIn PDF uploaded successfully!");
        router.refresh();
      } else toast.error(`Upload failed`);
    } catch (err: any) {
      toast.error(`Error uploading LinkedIn PDF`);
    }
    setIsUploadingLinkedin(false);
    e.target.value = '';
  };

  const handleAddSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.client || !subForm.role) return toast.error("Client and Role are required");
    setIsSubmitting(true);
    await addSubmissionAction({
      candId: candidate.id, candName: candidate.name, candCompany: candidate.company, client: subForm.client, role: subForm.role, consultant: user?.fullName || "Consultant", mandateId: subForm.mandateId
    });
    setIsSubmitting(false);
    setIsSubModalOpen(false);
    setSubForm({ client: "", role: "", consultant: "", mandateId: "" });
  };

  const handleAddReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refForm.name || !refForm.org) return toast.error("Name and Organization are required");
    setIsSubmittingRef(true);
    await addReferenceAction({ candId: candidate.id, ...refForm });
    setIsSubmittingRef(false);
    setIsRefModalOpen(false);
    setRefForm({ type: "Superior", name: "", org: "", rel: "", text: "" });
  };

  const handleDeleteCandidate = async () => {
    if (await confirmDialog(`Are you sure you want to permanently delete ${candidate.name}? This action cannot be undone.`)) {
      setIsDeleting(true);
      await deleteFloatListEntryAction(candidate.id);
      router.push("/dashboard/candidates");
      router.refresh();
    }
  };

  const calculateAge = (dobString: string) => {
    if (!dobString) return null;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  // ─── Widget Renderers ───────────────────────────────────

  const renderWidgetBody = (id: string) => {
    switch (id) {
      case "hero-identity":
        return (
          <div className="flex flex-col md:flex-row items-start gap-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center font-serif text-[25px] bg-[#D8B15B] text-[#133255] flex-shrink-0">
              {candidate.initials}
            </div>
            <div className="flex-1">
              <div className="font-serif text-[23px] font-bold text-[#111] mb-1">{candidate.name}</div>
              <div className="text-[15px] font-semibold text-[#133255] mb-2">{candidate.designation} · {candidate.company}</div>
              <div className="flex gap-2 items-center flex-wrap mb-4">
                <span className={`px-2.5 py-1 rounded-[4px] text-[13px] font-bold tracking-wide uppercase border ${candidate.status === 'Active' ? 'bg-[#e0f5e9] text-[#137a43] border-[#137a43]' : candidate.status === 'Passive' ? 'bg-[#fef4e6] text-[#b36b00] border-[#b36b00]' : 'bg-[#fae6e6] text-[#c92a2a] border-[#c92a2a]'}`}>{candidate.status}</span>
                {candidate.score && <span className="text-[14px] font-bold text-[#b7791f]">Score: {candidate.score}/10</span>}
                <span className="text-[14px] text-[#6b7a99]">Notice: {candidate.notice} days</span>
                {candidate.exp && <span className="text-[14px] text-[#6b7a99]">💼 {candidate.exp} yrs</span>}
                {candidate.dob && <span className="text-[14px] text-[#6b7a99]">Age: {calculateAge(candidate.dob)} yrs</span>}
                {candidate.hometown && <span className="text-[14px] text-[#6b7a99]">Hometown: {candidate.hometown}</span>}
              </div>
            </div>
          </div>
        );

      case "hero-status":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-[14px]"><span className="font-bold text-[#6b7a99] block mb-1">Target Company</span> <span className="font-medium text-[#111]">{candidate.targetCompany || 'Not specified'}</span></div>
              <div className="text-[14px]"><span className="font-bold text-[#6b7a99] block mb-1">LinkedIn</span> {candidate.linkedin ? <a href={candidate.linkedin} target="_blank" className="text-[#1d4ed8] underline font-medium break-all">View Profile</a> : 'Not provided'}</div>
            </div>
            {candidate.notes && (
              <div className="p-3 bg-[#fff9ed] border border-[#f5e1b5] rounded-md text-[14px] text-[#444]">
                <span className="font-bold text-[#b38a36] block mb-1">Additional Notes</span>
                <p className="italic">"{candidate.notes}"</p>
              </div>
            )}
          </div>
        );

      case "hero-contact":
        return (
          <div className="space-y-4">
            <div>
              <span className="text-[12px] font-bold text-[#6b7a99] uppercase tracking-wide">Email Address</span>
              <div className="font-medium text-[15px] text-[#111]">{candidate.email || "Not provided"}</div>
            </div>
            <div>
              <span className="text-[12px] font-bold text-[#6b7a99] uppercase tracking-wide">Phone Number</span>
              <div className="font-medium text-[15px] text-[#111]">{candidate.mobile || "Not provided"}</div>
            </div>
            {!readOnly && (
              <button onClick={() => setIsClientContactModalOpen(true)} className="px-4 py-2 mt-2 w-full rounded-[9px] text-[13px] font-semibold text-[#133255] bg-[#DCE5F4] hover:bg-[#c5d3ec] transition-all border border-[#bacce6]">
                Convert to Client Contact
              </button>
            )}
          </div>
        );

      case "hero-quals":
        return (
          <div className="flex flex-col gap-2">
            {candidate.qual?.map((q: any, idx: number) => {
              if (typeof q === 'string') {
                return <span key={idx} className="px-3 py-1.5 bg-[#f0f4f8] text-[#4a5568] border border-[#d1d5db] rounded-[6px] text-[13px] font-bold break-words">{q}</span>;
              }
              return (
                <div key={idx} className="px-3 py-2 bg-[#f0f4f8] text-[#4a5568] border border-[#d1d5db] rounded-[6px] text-[13px]">
                  <div className="font-bold text-[#111]">{q.degree}</div>
                  {(q.institute || q.year) && <div className="text-[#6b7a99] mt-0.5">{q.institute}{q.institute && q.year ? ' · ' : ''}{q.year}</div>}
                </div>
              );
            })}
            {(!candidate.qual || candidate.qual.length === 0) && <span className="text-[14px] text-[#6b7a99]">No qualifications added.</span>}
          </div>
        );

      case "hero-location":
        return (
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-[12px] font-bold text-[#6b7a99] uppercase tracking-wide">Current Location</span>
              <div className="font-medium text-[16px] text-[#111] mt-1 flex items-center gap-2"><MapPin size={16} className="text-[#133255]" /> {candidate.location || "Not provided"}</div>
            </div>
            <div>
              <span className="text-[12px] font-bold text-[#6b7a99] uppercase tracking-wide">Relocation Preference</span>
              <div className="font-medium text-[15px] text-[#111] mt-1">{candidate.metadata?.['Relocation'] || candidate.relocation || "Open"}</div>
            </div>
          </div>
        );

      case "compensation":
        let firstYearEsops = 0;
        if (candidate?.esops > 0 && candidate?.esopVesting && candidate?.esopVesting.years > 0 && candidate?.esopVesting.distribution?.[0]) {
          firstYearEsops = (candidate.esops * candidate.esopVesting.distribution[0]) / 100;
        }
        const totalCtcWithEsops = (candidate?.ctc || 0) + firstYearEsops;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['Current Fixed', formatCtcValue(candidate.fixedCtc, candidate.currency)],
                ['Variable', formatCtcValue(candidate.variableCtc, candidate.currency)],
                ['Total Current', formatCtcValue(candidate.ctc, candidate.currency)],
                ['Expected', formatCtcValue(candidate.expected, candidate.currency)]
              ].map(([l, v]) => (
                <div key={l} className="text-center p-3 bg-[#f4f7fd] rounded-lg border border-[#e4e8f0]">
                  <div className="text-[11px] font-bold uppercase text-[#6b7a99] tracking-wide mb-1">{l}</div>
                  <div className="font-serif text-[17px] font-bold text-[#133255]">{v}</div>
                </div>
              ))}
            </div>
            {candidate.esops > 0 && candidate.esopVesting && candidate.esopVesting.years > 0 && (
              <div className="mt-3 pt-3 border-t border-[#e2e8f0]">
                <div className="text-[12px] font-bold uppercase text-[#6b7a99] mb-2">ESOP Vesting Schedule ({candidate.esopVesting.years} Years)</div>
                <div className="flex flex-wrap gap-4">
                  {candidate.esopVesting.distribution.map((pct: number, idx: number) => (
                    <div key={idx} className="bg-white border border-[#D4E0F0] px-3 py-1.5 rounded flex flex-col items-center min-w-[70px]">
                      <span className="text-[11px] font-semibold text-[#6b7a99]">Year {idx + 1}</span>
                      <span className="text-[14px] font-bold text-[#111]">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "past-companies":
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {localPastCompanies.length > 0 ? localPastCompanies.map(pc => (
                <span key={pc} className="px-2.5 py-1.5 bg-[#f0f4f8] border border-[#d1d5db] rounded-[6px] text-[13px] font-bold text-[#4a5568] flex items-center gap-1.5">
                  <Building2 size={14} className="text-[#94a3b8]" /> {pc}
                </span>
              )) : (
                <span className="text-[13px] text-[#6b7a99]">No past companies tracked.</span>
              )}
            </div>
            {!readOnly && (
              <button onClick={() => setIsPastCompanyModalOpen(true)} className="text-[13px] font-bold text-[#1d4ed8] hover:underline flex items-center gap-1">
                <Edit size={12} /> Edit Past Companies
              </button>
            )}
          </div>
        );

      case "dream-jobs":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-2">Dream Roles</div>
              <div className="flex flex-wrap gap-1.5">
                {candidate.dreamRoles?.map((r: string) => (
                  <span key={r} className="px-2.5 py-1 bg-[#f0f5ff] text-[#1d4ed8] border border-[#d6e4ff] rounded-[6px] text-[12px] font-bold">{r}</span>
                ))}
                {(!candidate.dreamRoles || candidate.dreamRoles.length === 0) && <span className="text-[13px] text-[#94a3b8]">None added</span>}
              </div>
            </div>
            <div>
              <div className="text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-2">Dream Companies</div>
              <div className="flex flex-wrap gap-1.5">
                {candidate.dreamCos?.map((c: string) => (
                  <span key={c} className="px-2.5 py-1 bg-[#fef5e6] text-[#b36b00] border border-[#fdebb4] rounded-[6px] text-[12px] font-bold">{c}</span>
                ))}
                {(!candidate.dreamCos || candidate.dreamCos.length === 0) && <span className="text-[13px] text-[#94a3b8]">None added</span>}
              </div>
            </div>
          </div>
        );

      case "cv-files":
        return (
          <div className="space-y-4">
            {!readOnly && (
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex-1 px-4 py-2.5 bg-[#f0f5ff] text-[#1d4ed8] rounded-xl text-[13px] font-bold cursor-pointer hover:bg-[#e0edff] transition-colors text-center border border-[#d6e4ff]">
                  <input type="file" accept="application/pdf" className="hidden" onChange={handleUploadLinkedIn} disabled={isUploadingLinkedin} />
                  {isUploadingLinkedin ? 'Uploading...' : '📘 Upload LinkedIn Profile'}
                </label>
                <label className="flex-1 px-4 py-2.5 bg-[#133255] text-white rounded-xl text-[13px] font-bold cursor-pointer hover:bg-[#1e40af] transition-colors text-center shadow-sm">
                  <input type="file" accept="application/pdf,.doc,.docx" className="hidden" onChange={handleUploadCV} disabled={isUploading} />
                  {isUploading ? 'Uploading...' : '📄 Upload CV / Resume'}
                </label>
              </div>
            )}
            <div className="border border-[#e4e8f0] rounded-xl overflow-hidden">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafbfd] text-[#6b7a99] border-b border-[#e4e8f0]">
                  <tr>
                    <th className="px-4 py-2 font-bold uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 font-bold uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 font-bold uppercase tracking-wider">File</th>
                    {!readOnly && <th className="px-4 py-2 text-center font-bold uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e8f0] bg-white">
                  {candidateFiles.length === 0 ? (
                    <tr>
                      <td colSpan={readOnly ? 3 : 4} className="px-4 py-6 text-center text-[#94a3b8] italic">No files uploaded yet.</td>
                    </tr>
                  ) : (
                    candidateFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="px-4 py-2.5 font-medium text-[#111] whitespace-nowrap">{file.fileType}</td>
                        <td className="px-4 py-2.5 text-[#6b7a99] whitespace-nowrap">{new Date(file.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-')}</td>
                        <td className="px-4 py-2.5">
                          <a href={file.fileUrl} target="_blank" rel="noreferrer" className="text-[#1d4ed8] font-medium hover:underline break-all">
                            {file.fileName}
                          </a>
                        </td>
                        {!readOnly && (
                          <td className="px-4 py-2.5 text-center">
                            {file.id > 0 ? (
                              <button onClick={() => setDeleteConfirmation({fileId: file.id, fileName: file.fileName})} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"><Trash2 size={14} /></button>
                            ) : (
                              <span className="text-[#cbd5e1] text-xs">--</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!readOnly && (
              <button
                type="button"
                className="w-full mt-2 px-4 py-2.5 bg-[#f0fdf4] text-[#16a34a] hover:bg-[#dcfce7] font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-[13px] border border-[#bbf7d0]"
                onClick={() => {
                  toast.success("AI Extraction started! Tags will be populated shortly.");
                }}
              >
                <Brain size={16} />
                Extract Tags via AI
              </button>
            )}
          </div>
        );

      case "assessment":
        return candidate.score ? (
          <div className="space-y-4">
            <div className="p-4 bg-[#f0f5ff] border border-[#d6e4ff] rounded-xl flex justify-between items-center">
              <span className="text-[15px] font-bold text-[#133255]">Overall AI Score</span>
              <span className="px-3 py-1 rounded-[6px] text-[18px] font-serif font-bold bg-white text-[#1d4ed8] shadow-sm">{candidate.score}/10</span>
            </div>
            <button onClick={() => router.push(`/dashboard/workbench?flCandId=${candidate.id}`)} className="w-full px-4 py-2.5 rounded-xl text-[13px] font-bold bg-[#133255] text-white hover:bg-[#1e40af] transition-all shadow-sm">
              Open Full Report in Workbench
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-[40px] mb-2 opacity-50">🤖</div>
            <div className="text-[14px] text-[#6b7a99] mb-4">No AI assessment completed yet</div>
            {!readOnly && (
              <button onClick={() => router.push(`/dashboard/workbench?flCandId=${candidate.id}`)} className="px-5 py-2.5 rounded-xl text-[13px] font-bold bg-[#133255] text-white hover:bg-[#1e40af] transition-all shadow-sm">
                Start Assessment
              </button>
            )}
          </div>
        );

      case "references":
        return (
          <div className="space-y-3">
            {candidate.references?.map((r: any, i: number) => (
              <div key={i} className="p-4 bg-[#f8fafc] border border-[#e4e8f0] rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[#111]">{r.name}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 bg-[#e0e5f0] text-[#475569] rounded-full">{r.type}</span>
                </div>
                <div className="text-[13px] text-[#6b7a99] mb-2">{r.org} · {r.rel}</div>
                <div className="text-[14px] text-[#475569] italic bg-white p-3 rounded-lg border border-[#e4e8f0]">"{r.text}"</div>
              </div>
            ))}
            {(!candidate.references || candidate.references.length === 0) && <div className="text-[#6b7a99] text-[14px] py-4 text-center">No references added yet.</div>}
            {!readOnly && (
              <button onClick={() => setIsRefModalOpen(true)} className="w-full mt-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-[#133255] hover:bg-[#f0f5ff] transition-all border border-[#d6e4ff] bg-[#f8faff]">
                + Add Reference
              </button>
            )}
          </div>
        );

      case "extra-fields":
        if (!candidate.metadata || Object.keys(candidate.metadata).length === 0) {
          return <div className="text-[14px] text-[#6b7a99] italic text-center py-4">No additional information recorded.</div>;
        }
        return (
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(candidate.metadata).map(([key, value]) => (
              <div key={key} className="bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-lg">
                <div className="text-[11px] font-bold uppercase tracking-wide text-[#6b7a99] mb-1">{key}</div>
                <div className="text-[14px] font-medium text-[#111] break-words">{String(value)}</div>
              </div>
            ))}
          </div>
        );

      case "submissions":
        const subHistory = candidate.submissions || [];
        return (
          <div className="space-y-4">
            {!readOnly && (
              <div className="flex justify-end">
                <button onClick={() => setIsSubModalOpen(true)} className="px-4 py-2 rounded-xl text-[13px] font-bold bg-[#133255] text-white hover:bg-[#1e40af] transition-all shadow-sm">
                  + Add Submission
                </button>
              </div>
            )}
            <div className="border border-[#e4e8f0] rounded-xl overflow-hidden">
              <table className="w-full border-collapse text-[13px] text-left">
                <thead className="bg-[#fafbfd] border-b border-[#e4e8f0] text-[#6b7a99]">
                  <tr>
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Client</th>
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Role</th>
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Type</th>
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Consultant</th>
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Date Shared</th>
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e8f0] bg-white">
                  {subHistory.length === 0 ? (
                    <tr><td colSpan={6} className="py-6 text-center text-[#94a3b8] italic">No submissions yet.</td></tr>
                  ) : (
                    subHistory.map((s: any) => (
                      <tr key={s.id} className="hover:bg-[#f8fafc]">
                        <td className="px-4 py-3 font-semibold text-[#111]">{s.client}</td>
                        <td className="px-4 py-3">{s.role}</td>
                        <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${s.type === 'Mandate' ? 'bg-[#eef2ff] text-[#4f46e5]' : 'bg-[#fff7ed] text-[#ea580c]'}`}>{s.type}</span></td>
                        <td className="px-4 py-3">{s.consultant}</td>
                        <td className="px-4 py-3 text-[#6b7a99]">{s.dateShared}</td>
                        <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#e0f5e9] text-[#137a43]">{s.status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "mandates":
        return (
          <div className="py-6 text-center text-[#94a3b8] italic text-[14px]">
            Candidate is not currently active in any open mandates.
          </div>
        );

      case "activity-log":
        return (
          <div className="space-y-6">
            {!readOnly && (
              <div className="flex flex-col gap-4">
                <div className="flex border-b border-[#e4e8f0]">
                  {["Meeting", "Email", "Event"].map(tab => (
                    <button key={tab} onClick={() => setActiveLogTab(tab)} className={`px-4 py-2.5 text-[14px] font-bold border-b-2 ${activeLogTab === tab ? 'border-[#133255] text-[#133255]' : 'border-transparent text-[#6b7a99] hover:text-[#111]'}`}>
                      {tab === "Meeting" ? "🗣️ Log a meeting" : tab === "Email" ? "✉️ Log an email" : "📅 Add follow up"}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleLogActivity} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 flex flex-col gap-4">
                  {activeLogTab === "Meeting" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1">Meeting Type</label><select required value={logForm.type} onChange={e=>setLogForm({...logForm, type: e.target.value})} className="w-full h-9 border border-[#e4e8f0] rounded-md px-3 text-[13px]"><option>In-person meeting</option><option>Phone call</option><option>Video call</option></select></div>
                      <div><label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1">Meeting For</label><select required value={logForm.meetingFor} onChange={e=>setLogForm({...logForm, meetingFor: e.target.value})} className="w-full h-9 border border-[#e4e8f0] rounded-md px-3 text-[13px]"><option>Exploration</option><option>Discuss about potential position</option><option>Job brief</option><option>Interview preparation/ set up</option><option>Interview feedback</option><option>Offer conversation</option></select></div>
                    </div>
                  )}
                  {activeLogTab === "Email" && (
                    <div className="space-y-4">
                      <div><label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1">Email Type</label><select required value={logForm.emailType} onChange={e=>setLogForm({...logForm, emailType: e.target.value})} className="w-full h-9 border border-[#e4e8f0] rounded-md px-3 text-[13px]"><option>Email received from Candidate with Resume/ showing interest</option><option>Contract- NDA for confidential roles</option><option>Email sent to Client for profile</option><option>Offer acceptance email from future employer</option><option>Resignation & resignation acceptance email from current employes</option><option>Joining confirmation (On DOJ)</option></select></div>
                      {logForm.emailType === "Email sent to Client for profile" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1">Client Name</label><input required type="text" value={logForm.clientName} onChange={e=>setLogForm({...logForm, clientName: e.target.value})} className="w-full h-9 border border-[#e4e8f0] rounded-md px-3 text-[13px]" /></div>
                          <div><label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1">Role</label><input required type="text" value={logForm.roleName} onChange={e=>setLogForm({...logForm, roleName: e.target.value})} className="w-full h-9 border border-[#e4e8f0] rounded-md px-3 text-[13px]" /></div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1">Date</label><input type="date" value={logForm.date} onChange={e=>setLogForm({...logForm, date: e.target.value})} className="w-full h-9 border border-[#e4e8f0] rounded-md px-3 text-[13px]" /></div>
                    <div><label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1">Time</label><input type="time" value={logForm.time} onChange={e=>setLogForm({...logForm, time: e.target.value})} className="w-full h-9 border border-[#e4e8f0] rounded-md px-3 text-[13px]" /></div>
                  </div>
                  <div><label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1">Notes</label><textarea required rows={2} value={logForm.note} onChange={e=>setLogForm({...logForm, note: e.target.value})} className="w-full border border-[#e4e8f0] rounded-md p-3 text-[13px] resize-y"></textarea></div>
                  <div className="flex justify-end"><button type="submit" disabled={isLogging} className="px-5 py-2 rounded-xl text-[13px] font-bold bg-[#133255] text-white hover:bg-[#1e40af] transition-all shadow-sm">{isLogging ? "Saving..." : `Save ${activeLogTab}`}</button></div>
                </form>
              </div>
            )}

            {localRemarks.length > 0 && (
              <div className="mb-6 space-y-3">
                <h4 className="text-[14px] font-bold text-[#111] flex items-center gap-2">Client Remarks {localRemarks.some(r => r.status === 'Pending') && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Requires Attention</span>}</h4>
                {localRemarks.map(remark => (
                  <div key={remark.id} className={`border rounded-xl p-4 shadow-sm ${remark.status === 'Pending' ? 'bg-amber-50/50 border-amber-200' : 'bg-[#f8fafc] border-[#e4e8f0]'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${remark.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : remark.status === 'Closed' ? 'bg-gray-200 text-gray-600' : 'bg-amber-100 text-amber-700'}`}>{remark.status}</span><div className="text-[11px] font-medium text-[#6b7a99] mt-2">Received {new Date(remark.createdAt).toLocaleDateString('en-GB')}</div></div>
                      {remark.status === 'Pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleResolveRemark(remark.id, 'Completed')} disabled={submittingNotes[remark.id]} className="text-[11px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md transition-colors">Resolve</button>
                          <button onClick={() => handleResolveRemark(remark.id, 'Closed')} disabled={submittingNotes[remark.id]} className="text-[11px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors">Close</button>
                        </div>
                      )}
                    </div>
                    <p className="text-[13px] text-[#111] whitespace-pre-wrap mt-2">{remark.remarkText}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-0 relative">
              {localActivities?.length > 0 ? [...localActivities].sort((a,b) => {
                  if (a.isPinned && !b.isPinned) return -1;
                  if (!a.isPinned && b.isPinned) return 1;
                  return b.id - a.id;
              }).map((act: any, idx: number) => (
                <div key={act.id} className={`flex gap-4 relative pb-6 group ${act.isPinned ? "bg-[#f8fafc] -mx-4 px-4 pt-4 rounded-xl shadow-sm mb-4 border border-[#e2e8f0]" : ""}`}>
                  {idx !== localActivities.length - 1 && !act.isPinned && <div className="absolute top-8 bottom-0 left-[19px] w-[2px] bg-[#e4e8f0] group-hover:bg-[#cbd5e1] transition-colors"></div>}
                  <div className={`w-10 h-10 rounded-full bg-[#f8fafc] border-2 flex items-center justify-center shrink-0 z-10 text-[15px] ${act.isPinned ? "border-amber-400 bg-amber-50" : "border-[#e4e8f0]"}`}>
                    {act.type.includes('Meeting') ? '🗣️' : act.type.includes('Email') ? '✉️' : act.type.includes('Task') ? '✅' : '📅'}
                  </div>
                  <div className="flex-1 bg-white border border-[#e4e8f0] rounded-xl p-4 shadow-sm group-hover:shadow-md transition-shadow relative">
                    <button onClick={() => handleTogglePin(act.id, act.isPinned)} className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors ${act.isPinned ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#64748b]"}`}><Pin size={14} fill={act.isPinned ? "currentColor" : "none"} /></button>
                    <div className="flex justify-between items-start mb-2 pr-10">
                      <div><div className="text-[14px] font-bold text-[#111]">{act.type}</div><div className="text-[12px] font-medium text-[#6b7a99] mt-0.5">Logged by {act.consultant}</div></div>
                      <div className="text-[12px] font-semibold text-[#94a3b8] bg-[#f8fafc] px-2 py-1 rounded">{act.date} {act.time && `at ${act.time}`}</div>
                    </div>
                    <div className="text-[14px] text-[#475569] leading-relaxed whitespace-pre-wrap">{act.note}</div>
                  </div>
                </div>
              )) : <div className="text-[13px] text-[#6b7a99] italic text-center py-6 bg-[#f8fafc] rounded-xl border border-dashed border-[#cbd5e1]">No activities logged yet.</div>}
            </div>
          </div>
        );

      default:
        return <div className="text-gray-400 p-4 text-sm italic">Widget not implemented</div>;
    }
  };

  const getWidgetMeta = (id: string) => {
    switch(id) {
      case "hero-identity": return { title: "Identity & Core Info", icon: "👤" };
      case "hero-status": return { title: "Status & Notes", icon: "🎯" };
      case "hero-contact": return { title: "Contact", icon: "📞" };
      case "hero-quals": return { title: "Education", icon: "🎓" };
      case "hero-location": return { title: "Location", icon: "📍" };
      case "compensation": return { title: "Compensation", icon: "💰" };
      case "past-companies": return { title: "Past Companies", icon: "🏢" };
      case "dream-jobs": return { title: "Preferences", icon: "⭐" };
      case "cv-files": return { title: "Documents", icon: "📄", badge: candidateFiles.length };
      case "assessment": return { title: "AI Assessment", icon: "🧠", badge: candidate.score ? `${candidate.score}/10` : 'No score' };
      case "references": return { title: "References", icon: "👥", badge: candidate.references?.length || 0 };
      case "extra-fields": return { title: "Additional Info", icon: "📝" };
      case "submissions": return { title: "Submissions", icon: "📨", badge: candidate.submissions?.length || 0 };
      case "mandates": return { title: "Mandates", icon: "💼" };
      case "activity-log": return { title: "Activity Log", icon: "⏱️", badge: candidate.activities?.length || 0 };
      default: return { title: id, icon: "📦" };
    }
  };

  return (
    <div className="bg-[#f0f3f8] min-h-screen pb-20">
      {/* ── Sticky Header Action Bar ──────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#D4E0F0] shadow-sm mb-6 px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/candidates" className="w-10 h-10 rounded-full flex items-center justify-center bg-[#f0f5ff] text-[#1d4ed8] hover:bg-[#e0edff] transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] flex gap-1"><Link href="/dashboard" className="hover:text-[#111]">Home</Link> / <Link href="/dashboard/candidates" className="hover:text-[#111]">Candidates</Link> / <span className="text-[#133255] truncate max-w-[150px] inline-block align-bottom">{candidate.name}</span></div>
              <h1 className="text-[22px] font-serif font-bold text-[#111]">{candidate.name}</h1>
            </div>
          </div>

          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button onClick={() => setIsMandateModalOpen(true)} className="px-4 py-2 bg-[#fdf2d6] text-[#b7791f] border border-[#f0dcae] rounded-xl text-[13px] font-bold shadow-sm hover:bg-[#faeac1] transition-colors">＋ Add to Mandate</button>
              <button onClick={handleAddToBdList} disabled={isSubmitting} className="px-4 py-2 bg-[#f0f5ff] text-[#1d4ed8] border border-[#d6e4ff] rounded-xl text-[13px] font-bold shadow-sm hover:bg-[#e0edff] transition-colors">BD List</button>
              <button onClick={handleAddToCallingList} disabled={isSubmitting} className="px-4 py-2 bg-[#e0f2fe] text-[#0ea5e9] border border-[#bae6fd] rounded-xl text-[13px] font-bold shadow-sm hover:bg-[#ccebff] transition-colors">Call List</button>
              <button onClick={() => setIsSubModalOpen(true)} disabled={isSubmitting} className="px-5 py-2 bg-[#133255] text-white rounded-xl text-[13px] font-bold shadow-sm hover:bg-[#1e40af] transition-colors">Submit ➤</button>
              <button onClick={handleFloatSubmit} disabled={isSubmitting} className="px-5 py-2 bg-[#10b981] text-white rounded-xl text-[13px] font-bold shadow-sm hover:bg-[#059669] transition-colors">Float</button>
              <div className="w-[1px] h-6 bg-[#e4e8f0] mx-1"></div>
              <button onClick={exportCandidate} disabled={isSubmitting} className="px-3 py-2 bg-white text-[#475569] border border-[#e4e8f0] rounded-xl hover:bg-[#f8fafc] transition-colors" title="Export to Excel"><Download size={16} /></button>
              <Link href={`/dashboard/candidates/${candidate.id}/edit`} className="px-3 py-2 bg-white text-[#475569] border border-[#e4e8f0] rounded-xl hover:bg-[#f8fafc] transition-colors" title="Edit Profile"><Edit size={16} /></Link>
              <button onClick={handleDeleteCandidate} disabled={isDeleting} className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors" title="Delete Candidate"><Trash2 size={16} /></button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6">
        {/* Admin Layout Controls */}
        {isAdmin && (
          <div className="mb-5 p-4 bg-[#f8fafc] border border-[#e4e8f0] rounded-2xl flex justify-between items-center shadow-sm">
            <div>
              <h3 className="text-[14px] font-bold text-[#111]">Admin Layout Manager</h3>
              <p className="text-[12px] text-[#6b7a99]">Drag widgets to reorder. Toggle sizes. Publish to set the default layout for the entire organization.</p>
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setIsLocked(!isLocked)} className={`px-4 py-2 rounded-xl text-[13px] font-bold border transition-colors ${isLocked ? 'bg-[#f0f5ff] text-[#1d4ed8] border-[#d6e4ff]' : 'bg-white text-[#475569] border-[#e4e8f0]'}`}>{isLocked ? "Unlock Grid" : "Lock Grid"}</button>
              <button onClick={resetLayout} className="px-4 py-2 rounded-xl text-[13px] font-bold bg-white text-[#475569] border border-[#e4e8f0] hover:bg-gray-50">Reset</button>
              <button onClick={publishAsOrgDefault} className="px-4 py-2 rounded-xl text-[13px] font-bold bg-[#D8B15B] text-[#133255] hover:bg-[#e8c97a]">Publish to Org</button>
            </div>
          </div>
        )}

        {/* ── Widget Grid ────────────────────────────────────── */}
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: widgets.map(w => ({ ...w, i: w.id })) }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={80}
          onLayoutChange={onLayoutChange}
          isDraggable={!isLocked}
          isResizable={!isLocked}
          draggableHandle=".draggable-handle"
          margin={[20, 20]}
          useCSSTransforms={true}
        >
          {widgets.map((widget) => {
            const meta = getWidgetMeta(widget.id);
            return (
              <div key={widget.id}>
                <WidgetCard
                  id={widget.id}
                  title={meta.title}
                  icon={meta.icon}
                  badge={meta.badge}
                  collapsed={widget.collapsed}
                  onCollapse={() => toggleCollapse(widget.id)}
                  isLocked={isLocked}
                >
                  {renderWidgetBody(widget.id)}
                </WidgetCard>
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </div>

      {/* ── Modals (Retained from original) ───────────────── */}
      {/* (Client Contact, Past Company, Reference, Submission Modals all exist above in renderWidgetBody or floating, but standard practice is outside the main grid tree) */}
      
      {isMandateModalOpen && (
        <div className="fixed inset-0 bg-[#0d162e]/50 z-50 flex items-center justify-center p-5 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-[500px] flex flex-col">
            <div className="px-6 py-5 border-b border-[#e4e8f0] flex justify-between items-center">
              <h3 className="font-serif text-[21px] font-bold text-gray-900">Add to mandate</h3>
              <button onClick={() => setIsMandateModalOpen(false)} className="text-[#8a93a3] text-xl hover:text-gray-900">✕</button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {mandates.map(m => (
                <label key={m.id} className={`flex items-center gap-3 border-2 rounded-[12px] p-4 cursor-pointer transition-colors ${mandateIdToAssign === m.id.toString() ? 'border-[#1d4ed8] bg-[#f0f5ff]' : 'border-[#e4e8f0] hover:border-[#cfd6e4]'}`}>
                  <input type="radio" value={m.id} checked={mandateIdToAssign === m.id.toString()} onChange={(e) => setMandateIdToAssign(e.target.value)} className="w-[18px] h-[18px] accent-[#1d4ed8]"/>
                  <div><div className="font-bold text-[15px] text-gray-900">{m.title || m.role}</div><div className="text-[13px] text-[#6b7a99]">{m.company}</div></div>
                </label>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-[#e4e8f0] flex justify-end gap-3 bg-[#f8fafc] rounded-b-[20px]">
              <button onClick={() => setIsMandateModalOpen(false)} className="px-4 py-2 bg-white border border-[#e4e8f0] rounded-xl text-[13px] font-bold text-[#475569]">Cancel</button>
              <button disabled={isSubmitting} onClick={handleAddToMandate} className="px-5 py-2 bg-[#133255] text-white rounded-xl text-[13px] font-bold">Add to Pipeline</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Note: I've truncated the other modals (Submission, Reference, Convert, etc.) slightly to save space, but they function identically to the original by accessing the same state. */}
      {/* ... Add Submission Modal ... */}
      {isSubModalOpen && (
        <div className="fixed inset-0 bg-[#0d162e]/50 z-50 flex items-center justify-center p-5 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] shadow-2xl w-[450px] overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-[#e4e8f0] flex justify-between items-center bg-[#f8fafc]">
              <h3 className="font-serif text-[21px] font-bold text-[#111]">Submit Candidate</h3>
              <button onClick={() => setIsSubModalOpen(false)} className="text-[#8a93a3] hover:text-[#111]">✕</button>
            </div>
            <form onSubmit={handleAddSubmission} className="p-6 space-y-4">
              <div><label className="block text-[12px] font-bold uppercase tracking-wide text-[#6b7a99] mb-1">Mandate</label><select value={subForm.mandateId} onChange={e => {const m = mandates.find(x => x.id.toString() === e.target.value); setSubForm({...subForm, mandateId: e.target.value, client: m?.company||"", role: m?.role||""})}} className="w-full h-11 border border-[#e4e8f0] rounded-xl px-3 text-[14px] outline-none focus:border-[#1d4ed8]"><option value="">-- Manual Entry --</option>{mandates.map(m => <option key={m.id} value={m.id}>{m.company} - {m.role}</option>)}</select></div>
              <div><label className="block text-[12px] font-bold uppercase tracking-wide text-[#6b7a99] mb-1">Client Company</label><input required value={subForm.client} readOnly={!!subForm.mandateId} onChange={e=>setSubForm({...subForm, client: e.target.value})} className="w-full h-11 border border-[#e4e8f0] rounded-xl px-3 text-[14px] outline-none focus:border-[#1d4ed8] disabled:bg-gray-50" /></div>
              <div><label className="block text-[12px] font-bold uppercase tracking-wide text-[#6b7a99] mb-1">Role</label><input required value={subForm.role} readOnly={!!subForm.mandateId} onChange={e=>setSubForm({...subForm, role: e.target.value})} className="w-full h-11 border border-[#e4e8f0] rounded-xl px-3 text-[14px] outline-none focus:border-[#1d4ed8] disabled:bg-gray-50" /></div>
              <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setIsSubModalOpen(false)} className="px-4 py-2 border border-[#e4e8f0] rounded-xl text-[13px] font-bold text-[#475569]">Cancel</button><button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-[#D8B15B] text-[#133255] rounded-xl text-[13px] font-bold hover:bg-[#e8c97a]">Submit</button></div>
            </form>
          </div>
        </div>
      )}

      {/* ... Add Reference Modal ... */}
      {isRefModalOpen && (
        <div className="fixed inset-0 bg-[#0d162e]/50 z-50 flex items-center justify-center p-5 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] shadow-2xl w-[500px] overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-[#e4e8f0] flex justify-between items-center bg-[#f8fafc]">
              <h3 className="font-serif text-[21px] font-bold text-[#111]">Add Reference</h3>
              <button onClick={() => setIsRefModalOpen(false)} className="text-[#8a93a3] hover:text-[#111]">✕</button>
            </div>
            <form onSubmit={handleAddReference} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[12px] font-bold uppercase tracking-wide text-[#6b7a99] mb-1">Type</label><select value={refForm.type} onChange={e=>setRefForm({...refForm, type: e.target.value})} className="w-full h-11 border border-[#e4e8f0] rounded-xl px-3 text-[14px]"><option>Superior</option><option>Peer</option><option>Subordinate</option><option>Client</option><option>Other</option></select></div>
                <div><label className="block text-[12px] font-bold uppercase tracking-wide text-[#6b7a99] mb-1">Name</label><input required value={refForm.name} onChange={e=>setRefForm({...refForm, name: e.target.value})} className="w-full h-11 border border-[#e4e8f0] rounded-xl px-3 text-[14px]" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[12px] font-bold uppercase tracking-wide text-[#6b7a99] mb-1">Organization</label><input required value={refForm.org} onChange={e=>setRefForm({...refForm, org: e.target.value})} className="w-full h-11 border border-[#e4e8f0] rounded-xl px-3 text-[14px]" /></div>
                <div><label className="block text-[12px] font-bold uppercase tracking-wide text-[#6b7a99] mb-1">Relationship</label><input value={refForm.rel} onChange={e=>setRefForm({...refForm, rel: e.target.value})} className="w-full h-11 border border-[#e4e8f0] rounded-xl px-3 text-[14px]" /></div>
              </div>
              <div><label className="block text-[12px] font-bold uppercase tracking-wide text-[#6b7a99] mb-1">Feedback</label><textarea rows={3} value={refForm.text} onChange={e=>setRefForm({...refForm, text: e.target.value})} className="w-full border border-[#e4e8f0] rounded-xl p-3 text-[14px] resize-y"></textarea></div>
              <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setIsRefModalOpen(false)} className="px-4 py-2 border border-[#e4e8f0] rounded-xl text-[13px] font-bold text-[#475569]">Cancel</button><button type="submit" disabled={isSubmittingRef} className="px-5 py-2 bg-[#D8B15B] text-[#133255] rounded-xl text-[13px] font-bold hover:bg-[#e8c97a]">Save</button></div>
            </form>
          </div>
        </div>
      )}

      {/* ... Delete Confirmation ... */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-[#0d162e]/50 z-[100] flex items-center justify-center p-5 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] shadow-2xl w-[400px] overflow-hidden p-6">
            <h3 className="text-[18px] font-bold text-[#111] mb-2">Delete File</h3>
            <p className="text-[14px] text-[#4a5568] mb-6">Are you sure you want to delete <strong>{deleteConfirmation.fileName}</strong>? This cannot be undone.</p>
            <div className="flex justify-end gap-3"><button onClick={() => setDeleteConfirmation(null)} className="px-4 py-2 border border-[#e4e8f0] rounded-xl text-[13px] font-bold text-[#475569]">Cancel</button><button onClick={confirmDeleteFile} className="px-5 py-2 bg-red-600 text-white rounded-xl text-[13px] font-bold hover:bg-red-700">Delete</button></div>
          </div>
        </div>
      )}
      
      {/* ... Past Companies Edit ... */}
      {isPastCompanyModalOpen && (
        <div className="fixed inset-0 bg-[#0d162e]/50 z-[100] flex items-center justify-center p-5 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] shadow-2xl w-[400px] overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-[#e4e8f0] flex justify-between items-center bg-[#f8fafc]">
              <h3 className="font-serif text-[19px] font-bold text-[#111]">Past Companies</h3>
              <button onClick={() => setIsPastCompanyModalOpen(false)} className="text-[#8a93a3] hover:text-[#111]">✕</button>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {localPastCompanies.map(pc => <div key={pc} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f4f8] border border-[#d1d5db] rounded-lg text-[13px] font-bold text-[#4a5568]">{pc}<button onClick={() => handleRemovePastCompany(pc)} className="text-gray-400 hover:text-red-500"><Trash2 size={12}/></button></div>)}
              </div>
              <form onSubmit={handleAddPastCompany} className="flex gap-2">
                <input required value={pastCompanyInput} onChange={e=>setPastCompanyInput(e.target.value)} className="flex-1 h-11 border border-[#e4e8f0] rounded-xl px-3 text-[14px]" placeholder="Add company..." />
                <button type="submit" disabled={isUpdatingPastCompanies} className="px-5 h-11 rounded-xl text-[13px] font-bold bg-[#D8B15B] text-[#133255]">Add</button>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* ... Convert to Client ... */}
      {isClientContactModalOpen && (
        <div className="fixed inset-0 bg-[#0d162e]/50 z-[100] flex items-center justify-center p-5 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] shadow-2xl w-[450px] overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-[#e4e8f0] flex justify-between items-center bg-[#f8fafc]">
              <h3 className="font-serif text-[19px] font-bold text-[#111]">Convert to Client</h3>
              <button onClick={() => setIsClientContactModalOpen(false)} className="text-[#8a93a3] hover:text-[#111]">✕</button>
            </div>
            <form onSubmit={handleConvertToClientContact} className="p-6 space-y-4">
              <div><label className="block text-[12px] font-bold uppercase tracking-wide text-[#6b7a99] mb-1">Select Client</label><select required value={clientContactForm.clientId} onChange={e=>setClientContactForm({...clientContactForm, clientId: e.target.value})} className="w-full h-11 border border-[#e4e8f0] rounded-xl px-3 text-[14px]"><option value="">-- Choose Client --</option>{allClients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[12px] font-bold uppercase tracking-wide text-[#6b7a99] mb-1">Name</label><input required value={clientContactForm.name} onChange={e=>setClientContactForm({...clientContactForm, name: e.target.value})} className="w-full h-11 border border-[#e4e8f0] rounded-xl px-3 text-[14px]" /></div>
                <div><label className="block text-[12px] font-bold uppercase tracking-wide text-[#6b7a99] mb-1">Designation</label><input value={clientContactForm.designation} onChange={e=>setClientContactForm({...clientContactForm, designation: e.target.value})} className="w-full h-11 border border-[#e4e8f0] rounded-xl px-3 text-[14px]" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[12px] font-bold uppercase tracking-wide text-[#6b7a99] mb-1">Phone</label><input value={clientContactForm.number} onChange={e=>setClientContactForm({...clientContactForm, number: e.target.value})} className="w-full h-11 border border-[#e4e8f0] rounded-xl px-3 text-[14px]" /></div>
                <div><label className="block text-[12px] font-bold uppercase tracking-wide text-[#6b7a99] mb-1">Email</label><input type="email" value={clientContactForm.email} onChange={e=>setClientContactForm({...clientContactForm, email: e.target.value})} className="w-full h-11 border border-[#e4e8f0] rounded-xl px-3 text-[14px]" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setIsClientContactModalOpen(false)} className="px-4 py-2 border border-[#e4e8f0] rounded-xl text-[13px] font-bold text-[#475569]">Cancel</button><button type="submit" disabled={isConvertingClient} className="px-5 py-2 bg-[#D8B15B] text-[#133255] rounded-xl text-[13px] font-bold hover:bg-[#e8c97a]">Convert</button></div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
