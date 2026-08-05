"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Briefcase,
  GraduationCap,
  Tag,
  Download,
  Globe,
  DollarSign,
  Edit3,
  X,
  Plus,
  Trash2,
  Save,
  Check,
} from "lucide-react";
import { updateCandidateSelfProfileAction } from "@/actions/candidate-portal";
import toast from "react-hot-toast";
import { VerifiedBadge } from "@/components/ui/StatusBadge";
import { Camera, Loader2 } from "lucide-react";
import { updateProfilePhotoAction } from "@/actions/candidate-portal";
import { CareerTimeline } from "./CareerTimeline";

function NeoCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[36px] relative overflow-hidden ${className}`}
      style={{
        background: "#eef2f7",
        boxShadow: "12px 12px 24px #cbd5e1, -12px -12px 24px #ffffff",
      }}
    >
      {children}
    </div>
  );
}

export function CandidateProfileView({ candidate, isVerified = false }: { candidate: any, isVerified?: boolean }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "career" | "tags" | "history">("general");
  const [isSaving, setIsSaving] = useState(false);

  // Editable state initialized from candidate
  const [form, setForm] = useState({
    designation: candidate?.designation || "",
    company: candidate?.company || "",
    location: candidate?.location || "",
    linkedin: candidate?.linkedin || "",
    fixedCtc: candidate?.fixedCtc || candidate?.ctc || "",
    expectedCtc: candidate?.expected || candidate?.expectedCtc || "",
    notice: candidate?.notice || "",
    expTags: Array.isArray(candidate?.expTags) ? candidate.expTags : [],
    pastCompanies: Array.isArray(candidate?.pastCompanies) ? candidate.pastCompanies : [],
    qual: Array.isArray(candidate?.qual) ? candidate.qual : [],
  });

  const [tagInput, setTagInput] = useState("");
  const [companyInput, setCompanyInput] = useState("");
  const [qualInput, setQualInput] = useState({ degree: "", college: "", year: "" });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  if (!candidate) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-white/50">
        Candidate profile not found.
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCandidateSelfProfileAction(candidate.id, {
        designation: form.designation,
        company: form.company,
        location: form.location,
        linkedin: form.linkedin,
        fixedCtc: form.fixedCtc ? Number(form.fixedCtc) : undefined,
        expectedCtc: form.expectedCtc ? Number(form.expectedCtc) : undefined,
        notice: form.notice ? Number(form.notice) : undefined,
        expTags: form.expTags,
        pastCompanies: form.pastCompanies,
        qual: form.qual,
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

  const addCompany = () => {
    const val = companyInput.trim();
    if (val && !form.pastCompanies.includes(val)) {
      setForm({ ...form, pastCompanies: [...form.pastCompanies, val] });
      setCompanyInput("");
    }
  };

  const removeCompany = (coToRemove: string) => {
    setForm({
      ...form,
      pastCompanies: form.pastCompanies.filter((c: string) => c !== coToRemove),
    });
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

  const initials =
    candidate.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "MK";

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Top Header Card */}
      <NeoCard className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative shrink-0">
            {candidate.profilePic ? (
              <img
                src={candidate.profilePic}
                alt={candidate.name}
                className="w-20 h-20 rounded-2xl object-cover"
                style={{ border: "2px solid #e0e5ec", boxShadow: "4px 4px 8px rgba(163,177,198,0.5)" }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-serif text-2xl font-bold"
                style={{
                  background: "linear-gradient(135deg, #133255, #1d4d82)",
                  boxShadow: "4px 4px 10px rgba(163,177,198,0.5), -4px -4px 10px rgba(255,255,255,0.8)",
                }}
              >
                {initials}
              </div>
            )}
            
            <label htmlFor="photo-upload" className="absolute -bottom-2 -right-2 p-1.5 bg-white rounded-full shadow-md cursor-pointer hover:bg-slate-50 transition-colors z-10 border border-slate-100">
              {isUploadingPhoto ? (
                <Loader2 className="w-4 h-4 text-[#F15A29] animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-[#133255]" />
              )}
            </label>
            <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-slate-800 text-2xl font-bold">{candidate.name}</h1>
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
            <p className="text-[#133255] text-[15px] font-bold mt-1">
              {candidate.designation || "Executive Designation"}
            </p>
            <div className="flex items-center gap-4 text-slate-500 font-medium text-[13px] mt-2 flex-wrap">
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
              {candidate.expYears && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  {candidate.expYears} Years Exp
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 sm:mt-0 shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all hover:-translate-y-0.5"
              style={{
                background: "#e0e5ec",
                boxShadow: "3px 3px 6px rgba(163,177,198,0.5), -3px -3px 6px rgba(255,255,255,0.7)",
                color: "#133255",
              }}
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>

            {candidate.hasCv && (
              <a
                href={`/api/candidates/${candidate.id}/cv`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #133255, #1d4d82)",
                  boxShadow: "4px 4px 8px rgba(163,177,198,0.5), -2px -2px 6px rgba(255,255,255,0.6)",
                }}
              >
                <Download className="w-4 h-4" /> Download CV
              </a>
            )}
          </div>
        </div>
      </NeoCard>

      {/* Grid Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Career & Compensation */}
        <NeoCard className="p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-slate-800 text-[16px] font-bold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#133255]" />
              Career Overview
            </h2>
            <button
              onClick={() => {
                setActiveTab("career");
                setIsEditing(true);
              }}
              className="text-[12px] text-slate-500 hover:text-[#133255] font-medium transition-colors flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          </div>

          <div className="flex flex-col gap-3 text-[14px]">
            <div className="flex justify-between py-2 border-b border-slate-300/40">
              <span className="text-slate-500 font-medium">Current CTC</span>
              <span className="text-slate-800 font-bold">
                {candidate.fixedCtc || candidate.ctc
                  ? `${candidate.fixedCtc || candidate.ctc} LPA`
                  : "Confidential / Not specified"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-300/40">
              <span className="text-slate-500 font-medium">Expected CTC</span>
              <span className="text-slate-800 font-bold">
                {candidate.expected ? `${candidate.expected} LPA` : "Not specified"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-300/40">
              <span className="text-slate-500 font-medium">Notice Period</span>
              <span className="text-slate-800 font-bold">
                {candidate.notice ? `${candidate.notice} Days` : "Immediate / Negotiable"}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500 font-medium">Preferred Location</span>
              <span className="text-slate-800 font-bold">
                {candidate.prefLocation || candidate.location || "Open"}
              </span>
            </div>
          </div>
        </NeoCard>

        {/* Education & Qualifications */}
        <NeoCard className="p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-slate-800 text-[16px] font-bold flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#133255]" />
              Education & Certifications
            </h2>
            <button
              onClick={() => {
                setActiveTab("general");
                setIsEditing(true);
              }}
              className="text-[12px] text-slate-500 hover:text-[#133255] font-medium transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {Array.isArray(candidate.qual) && candidate.qual.length > 0 ? (
            <div className="flex flex-col gap-3">
              {candidate.qual.map((q: any, i: number) => (
                <div
                  key={i}
                  className="p-3 rounded-xl transition-all"
                  style={{
                    background: "#e0e5ec",
                    boxShadow: "inset 2px 2px 5px rgba(163,177,198,0.5), inset -2px -2px 5px rgba(255,255,255,0.7)",
                  }}
                >
                  <span className="text-slate-800 font-bold text-[14px] block">
                    {typeof q === "string" ? q : q.degree || q.title}
                  </span>
                  {q.college && (
                    <span className="text-slate-500 text-[12px] font-medium block">{q.college}</span>
                  )}
                  {q.year && (
                    <span className="text-[#133255] font-bold text-[11px] mt-1 block">{q.year}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <GraduationCap className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-slate-500 text-[13px] font-medium">No education details listed.</p>
              <button
                onClick={() => {
                  setActiveTab("general");
                  setIsEditing(true);
                }}
                className="mt-2 text-[12px] text-[#133255] font-bold hover:underline"
              >
                + Add Education
              </button>
            </div>
          )}
        </NeoCard>
      </div>

      {/* Expertise & Past Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expertise Tags */}
        <NeoCard className="p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-slate-800 text-[16px] font-bold flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#133255]" />
              Core Competencies & Sector Tags
            </h2>
            <button
              onClick={() => {
                setActiveTab("tags");
                setIsEditing(true);
              }}
              className="text-[12px] text-slate-500 hover:text-[#133255] font-medium transition-colors flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Tags
            </button>
          </div>

          {Array.isArray(candidate.expTags) && candidate.expTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {candidate.expTags.map((tag: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl text-[12px] font-bold text-slate-700 shadow-sm"
                  style={{
                    background: "#e0e5ec",
                    boxShadow: "inset 2px 2px 4px rgba(163,177,198,0.5), inset -2px -2px 4px rgba(255,255,255,0.7)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Tag className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-slate-500 text-[13px] font-medium">No tags listed yet.</p>
              <button
                onClick={() => {
                  setActiveTab("tags");
                  setIsEditing(true);
                }}
                className="mt-2 text-[12px] text-[#133255] hover:underline font-bold"
              >
                + Add your key skills & industry tags
              </button>
            </div>
          )}
        </NeoCard>

        {/* Past Companies */}
        <NeoCard className="p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-slate-800 text-[16px] font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#133255]" />
              Career History / Past Companies
            </h2>
            <button
              onClick={() => {
                setActiveTab("history");
                setIsEditing(true);
              }}
              className="text-[12px] text-slate-500 hover:text-[#133255] font-medium transition-colors flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit History
            </button>
          </div>

          {Array.isArray(candidate.pastCompanies) &&
          candidate.pastCompanies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {candidate.pastCompanies.map((co: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl text-[13px] font-bold text-white shadow-sm"
                  style={{
                    background: "linear-gradient(135deg, #133255, #1d4d82)",
                    boxShadow: "2px 2px 5px rgba(163,177,198,0.5)",
                  }}
                >
                  {co}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Building2 className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-slate-500 text-[13px] font-medium">No past companies listed yet.</p>
              <button
                onClick={() => {
                  setActiveTab("history");
                  setIsEditing(true);
                }}
                className="mt-2 text-[12px] text-[#133255] hover:underline font-bold"
              >
                + Add previous organizations you worked at
              </button>
            </div>
          )}
        </NeoCard>

        {/* Detailed Career Timeline */}
        <CareerTimeline candId={candidate.id} timeline={candidate.priorExperiences || []} />
      </div>

      {/* ─── EDIT PROFILE MODAL ─────────────────────────────────────── */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{
              background: "#e0e5ec",
              boxShadow: "0 25px 50px -12px rgba(163,177,198,0.6)",
              border: "1px solid rgba(255,255,255,0.6)",
            }}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-300/50 flex justify-between items-center" style={{ background: "#e0e5ec" }}>
              <h3 className="text-slate-800 font-bold text-[17px] flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#133255]" />
                Edit Profile Information
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Nav Tabs */}
            <div className="flex border-b border-slate-300/50 text-[13px]" style={{ background: "#d1d9e6" }}>
              <button
                onClick={() => setActiveTab("general")}
                className={`flex-1 py-3 font-bold transition-colors border-b-2 ${
                  activeTab === "general"
                    ? "text-[#133255] border-[#133255] bg-[#e0e5ec]"
                    : "text-slate-500 border-transparent hover:text-slate-700"
                }`}
              >
                General & Education
              </button>
              <button
                onClick={() => setActiveTab("career")}
                className={`flex-1 py-3 font-bold transition-colors border-b-2 ${
                  activeTab === "career"
                    ? "text-[#133255] border-[#133255] bg-[#e0e5ec]"
                    : "text-slate-500 border-transparent hover:text-slate-700"
                }`}
              >
                Compensation
              </button>
              <button
                onClick={() => setActiveTab("tags")}
                className={`flex-1 py-3 font-bold transition-colors border-b-2 ${
                  activeTab === "tags"
                    ? "text-[#133255] border-[#133255] bg-[#e0e5ec]"
                    : "text-slate-500 border-transparent hover:text-slate-700"
                }`}
              >
                Skills & Tags ({form.expTags.length})
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 py-3 font-bold transition-colors border-b-2 ${
                  activeTab === "history"
                    ? "text-[#133255] border-[#133255] bg-[#e0e5ec]"
                    : "text-slate-500 border-transparent hover:text-slate-700"
                }`}
              >
                Past Companies ({form.pastCompanies.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 text-sm bg-[#e0e5ec]">
              {/* Tab 1: General & Education */}
              {activeTab === "general" && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-500 mb-1">
                        Current Designation
                      </label>
                      <input
                        type="text"
                        value={form.designation}
                        onChange={(e) => setForm({ ...form, designation: e.target.value })}
                        placeholder="e.g. Chief Financial Officer"
                        className="w-full px-3 py-2 rounded-xl text-slate-800 outline-none font-medium placeholder:text-slate-400"
                        style={{ background: "#e0e5ec", boxShadow: "inset 3px 3px 6px rgba(163,177,198,0.5), inset -3px -3px 6px rgba(255,255,255,0.7)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-500 mb-1">
                        Current Company
                      </label>
                      <input
                        type="text"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        placeholder="e.g. Hindustan Unilever"
                        className="w-full px-3 py-2 rounded-xl text-slate-800 outline-none font-medium placeholder:text-slate-400"
                        style={{ background: "#e0e5ec", boxShadow: "inset 3px 3px 6px rgba(163,177,198,0.5), inset -3px -3px 6px rgba(255,255,255,0.7)" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-500 mb-1">
                        Location / City
                      </label>
                      <input
                        type="text"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        placeholder="e.g. Mumbai, India"
                        className="w-full px-3 py-2 rounded-xl text-slate-800 outline-none font-medium placeholder:text-slate-400"
                        style={{ background: "#e0e5ec", boxShadow: "inset 3px 3px 6px rgba(163,177,198,0.5), inset -3px -3px 6px rgba(255,255,255,0.7)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-500 mb-1">
                        LinkedIn Profile URL
                      </label>
                      <input
                        type="url"
                        value={form.linkedin}
                        onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full px-3 py-2 rounded-xl text-slate-800 outline-none font-medium placeholder:text-slate-400"
                        style={{ background: "#e0e5ec", boxShadow: "inset 3px 3px 6px rgba(163,177,198,0.5), inset -3px -3px 6px rgba(255,255,255,0.7)" }}
                      />
                    </div>
                  </div>

                  {/* Add Education Section */}
                  <div className="mt-2 pt-4 border-t border-slate-300/40">
                    <label className="block text-[12px] font-bold text-[#133255] uppercase tracking-wider mb-2">
                      Education / Qualifications
                    </label>
                    
                    {/* List current qualifications */}
                    {form.qual.length > 0 && (
                      <div className="flex flex-col gap-2 mb-3">
                        {form.qual.map((q: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-xl text-[13px]"
                            style={{ background: "#e0e5ec", boxShadow: "3px 3px 6px rgba(163,177,198,0.4), -3px -3px 6px rgba(255,255,255,0.6)" }}
                          >
                            <div>
                              <span className="text-slate-800 font-bold">
                                {typeof q === "string" ? q : q.degree}
                              </span>
                              {q.college && <span className="text-slate-500 font-medium ml-2">({q.college})</span>}
                              {q.year && <span className="text-[#133255] font-bold ml-2">{q.year}</span>}
                            </div>
                            <button
                              onClick={() => removeQual(idx)}
                              className="text-rose-400 hover:text-rose-600 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Degree / Qualification"
                        value={qualInput.degree}
                        onChange={(e) => setQualInput({ ...qualInput, degree: e.target.value })}
                        className="px-3 py-2 rounded-xl text-slate-800 text-xs font-medium outline-none placeholder:text-slate-400"
                        style={{ background: "#e0e5ec", boxShadow: "inset 3px 3px 6px rgba(163,177,198,0.5), inset -3px -3px 6px rgba(255,255,255,0.7)" }}
                      />
                      <input
                        type="text"
                        placeholder="Institute / College"
                        value={qualInput.college}
                        onChange={(e) => setQualInput({ ...qualInput, college: e.target.value })}
                        className="px-3 py-2 rounded-xl text-slate-800 text-xs font-medium outline-none placeholder:text-slate-400"
                        style={{ background: "#e0e5ec", boxShadow: "inset 3px 3px 6px rgba(163,177,198,0.5), inset -3px -3px 6px rgba(255,255,255,0.7)" }}
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Year (e.g. 2015)"
                          value={qualInput.year}
                          onChange={(e) => setQualInput({ ...qualInput, year: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl text-slate-800 text-xs font-medium outline-none placeholder:text-slate-400"
                          style={{ background: "#e0e5ec", boxShadow: "inset 3px 3px 6px rgba(163,177,198,0.5), inset -3px -3px 6px rgba(255,255,255,0.7)" }}
                        />
                        <button
                          onClick={addQual}
                          className="px-3 py-2 text-white rounded-xl text-xs font-bold shrink-0 transition-transform hover:-translate-y-0.5"
                          style={{ background: "linear-gradient(135deg, #133255, #1d4d82)", boxShadow: "2px 2px 5px rgba(163,177,198,0.5)" }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Compensation */}
              {activeTab === "career" && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-500 mb-1">
                        Current Fixed CTC (in LPA)
                      </label>
                      <input
                        type="number"
                        value={form.fixedCtc}
                        onChange={(e) => setForm({ ...form, fixedCtc: e.target.value })}
                        placeholder="e.g. 75"
                        className="w-full px-3 py-2 rounded-xl text-slate-800 outline-none font-medium placeholder:text-slate-400"
                        style={{ background: "#e0e5ec", boxShadow: "inset 3px 3px 6px rgba(163,177,198,0.5), inset -3px -3px 6px rgba(255,255,255,0.7)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-500 mb-1">
                        Expected CTC (in LPA)
                      </label>
                      <input
                        type="number"
                        value={form.expectedCtc}
                        onChange={(e) => setForm({ ...form, expectedCtc: e.target.value })}
                        placeholder="e.g. 95"
                        className="w-full px-3 py-2 rounded-xl text-slate-800 outline-none font-medium placeholder:text-slate-400"
                        style={{ background: "#e0e5ec", boxShadow: "inset 3px 3px 6px rgba(163,177,198,0.5), inset -3px -3px 6px rgba(255,255,255,0.7)" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-500 mb-1">
                        Notice Period (in Days)
                      </label>
                      <input
                        type="number"
                        value={form.notice}
                        onChange={(e) => setForm({ ...form, notice: e.target.value })}
                        placeholder="e.g. 60 or 90"
                        className="w-full px-3 py-2 rounded-xl text-slate-800 outline-none font-medium placeholder:text-slate-400"
                        style={{ background: "#e0e5ec", boxShadow: "inset 3px 3px 6px rgba(163,177,198,0.5), inset -3px -3px 6px rgba(255,255,255,0.7)" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Core Competencies & Sector Tags */}
              {activeTab === "tags" && (
                <div className="flex flex-col gap-4">
                  <p className="text-[13px] text-slate-500 font-medium">
                    Add tags for your primary industry sectors, functions, and key executive competencies (e.g., FMCG, BFSI, M&A, Board Governance).
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a tag (e.g. FMCG, CFO, M&A) and press Add..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-xl text-slate-800 font-medium outline-none placeholder:text-slate-400"
                      style={{ background: "#e0e5ec", boxShadow: "inset 3px 3px 6px rgba(163,177,198,0.5), inset -3px -3px 6px rgba(255,255,255,0.7)" }}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 text-white font-bold rounded-xl text-xs transition-transform hover:-translate-y-0.5"
                      style={{ background: "linear-gradient(135deg, #133255, #1d4d82)", boxShadow: "2px 2px 5px rgba(163,177,198,0.5)" }}
                    >
                      Add Tag
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2 min-h-[100px] p-4 rounded-xl items-start" style={{ background: "#e0e5ec", boxShadow: "inset 3px 3px 6px rgba(163,177,198,0.3), inset -3px -3px 6px rgba(255,255,255,0.6)" }}>
                    {form.expTags.length === 0 ? (
                      <span className="text-slate-400 text-xs font-medium">No tags added yet. Type a tag above and click Add.</span>
                    ) : (
                      form.expTags.map((tag: string) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#133255]"
                          style={{ background: "#e0e5ec", boxShadow: "2px 2px 4px rgba(163,177,198,0.4), -2px -2px 4px rgba(255,255,255,0.8)" }}
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="text-slate-400 hover:text-rose-500 transition-colors ml-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Past Companies */}
              {activeTab === "history" && (
                <div className="flex flex-col gap-4">
                  <p className="text-[13px] text-slate-500 font-medium">
                    Add organizations you have previously worked at. This helps our suggestion engine connect you to relevant leadership mandates.
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type company name (e.g. Marico, Procter & Gamble) and press Add..."
                      value={companyInput}
                      onChange={(e) => setCompanyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCompany();
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-xl text-slate-800 font-medium outline-none placeholder:text-slate-400"
                      style={{ background: "#e0e5ec", boxShadow: "inset 3px 3px 6px rgba(163,177,198,0.5), inset -3px -3px 6px rgba(255,255,255,0.7)" }}
                    />
                    <button
                      type="button"
                      onClick={addCompany}
                      className="px-4 py-2 text-white font-bold rounded-xl text-xs transition-transform hover:-translate-y-0.5"
                      style={{ background: "linear-gradient(135deg, #133255, #1d4d82)", boxShadow: "2px 2px 5px rgba(163,177,198,0.5)" }}
                    >
                      Add Company
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2 min-h-[100px] p-4 rounded-xl items-start" style={{ background: "#e0e5ec", boxShadow: "inset 3px 3px 6px rgba(163,177,198,0.3), inset -3px -3px 6px rgba(255,255,255,0.6)" }}>
                    {form.pastCompanies.length === 0 ? (
                      <span className="text-slate-400 text-xs font-medium">No past companies added yet. Type a company above and click Add.</span>
                    ) : (
                      form.pastCompanies.map((co: string) => (
                        <span
                          key={co}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm"
                          style={{ background: "linear-gradient(135deg, #133255, #1d4d82)" }}
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          {co}
                          <button
                            onClick={() => removeCompany(co)}
                            className="text-white/60 hover:text-white transition-colors ml-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-300/50 flex justify-end gap-3" style={{ background: "#e0e5ec" }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #133255, #1d4d82)",
                  boxShadow: "3px 3px 8px rgba(163,177,198,0.6)",
                }}
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
