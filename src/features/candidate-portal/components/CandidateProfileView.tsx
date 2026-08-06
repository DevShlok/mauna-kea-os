"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Briefcase,
  GraduationCap,
  Tag,
  Download,
  Upload,
  Globe,
  DollarSign,
  Edit3,
  X,
  Plus,
  Trash2,
  Save,
  Check,
  Phone,
  Mail,
  Calendar,
  Home as HomeIcon,
  Compass,
  Star,
  FileText,
  Clock,
  Sparkles,
  Camera,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { updateCandidateSelfProfileAction, updateProfilePhotoAction } from "@/actions/candidate-portal";
import toast from "react-hot-toast";
import { VerifiedBadge } from "@/components/ui/StatusBadge";
import { formatCtcValue, parseCtcInput } from "@/lib/helpers";
import { CareerTimeline } from "./CareerTimeline";

function NeoCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`neo-card relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function calculateAge(dobStr?: string | null): string {
  if (!dobStr) return "N/A";
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return dobStr;
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);
  return `${age} yrs`;
}

function calculateTenure(startDateStr?: string | null): string {
  if (!startDateStr) return "N/A";
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return startDateStr;
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years === 0 && months === 0) return "Just started";
  const yearText = years > 0 ? `${years} year${years > 1 ? "s" : ""}` : "";
  const monthText = months > 0 ? `${months} month${months > 1 ? "s" : ""}` : "";
  return [yearText, monthText].filter(Boolean).join(", ");
}

export function CandidateProfileView({
  candidate,
  isVerified = false,
}: {
  candidate: any;
  isVerified?: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"primary" | "currentRole" | "workHistory" | "demographics" | "financials" | "education" | "career">("primary");
  const [isSaving, setIsSaving] = useState(false);

  // Resume upload state
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCv, setIsUploadingCv] = useState(false);

  // Editable state initialized from candidate
  const [form, setForm] = useState({
    name: candidate?.name || "",
    mobile: candidate?.mobile || "",
    email: candidate?.email || "",
    designation: candidate?.designation || "",
    company: candidate?.company || "",
    location: candidate?.location || "",
    hometown: candidate?.hometown || "",
    dob: candidate?.dob || "",
    relocationStatus: candidate?.relocationStatus || "Open to relocation",
    relocationPrefs: candidate?.relocationPrefs || "",
    linkedin: candidate?.linkedin || "",
    exp: candidate?.exp || candidate?.expYears || "",
    currentCompanyStartDate: candidate?.currentCompanyStartDate || "",
    ctc: candidate?.ctc || "",
    fixedCtc: candidate?.fixedCtc || candidate?.ctc || "",
    variableCtc: candidate?.variableCtc || "",
    expectedCtc: candidate?.expected || candidate?.expectedCtc || "",
    esops: candidate?.esops || "",
    esopVesting: candidate?.esopVesting || { years: 3, distribution: [20, 30, 50] },
    notice: candidate?.notice || "",
    stability: typeof candidate?.stability === "object" ? candidate?.stability?.current || "" : candidate?.stability || "",
    expTags: Array.isArray(candidate?.expTags) ? candidate.expTags : [],
    pastCompanies: Array.isArray(candidate?.pastCompanies) ? candidate.pastCompanies : [],
    qual: Array.isArray(candidate?.qual) ? candidate.qual : [],
    priorExperiences: Array.isArray(candidate?.priorExperiences) ? candidate.priorExperiences : [],
    dreamRoles: Array.isArray(candidate?.dreamRoles) ? candidate.dreamRoles : [],
    dreamCos: Array.isArray(candidate?.dreamCos) ? candidate.dreamCos : [],
    notes: candidate?.notes || "",
  });

  const [tagInput, setTagInput] = useState("");
  const [companyInput, setCompanyInput] = useState("");
  const [dreamRoleInput, setDreamRoleInput] = useState("");
  const [dreamCoInput, setDreamCoInput] = useState("");
  const [qualInput, setQualInput] = useState({ degree: "", college: "", year: "" });
  const [priorInput, setPriorInput] = useState({ companyName: "", position: "", duration: "" });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  if (!candidate) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-slate-500 font-medium">
        Candidate profile not found.
      </div>
    );
  }

  const age = calculateAge(candidate.dob);
  const tenureCalc = calculateTenure(candidate.currentCompanyStartDate);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCandidateSelfProfileAction(candidate.id, {
        name: form.name,
        mobile: form.mobile,
        email: form.email,
        designation: form.designation,
        company: form.company,
        location: form.location,
        hometown: form.hometown,
        dob: form.dob,
        relocationStatus: form.relocationStatus,
        relocationPrefs: Array.isArray(form.relocationPrefs) ? form.relocationPrefs : [form.relocationStatus],
        linkedin: form.linkedin,
        exp: form.exp ? Number(form.exp) : undefined,
        currentCompanyStartDate: form.currentCompanyStartDate,
        ctc: form.ctc !== "" ? (parseCtcInput(form.ctc) ?? undefined) : undefined,
        fixedCtc: form.fixedCtc !== "" ? (parseCtcInput(form.fixedCtc) ?? undefined) : undefined,
        variableCtc: form.variableCtc !== "" ? (parseCtcInput(form.variableCtc) ?? undefined) : undefined,
        expectedCtc: form.expectedCtc !== "" ? (parseCtcInput(form.expectedCtc) ?? undefined) : undefined,
        esops: form.esops !== "" ? (parseCtcInput(form.esops) ?? undefined) : undefined,
        esopVesting: form.esopVesting,
        notice: form.notice ? Number(form.notice) : undefined,
        stability: form.stability ? { current: String(form.stability), previous: typeof candidate?.stability === "object" ? candidate?.stability?.previous || "" : "" } : undefined,
        expTags: form.expTags,
        pastCompanies: form.pastCompanies,
        priorExperiences: form.priorExperiences,
        qual: form.qual,
        dreamRoles: form.dreamRoles,
        dreamCos: form.dreamCos,
        notes: form.notes,
      });

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-profile-pic", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload photo");
      const { base64 } = await res.json();

      await updateProfilePhotoAction(candidate.id, base64);
      toast.success("Profile photo updated");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCvUploadClick = () => {
    cvInputRef.current?.click();
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      toast.error("Please upload a PDF or DOCX file.");
      return;
    }

    setIsUploadingCv(true);
    try {
      const formData = new FormData();
      const filename = file.name || `${candidate.name || "Candidate"} - CV.pdf`;
      formData.append("file", file, filename);
      formData.append("candId", candidate.id);

      const res = await fetch("/api/upload-cv", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to upload resume");
      }

      toast.success("Resume updated successfully!");
      router.refresh();
    } catch (err: any) {
      console.error("CV Upload error:", err);
      toast.error(err.message || "Failed to upload resume");
    } finally {
      setIsUploadingCv(false);
      if (e.target) e.target.value = "";
    }
  };

  // Only return the single latest uploaded resume / CV for candidate view
  const getLatestResume = () => {
    const files = candidate.files ? [...candidate.files] : [];
    const cvFiles = files.filter(
      (f: any) =>
        f.fileType &&
        (f.fileType.toLowerCase().includes("cv") ||
          f.fileType.toLowerCase().includes("resume"))
    );

    if (cvFiles.length > 0) {
      cvFiles.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      return cvFiles[0];
    }

    if (candidate.hasCv && candidate.cvFileName) {
      return {
        id: -1,
        fileType: "CV / Resume",
        fileName: candidate.cvFileName.split("/").pop() || `${candidate.name || "Candidate"} - CV.pdf`,
        fileUrl: candidate.cvFileName.startsWith("http")
          ? candidate.cvFileName
          : `/api/candidates/${candidate.id}/cv`,
        createdAt: candidate.updatedAt || candidate.createdAt || new Date().toISOString(),
      };
    }

    return null;
  };

  const latestResume = getLatestResume();

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !form.expTags.includes(val)) {
      setForm({ ...form, expTags: [...form.expTags, val] });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm({ ...form, expTags: form.expTags.filter((t: string) => t !== tagToRemove) });
  };

  const addDreamRole = () => {
    const val = dreamRoleInput.trim();
    if (val && !form.dreamRoles.includes(val)) {
      setForm({ ...form, dreamRoles: [...form.dreamRoles, val] });
      setDreamRoleInput("");
    }
  };

  const removeDreamRole = (roleToRemove: string) => {
    setForm({ ...form, dreamRoles: form.dreamRoles.filter((r: string) => r !== roleToRemove) });
  };

  const addDreamCo = () => {
    const val = dreamCoInput.trim();
    if (val && !form.dreamCos.includes(val)) {
      setForm({ ...form, dreamCos: [...form.dreamCos, val] });
      setDreamCoInput("");
    }
  };

  const removeDreamCo = (coToRemove: string) => {
    setForm({ ...form, dreamCos: form.dreamCos.filter((c: string) => c !== coToRemove) });
  };

  const addQual = () => {
    if (qualInput.degree.trim()) {
      setForm({ ...form, qual: [...form.qual, { ...qualInput }] });
      setQualInput({ degree: "", college: "", year: "" });
    }
  };

  const removeQual = (index: number) => {
    setForm({ ...form, qual: form.qual.filter((_: any, i: number) => i !== index) });
  };

  const addPriorExp = () => {
    if (priorInput.companyName.trim() && priorInput.position.trim()) {
      setForm({
        ...form,
        priorExperiences: [...form.priorExperiences, { ...priorInput }],
        pastCompanies: form.pastCompanies.includes(priorInput.companyName.trim())
          ? form.pastCompanies
          : [...form.pastCompanies, priorInput.companyName.trim()],
      });
      setPriorInput({ companyName: "", position: "", duration: "" });
    }
  };

  const removePriorExp = (index: number) => {
    setForm({ ...form, priorExperiences: form.priorExperiences.filter((_: any, i: number) => i !== index) });
  };

  const initials =
    candidate.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "MK";

  const getFilesList = () => {
    let files = candidate.files ? [...candidate.files] : [];
    if (candidate.hasCv && candidate.cvFileName?.startsWith("http")) {
      const hasCvInFiles = files.some(
        (f: any) =>
          f.fileType.toLowerCase().includes("cv") ||
          f.fileType.toLowerCase().includes("resume")
      );
      if (!hasCvInFiles) {
        files.push({
          id: -1,
          fileType: "CV / Resume",
          fileName: candidate.cvFileName.split("/").pop() || "Legacy_CV.pdf",
          fileUrl: candidate.cvFileName,
          createdAt: candidate.createdAt || new Date().toISOString(),
        });
      }
    }
    if (candidate.linkedinPdf && candidate.linkedinPdf.startsWith("http")) {
      const hasLiInFiles = files.some((f: any) =>
        f.fileType.toLowerCase().includes("linkedin")
      );
      if (!hasLiInFiles) {
        files.push({
          id: -2,
          fileType: "LinkedIn Profile",
          fileName: "LinkedIn_Profile.pdf",
          fileUrl: candidate.linkedinPdf,
          createdAt: candidate.createdAt || new Date().toISOString(),
        });
      }
    }
    return files;
  };

  const allFiles = getFilesList();

  if (isEditing) {
    return (
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 pb-16">
        {/* Sticky Header */}
        <div className="neo-card p-5 sticky top-0 z-40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="neo-btn p-2.5 text-slate-700 font-bold flex items-center justify-center"
              title="Back to profile"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-[19px] font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#133255]" /> Edit Candidate Profile
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Update your professional details, work history, and compensation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="neo-btn px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="neo-btn-primary flex items-center gap-2 px-6 py-2.5 text-xs font-bold disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs Bar */}
        <div className="flex text-[13px] font-bold overflow-x-auto neo-inset p-2 gap-2">
          {[
            ["primary", "Primary & Contact"],
            ["currentRole", "Current Role"],
            ["workHistory", `Work History (${form.priorExperiences.length})`],
            ["demographics", "Demographics"],
            ["financials", "Compensation"],
            ["education", "Education"],
            ["career", "Career Aspirations"],
          ].map(([tabKey, tabLabel]) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveTab(tabKey as any)}
              className={`py-2 px-4 whitespace-nowrap transition-all rounded-xl ${
                activeTab === tabKey
                  ? "neo-btn-primary font-extrabold text-white"
                  : "text-slate-600 hover:text-slate-900 font-semibold hover:bg-slate-200/50"
              }`}
            >
              {tabLabel}
            </button>
          ))}
        </div>

        {/* Tab 1: Primary & Contact */}
        {activeTab === "primary" && (
          <NeoCard className="p-7 flex flex-col gap-6">
            <div className="border-b border-slate-200/60 pb-3">
              <h2 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#133255]" /> Primary & Contact Details
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Basic profile details and contact information.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-slate-800 outline-none font-medium neo-inset"
                  required
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-4 py-2.5 rounded-xl text-slate-800 outline-none font-medium neo-inset"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 rounded-xl text-slate-800 outline-none font-medium neo-inset"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2.5 rounded-xl text-slate-800 outline-none font-medium neo-inset"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">
                  Location / Current City
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Mumbai, India"
                  className="w-full px-4 py-2.5 rounded-xl text-slate-800 outline-none font-medium neo-inset"
                />
              </div>
            </div>
          </NeoCard>
        )}

        {/* Tab 2: Current Role */}
        {activeTab === "currentRole" && (
          <NeoCard className="p-7 flex flex-col gap-6">
            <div className="border-b border-slate-200/60 pb-3">
              <h2 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#133255]" /> Current Role & Overall Experience
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Details regarding your present job and total experience.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">
                  Current Designation
                </label>
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  placeholder="e.g. Finance Lead"
                  className="w-full px-4 py-2.5 rounded-xl text-slate-800 outline-none font-medium neo-inset"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">
                  Current Company
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="e.g. HDFC Bank"
                  className="w-full px-4 py-2.5 rounded-xl text-slate-800 outline-none font-medium neo-inset"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">
                  Start Date in Current Company
                </label>
                <input
                  type="month"
                  value={form.currentCompanyStartDate}
                  onChange={(e) => setForm({ ...form, currentCompanyStartDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-slate-800 outline-none font-medium neo-inset"
                />
                {form.currentCompanyStartDate && (
                  <span className="text-xs text-emerald-600 font-bold mt-1 block">
                    Tenure: {calculateTenure(form.currentCompanyStartDate)}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">
                  Total Experience (yrs)
                </label>
                <input
                  type="number"
                  value={form.exp}
                  onChange={(e) => setForm({ ...form, exp: e.target.value })}
                  placeholder="e.g. 15"
                  className="w-full px-4 py-2.5 rounded-xl text-slate-800 outline-none font-medium neo-inset"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">
                  Notice Period (days)
                </label>
                <input
                  type="number"
                  value={form.notice}
                  onChange={(e) => setForm({ ...form, notice: e.target.value })}
                  placeholder="e.g. 90"
                  className="w-full px-4 py-2.5 rounded-xl text-slate-800 outline-none font-medium neo-inset"
                />
              </div>
            </div>
          </NeoCard>
        )}

        {/* Tab 3: Work History */}
        {activeTab === "workHistory" && (
          <NeoCard className="p-7 flex flex-col gap-6">
            <div className="border-b border-slate-200/60 pb-3">
              <h2 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#133255]" /> Prior Work Experience History
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add your previous companies, roles held, and employment time periods.
              </p>
            </div>

            {form.priorExperiences.length > 0 ? (
              <div className="space-y-3">
                {form.priorExperiences.map((exp: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm"
                  >
                    <div>
                      <span className="font-bold text-slate-800 text-sm block">
                        {exp.position || exp.role || "Role / Title"}
                      </span>
                      <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                        <span className="text-[#133255] font-bold">
                          {exp.companyName || exp.company}
                        </span>
                        {exp.duration && <span>• {exp.duration}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePriorExp(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      title="Remove experience"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                No prior work experience added yet.
              </p>
            )}

            <div className="p-5 rounded-2xl bg-white/70 border border-slate-200 flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Add Past Work Experience
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Role / Position *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Finance Lead / VP"
                    value={priorInput.position}
                    onChange={(e) =>
                      setPriorInput({ ...priorInput, position: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl text-slate-800 text-xs font-medium outline-none neo-inset"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kotak Mahindra Bank"
                    value={priorInput.companyName}
                    onChange={(e) =>
                      setPriorInput({ ...priorInput, companyName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl text-slate-800 text-xs font-medium outline-none neo-inset"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Time Period / Duration
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 2018 - 2022"
                      value={priorInput.duration}
                      onChange={(e) =>
                        setPriorInput({ ...priorInput, duration: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl text-slate-800 text-xs font-medium outline-none neo-inset"
                    />
                    <button
                      type="button"
                      onClick={addPriorExp}
                      className="px-4 py-2.5 bg-[#133255] hover:bg-[#1a4270] text-white font-bold rounded-xl text-xs shrink-0 transition-all shadow-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </NeoCard>
        )}

        {/* Tab 4: Demographics */}
        {activeTab === "demographics" && (
          <NeoCard className="p-7 flex flex-col gap-6">
            <div className="border-b border-slate-200/60 pb-3">
              <h2 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
                <HomeIcon className="w-5 h-5 text-[#133255]" /> Demographics & Relocation Preferences
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Date of birth, hometown, and relocation choices.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-slate-800 outline-none font-medium neo-inset"
                />
                {form.dob && (
                  <span className="text-xs text-emerald-600 font-bold mt-1 block">
                    Calculated Age: {calculateAge(form.dob)}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">
                  Hometown
                </label>
                <input
                  type="text"
                  value={form.hometown}
                  onChange={(e) => setForm({ ...form, hometown: e.target.value })}
                  placeholder="e.g. Lucknow, UP"
                  className="w-full px-4 py-2.5 rounded-xl text-slate-800 outline-none font-medium neo-inset"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-600 mb-1.5">
                Relocation Preference
              </label>
              <select
                value={form.relocationStatus}
                onChange={(e) => setForm({ ...form, relocationStatus: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-slate-800 outline-none font-medium neo-inset"
              >
                <option value="Open to relocation">Open to relocation</option>
                <option value="Not open to relocation">Not open to relocation</option>
                <option value="Open to hybrid/remote only">Open to hybrid/remote only</option>
              </select>
            </div>
          </NeoCard>
        )}

        {/* Tab 5: Compensation */}
        {activeTab === "financials" && (
          <NeoCard className="p-7 flex flex-col gap-6">
            <div className="border-b border-slate-200/60 pb-3">
              <h2 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#133255]" /> Compensation & Financial Details
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Fixed, variable, expected CTC and ESOP details.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">
                  Fixed CTC (Lacs / Cr)
                </label>
                <input
                  type="text"
                  value={form.fixedCtc}
                  onChange={(e) => setForm({ ...form, fixedCtc: e.target.value })}
                  placeholder="e.g. 100 or 1 Cr"
                  className="w-full px-4 py-2.5 rounded-xl text-slate-800 outline-none font-medium neo-inset"
                />
                {form.fixedCtc && parseCtcInput(form.fixedCtc) !== null && (
                  <span className="text-xs text-emerald-600 font-bold mt-1 block">
                    Preview: {formatCtcValue(parseCtcInput(form.fixedCtc))}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">
                  Variable CTC (Lacs)
                </label>
                <input
                  type="text"
                  value={form.variableCtc}
                  onChange={(e) => setForm({ ...form, variableCtc: e.target.value })}
                  placeholder="e.g. 40"
                  className="w-full px-4 py-2.5 rounded-xl text-slate-800 outline-none font-medium neo-inset"
                />
                {form.variableCtc && parseCtcInput(form.variableCtc) !== null && (
                  <span className="text-xs text-emerald-600 font-bold mt-1 block">
                    Preview: {formatCtcValue(parseCtcInput(form.variableCtc))}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">
                  Total Current CTC
                </label>
                <input
                  type="text"
                  value={form.ctc}
                  onChange={(e) => setForm({ ...form, ctc: e.target.value })}
                  placeholder="e.g. 140 or 1.4 Cr"
                  className="w-full px-4 py-2.5 rounded-xl text-slate-800 outline-none font-medium neo-inset"
                />
                {form.ctc && parseCtcInput(form.ctc) !== null && (
                  <span className="text-xs text-emerald-600 font-bold mt-1 block">
                    Preview: {formatCtcValue(parseCtcInput(form.ctc))}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">
                  Expected CTC
                </label>
                <input
                  type="text"
                  value={form.expectedCtc}
                  onChange={(e) => setForm({ ...form, expectedCtc: e.target.value })}
                  placeholder="e.g. 160 or 1.6 Cr"
                  className="w-full px-4 py-2.5 rounded-xl text-slate-800 outline-none font-medium neo-inset"
                />
                {form.expectedCtc && parseCtcInput(form.expectedCtc) !== null && (
                  <span className="text-xs text-emerald-600 font-bold mt-1 block">
                    Preview: {formatCtcValue(parseCtcInput(form.expectedCtc))}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">
                  ESOPs Value (Lacs/Cr)
                </label>
                <input
                  type="text"
                  value={form.esops}
                  onChange={(e) => setForm({ ...form, esops: e.target.value })}
                  placeholder="e.g. 30"
                  className="w-full px-4 py-2.5 rounded-xl text-slate-800 outline-none font-medium neo-inset"
                />
              </div>
            </div>
          </NeoCard>
        )}

        {/* Tab 6: Education */}
        {activeTab === "education" && (
          <NeoCard className="p-7 flex flex-col gap-6">
            <div className="border-b border-slate-200/60 pb-3">
              <h2 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#133255]" /> Education & Qualifications
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Degrees, institutes, and graduation years.</p>
            </div>

            {form.qual.length > 0 ? (
              <div className="space-y-3">
                {form.qual.map((q: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm"
                  >
                    <div>
                      <span className="font-bold text-slate-800 text-sm">
                        {typeof q === "string" ? q : q.degree}
                      </span>
                      {q.college && (
                        <span className="text-slate-500 text-xs font-medium ml-2">
                          ({q.college})
                        </span>
                      )}
                      {q.year && (
                        <span className="text-[#133255] text-xs font-bold ml-2">• {q.year}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQual(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">No qualifications added yet.</p>
            )}

            <div className="p-5 rounded-2xl bg-white/70 border border-slate-200 flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Add Qualification
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Degree (e.g. MBA / B.Tech)"
                  value={qualInput.degree}
                  onChange={(e) => setQualInput({ ...qualInput, degree: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl text-slate-800 text-xs font-medium outline-none neo-inset"
                />
                <input
                  type="text"
                  placeholder="Institute (e.g. ISB / IIT Delhi)"
                  value={qualInput.college}
                  onChange={(e) => setQualInput({ ...qualInput, college: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl text-slate-800 text-xs font-medium outline-none neo-inset"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Year (e.g. 2015)"
                    value={qualInput.year}
                    onChange={(e) => setQualInput({ ...qualInput, year: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-slate-800 text-xs font-medium outline-none neo-inset"
                  />
                  <button
                    type="button"
                    onClick={addQual}
                    className="px-4 py-2.5 bg-[#133255] hover:bg-[#1a4270] text-white font-bold rounded-xl text-xs shrink-0 transition-all shadow-sm"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </NeoCard>
        )}

        {/* Tab 7: Career Aspirations */}
        {activeTab === "career" && (
          <NeoCard className="p-7 flex flex-col gap-6">
            <div className="border-b border-slate-200/60 pb-3">
              <h2 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
                <Star className="w-5 h-5 text-[#D8B15B]" /> Career Aspirations
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Dream roles and target companies.</p>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                Dream Roles
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="e.g. CFO, VP Finance..."
                  value={dreamRoleInput}
                  onChange={(e) => setDreamRoleInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-slate-800 text-xs font-medium outline-none neo-inset"
                />
                <button
                  type="button"
                  onClick={addDreamRole}
                  className="px-4 py-2.5 text-white font-bold rounded-xl text-xs bg-[#133255] hover:bg-[#1a4270] transition-all"
                >
                  Add Role
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.dreamRoles.map((r: string) => (
                  <span
                    key={r}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 shadow-sm"
                  >
                    {r}
                    <button
                      type="button"
                      onClick={() => removeDreamRole(r)}
                      className="hover:text-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                Target / Dream Companies
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="e.g. Kotak, Axis Bank..."
                  value={dreamCoInput}
                  onChange={(e) => setDreamCoInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-slate-800 text-xs font-medium outline-none neo-inset"
                />
                <button
                  type="button"
                  onClick={addDreamCo}
                  className="px-4 py-2.5 text-white font-bold rounded-xl text-xs bg-[#133255] hover:bg-[#1a4270] transition-all"
                >
                  Add Company
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.dreamCos.map((c: string) => (
                  <span
                    key={c}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#133255] text-white shadow-sm"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => removeDreamCo(c)}
                      className="hover:text-rose-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </NeoCard>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-12">
      {/* ─── Top Header Card ────────────────────────────────────────── */}
      <NeoCard className="p-7">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative shrink-0">
            {candidate.profilePic ? (
              <img
                src={candidate.profilePic}
                alt={candidate.name}
                className="w-24 h-24 rounded-2xl object-cover"
                style={{
                  border: "2px solid #e0e5ec",
                  boxShadow: "4px 4px 10px rgba(163,177,198,0.5)",
                }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-white font-serif text-3xl font-bold"
                style={{
                  background: "linear-gradient(135deg, #133255, #1d4d82)",
                  boxShadow:
                    "4px 4px 12px rgba(163,177,198,0.5), -4px -4px 12px rgba(255,255,255,0.8)",
                }}
              >
                {initials}
              </div>
            )}

            <label
              htmlFor="photo-upload"
              className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-md cursor-pointer hover:bg-slate-50 transition-all z-10 border border-slate-100"
              title="Change Profile Photo"
            >
              {isUploadingPhoto ? (
                <Loader2 className="w-4 h-4 text-[#F15A29] animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-[#133255]" />
              )}
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={isUploadingPhoto}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-slate-800 text-2xl md:text-3xl font-bold">
                {candidate.name}
              </h1>
              {candidate.isVerified && <VerifiedBadge size="lg" />}
              {candidate.linkedin && (
                <a
                  href={candidate.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 transition-colors p-1"
                  title="LinkedIn Profile"
                >
                  <Globe className="w-5 h-5" />
                </a>
              )}
            </div>
            <p className="text-[#133255] text-[16px] font-bold mt-1">
              {candidate.designation || "Executive Leadership"}
            </p>

            <div className="flex items-center gap-4 text-slate-500 font-medium text-[13px] mt-2.5 flex-wrap">
              {candidate.company && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {candidate.company}
                </span>
              )}
              {candidate.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {candidate.location}
                </span>
              )}
              {candidate.mobile && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {candidate.mobile}
                </span>
              )}
              {candidate.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {candidate.email}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3.5 mt-3 sm:mt-0 shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all hover:-translate-y-0.5 neo-inset"
            >
              <Edit3 className="w-4 h-4 text-[#133255]" /> Edit Profile
            </button>

            {candidate.hasCv && (
              <a
                href={`/api/candidates/${candidate.id}/cv`}
                target="_blank"
                rel="noopener noreferrer"
                className="neo-btn-primary flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold"
              >
                <Download className="w-4 h-4" /> Download CV
              </a>
            )}
          </div>
        </div>
      </NeoCard>

      {/* ─── Demographics & Relocation Summary ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NeoCard className="p-5 flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#133255] shrink-0 neo-inset"
          >
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Date of Birth / Age
            </span>
            <div className="text-[15px] font-bold text-slate-800 mt-0.5">
              {candidate.dob || "Not specified"}{" "}
              {age !== null && (
                <span className="text-xs text-slate-500 font-semibold ml-1">
                  ({age} yrs)
                </span>
              )}
            </div>
          </div>
        </NeoCard>

        <NeoCard className="p-5 flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#133255] shrink-0 neo-inset"
          >
            <HomeIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Hometown
            </span>
            <div className="text-[15px] font-bold text-slate-800 mt-0.5">
              {candidate.hometown || "Not specified"}
            </div>
          </div>
        </NeoCard>

        <NeoCard className="p-5 flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#133255] shrink-0 neo-inset"
          >
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Relocation Preference
            </span>
            <div className="text-[15px] font-bold text-slate-800 mt-0.5">
              {candidate.relocationStatus || candidate.relocationPrefs || "Open to relocation"}
            </div>
          </div>
        </NeoCard>
      </div>

      {/* ─── Compensation & Status Grid ──────────────────────────── */}
      <NeoCard className="p-6 flex flex-col gap-5">
        <div className="flex justify-between items-center border-b border-slate-200/60 pb-4">
          <h2 className="text-slate-800 text-[17px] font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#133255]" />
            Compensation & Financial Overview
          </h2>
          <button
            onClick={() => {
              setActiveTab("financials");
              setIsEditing(true);
            }}
            className="text-[12px] text-[#133255] font-bold hover:underline flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Compensation
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["Fixed CTC", candidate.fixedCtc || candidate.ctc],
            ["Variable CTC", candidate.variableCtc],
            ["Total Current CTC", candidate.ctc],
            ["Expected CTC", candidate.expected || candidate.expectedCtc],
          ].map(([label, value]) => (
            <div
              key={label as string}
              className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex flex-col justify-between"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {label}
              </span>
              <div className="font-serif text-[18px] md:text-[20px] font-bold text-[#133255] mt-1">
                {formatCtcValue(value as number | string, candidate.currency)}
              </div>
            </div>
          ))}
        </div>

        {/* ESOPs & Vesting Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              ESOPs Value
            </span>
            <div className="font-serif text-[18px] font-bold text-[#133255] mt-1">
              {candidate.esops
                ? formatCtcValue(candidate.esops, candidate.currency)
                : "None"}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Notice Period
            </span>
            <div className="text-[16px] font-bold text-slate-800 mt-1">
              {candidate.notice ? `${candidate.notice} Days` : "Immediate / Negotiable"}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Current Company Tenure
            </span>
            <div className="text-[15px] font-bold text-slate-800 mt-1">
              {tenureCalc || (candidate.stability ? `${candidate.stability} Years` : "Not specified")}
            </div>
          </div>
        </div>

        {candidate.esopVesting && candidate.esopVesting.distribution?.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mt-1">
            <span className="text-[12px] font-bold text-[#133255] uppercase tracking-wider block mb-2">
              ESOP Vesting Schedule ({candidate.esopVesting.years || candidate.esopVesting.distribution.length} Years)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {candidate.esopVesting.distribution.map((pct: number, idx: number) => {
                const esopVal = candidate.esops ? (candidate.esops * pct) / 100 : null;
                return (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col items-center"
                  >
                    <span className="text-[11px] font-semibold text-slate-400">
                      Year {idx + 1}
                    </span>
                    <span className="text-[14px] font-bold text-slate-800 mt-0.5">
                      {pct}%
                    </span>
                    {esopVal && (
                      <span className="text-[11px] text-emerald-600 font-bold mt-0.5">
                        {formatCtcValue(esopVal, candidate.currency)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </NeoCard>

      {/* ─── Qualifications & Education ──────────────────────────── */}
      <NeoCard className="p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
          <h2 className="text-slate-800 text-[17px] font-bold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#133255]" />
            Qualifications & Education
          </h2>
          <button
            onClick={() => {
              setActiveTab("education");
              setIsEditing(true);
            }}
            className="text-[12px] text-[#133255] font-bold hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Qualification
          </button>
        </div>

        {Array.isArray(candidate.qual) && candidate.qual.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {candidate.qual.map((q: any, i: number) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <span className="text-slate-800 font-bold text-[15px] block">
                  {typeof q === "string" ? q : q.degree || q.title}
                </span>
                {q.college && (
                  <span className="text-slate-500 text-[12px] font-medium mt-1 block">
                    {q.college}
                  </span>
                )}
                {q.year && (
                  <span className="text-[#133255] font-bold text-[12px] mt-2 block">
                    Passout Year: {q.year}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 text-sm font-medium">
            No education details listed yet. Click "+ Add Qualification" to add your degrees.
          </div>
        )}
      </NeoCard>

      {/* ─── Career Timeline & Past Companies ──────────────────────── */}
      <CareerTimeline candId={candidate.id} timeline={candidate.priorExperiences || []} />

      {/* ─── Competencies & Career Aspirations ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Competencies & Experience Tags */}
        <NeoCard className="p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
            <h2 className="text-slate-800 text-[16px] font-bold flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#133255]" />
              Experience Tags & Competencies
            </h2>
            <button
              onClick={() => {
                setActiveTab("workHistory");
                setIsEditing(true);
              }}
              className="text-[12px] text-[#133255] font-bold hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>

          {Array.isArray(candidate.expTags) && candidate.expTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {candidate.expTags.map((tag: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl text-[12.5px] font-bold text-[#133255] bg-white border border-slate-200 shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-xs font-medium py-4 text-center">
              No experience tags listed yet. (e.g. CFO - HDFC Bank, Finance Lead - Kotak)
            </p>
          )}
        </NeoCard>

        {/* Career Aspirations (Dream Roles & Companies) */}
        <NeoCard className="p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
            <h2 className="text-slate-800 text-[16px] font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-[#D8B15B]" />
              Career Aspirations
            </h2>
            <button
              onClick={() => {
                setActiveTab("career");
                setIsEditing(true);
              }}
              className="text-[12px] text-[#133255] font-bold hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Aspirations
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Dream Roles
              </span>
              {Array.isArray(candidate.dreamRoles) && candidate.dreamRoles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {candidate.dreamRoles.map((r: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl text-[12px] font-bold text-slate-800 bg-amber-50 border border-amber-200"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">No dream roles added yet.</span>
              )}
            </div>

            <div className="pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Target / Dream Companies
              </span>
              {Array.isArray(candidate.dreamCos) && candidate.dreamCos.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {candidate.dreamCos.map((c: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl text-[12px] font-bold text-white bg-[#133255] shadow-sm"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">No target companies added yet.</span>
              )}
            </div>
          </div>
        </NeoCard>
      </div>

      {/* ─── Uploaded Resume Section ──────────────────────── */}
      <NeoCard className="p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
          <h2 className="text-slate-800 text-[17px] font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#133255]" />
            Your Resume / CV
          </h2>
          <input
            type="file"
            ref={cvInputRef}
            onChange={handleCvUpload}
            accept=".pdf,.doc,.docx"
            className="hidden"
          />
          <button
            onClick={handleCvUploadClick}
            disabled={isUploadingCv}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#133255] hover:bg-[#1a4270] transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isUploadingCv ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {isUploadingCv
              ? "Uploading..."
              : latestResume
              ? "Upload New Version"
              : "Upload Resume"}
          </button>
        </div>

        {latestResume ? (
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#133255] shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm truncate">
                    {latestResume.fileName}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                    Latest Version
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>
                    Uploaded on{" "}
                    {new Date(latestResume.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {latestResume.fileUrl && (
                <a
                  href={latestResume.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#133255] bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/60 transition-all flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Download Resume
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center flex flex-col items-center gap-3 bg-white/50 rounded-2xl border border-dashed border-slate-300/80 p-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#133255]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-700 text-sm font-bold">No resume uploaded yet</p>
              <p className="text-slate-400 text-xs mt-1">
                Upload your CV to keep your executive profile up-to-date.
              </p>
            </div>
            <button
              onClick={handleCvUploadClick}
              disabled={isUploadingCv}
              className="mt-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#133255] hover:bg-[#1a4270] transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isUploadingCv ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {isUploadingCv ? "Uploading..." : "Upload Resume (PDF/DOCX)"}
            </button>
          </div>
        )}
      </NeoCard>

    </div>
  );
}
