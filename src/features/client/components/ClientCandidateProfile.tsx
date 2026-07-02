"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  MoreVertical,
  MapPin,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  Award,
  Users,
  Percent,
  Sliders,
  CheckCircle,
  HelpCircle,
  FileText,
  DollarSign,
  AlertTriangle,
  Star,
  X,
  Download,
} from "lucide-react";
import { updateMandateCandidateStageAction } from "@/app/actions";
import { ClientSidebar } from "./ClientSidebar";

// ─── Score Ring Component ────────────────────────────────
function CircularScore({ score, label }: { score: number; label: string }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center shrink-0">
      <div className="relative w-20 h-20">
        <svg width="80" height="80" className="-rotate-90">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="#e5e7eb" strokeWidth={5} />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="#10b981"
            strokeWidth={5}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[19px] font-bold text-[#0b1f3a]">
          {score}%
        </span>
      </div>
      <span className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ─── Rupee Formatting Helper ─────────────────────────────
function formatLakhsToRupees(lakhs: number | null): string {
  if (lakhs == null || lakhs === 0) return "—";
  const val = lakhs * 100000;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
}

// ─── Mandate CTC Budget Parser ───────────────────────────
function parseMandateCtc(ctcStr: string | null) {
  let min = 80;
  let max = 120;
  if (ctcStr) {
    const clean = ctcStr.replace(/[₹\s]/g, "");
    const parts = clean.split(/[–-]/);
    if (parts.length === 2) {
      const minVal = parseFloat(parts[0]);
      const maxVal = parseFloat(parts[1]);
      if (!isNaN(minVal) && !isNaN(maxVal)) {
        const minLakhs = parts[0].toLowerCase().includes("cr") ? minVal * 100 : minVal;
        const maxLakhs = parts[1].toLowerCase().includes("cr") ? maxVal * 100 : maxVal;
        min = minLakhs;
        max = maxLakhs;
      }
    }
  }
  return { min, max, median: (min + max) / 2 };
}

// ─── Types ───────────────────────────────────────────────
type Props = {
  candidate: any;
  mandateCandidate: any;
  mandateId: number;
  reportData: any;
  framework: any;
  mandate?: any;
  clientName?: string;
};

export default function ClientCandidateProfile({ candidate, mandateCandidate, mandateId, reportData = {}, framework, mandate, clientName }: Props) {
  const router = useRouter();
  const [currentStage, setCurrentStage] = useState(mandateCandidate?.stage || "universe");
  const [isUpdating, setIsUpdating] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    "Leadership Summary": true,
    "References": true,
  });

  const name = candidate?.name || "Candidate Name";
  const title = candidate?.designation || reportData?.Designation || "Leadership Executive";
  const company = candidate?.company || reportData?.["Current Company"] || "Company";
  const location = candidate?.location || reportData?.Geography || "N/A";
  const yearsExp = candidate?.exp ? `${candidate.exp}+ Years Experience` : null;
  const profilePic = candidate?.profilePic || null;

  // Stats / Match Scores
  const matchScore = mandateCandidate?.score ? Math.round(mandateCandidate.score * 10) : (reportData?.matchScore || null);
  const readinessScore = reportData?.readinessScore || null;
  const hireabilityScore = reportData?.hireabilityScore || null;

  // Snapshot View Fields
  const snapshotRaw = [
    (candidate?.expTags?.[0] || reportData?.Industry) ? { label: "Industry", value: candidate.expTags?.[0] || reportData.Industry, icon: Building2 } : null,
    title ? { label: "Current Role", value: title, icon: Briefcase } : null,
    (reportData?.["Functional Expertise"] || candidate?.expTags?.join(", ")) ? {
      label: "Functional Expertise",
      value: reportData?.["Functional Expertise"] || candidate?.expTags?.join(", "),
      icon: Sliders,
    } : null,
    candidate?.ctc ? {
      label: "Compensation Band",
      value: `${formatLakhsToRupees(candidate.ctc)} / Annum`,
      icon: DollarSign,
    } : null,
    location !== "N/A" ? { label: "Geography", value: location, icon: MapPin } : null,
    readinessScore ? { label: "AI Readiness Score", value: `${readinessScore} /100`, icon: Award, bar: readinessScore } : null,
    hireabilityScore ? { label: "Hireability Score", value: `${hireabilityScore} /100`, icon: CheckCircle, bar: hireabilityScore } : null,
    candidate?.notice ? { label: "Notice Period", value: `${candidate.notice} Days`, icon: Calendar } : null,
    candidate?.relocate ? { label: "Open to Relocation", value: candidate.relocate, icon: Clock } : null,
  ];

  const snapshot = snapshotRaw.filter(Boolean) as any[];

  // Accordion Definitions
  const accordionsRaw = [
    (reportData?.["Notes Summary"] || reportData?.["Recommendation"] || candidate?.notes) ? {
      title: "Leadership Summary",
      content: reportData?.["Notes Summary"] || (reportData?.["Recommendation"] ? [reportData?.["Recommendation"]] : null) || (candidate?.notes ? [candidate?.notes] : null)
    } : null,
    reportData?.["Career Timeline"] ? {
      title: "Career Timeline",
      content: reportData?.["Career Timeline"]
    } : null,
    reportData?.["Team Size Led"] ? {
      title: "Team Sizes Managed",
      content: [reportData?.["Team Size Led"]]
    } : null,
    reportData?.["Revenue Ownership"] ? {
      title: "Revenue / P&L Ownership",
      content: [reportData?.["Revenue Ownership"]]
    } : null,
    reportData?.["Transformation Projects"] ? {
      title: "Transformation Projects",
      content: reportData?.["Transformation Projects"]
    } : null,
    reportData?.["Governance Exposure"] ? {
      title: "Governance Exposure",
      content: reportData?.["Governance Exposure"]
    } : null,
    reportData?.["Leadership Style"] ? {
      title: "Leadership Style",
      content: reportData?.["Leadership Style"]
    } : null,
    candidate?.references && candidate.references.length > 0 ? {
      title: "References",
      content: candidate.references,
      isReferences: true
    } : null,
    reportData?.["Interviewer Feedback"] ? {
      title: "Analysis Basis Interview Recordings",
      content: [reportData?.["Interviewer Feedback"]]
    } : null,
    reportData?.["Career Aspiration"] ? {
      title: "AI-generated Competency Summaries",
      content: [reportData?.["Career Aspiration"]]
    } : null,
  ];

  const accordions = accordionsRaw.filter(Boolean) as any[];

  const toggleAccordion = (title: string) => {
    setOpenAccordions((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleStageChange = async (newStage: string) => {
    if (!mandateCandidate?.id) return;
    setIsUpdating(true);
    try {
      await updateMandateCandidateStageAction(mandateCandidate.id, newStage, mandateId);
      setCurrentStage(newStage);
    } catch (e) {
      console.error("Failed to update candidate stage", e);
    } finally {
      setIsUpdating(false);
    }
  };

  // Check if we have scoring framework data
  const hasScores = framework && framework.categories && framework.categories.length > 0 && reportData?.scores;

  // Check if we have compensation data
  const hasComp = candidate?.fixedCtc || candidate?.variableCtc || candidate?.ctc;

  // Compensation Benchmarking Range Calculations
  const budget = parseMandateCtc(mandate?.ctc);
  
  // Base Salary Ranges
  const minBase = budget.min * 0.7;
  const maxBase = budget.max * 0.7;
  const medianBase = budget.median * 0.7;

  // Total Cash Ranges
  const minCash = budget.min * 0.85;
  const maxCash = budget.max * 0.85;
  const medianCash = budget.median * 0.85;

  // Total CTC Ranges
  const minCtc = budget.min;
  const maxCtc = budget.max;
  const medianCtc = budget.median;

  const getMarkerPct = (val: number, minRange: number, maxRange: number) => {
    const padding = (maxRange - minRange) * 0.15;
    const start = minRange - padding;
    const end = maxRange + padding;
    const pct = ((val - start) / (end - start)) * 100;
    return Math.min(Math.max(Math.round(pct), 5), 95);
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f4f6fb] flex">
      <div className="print:hidden h-full shrink-0 z-50">
        <ClientSidebar activeTab="dashboard" clientName={clientName || "Client"} />
      </div>
      <div className="flex-1 flex flex-col h-full overflow-y-auto relative bg-[#f4f6fb]">
      {/* ─── Non-Report Content (Hidden on Print) ─── */}
      <div className="print:hidden">
        {/* ─── Top Header ─── */}
      <header className="bg-[#0b1f3a] text-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <button onClick={() => router.back()} className="bg-white/15 rounded-lg w-9 h-9 flex items-center justify-center hover:bg-white/25 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-serif text-[15px] font-bold tracking-wide">Candidate Profile</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-white/70 hover:text-white transition-colors" title="Share">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="text-white/70 hover:text-white transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Candidate Overview Card ─── */}
      <div className="max-w-4xl mx-auto w-full px-5 mt-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-5">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-indigo-50 border border-gray-100 flex items-center justify-center text-3xl font-bold text-[#0b1f3a] overflow-hidden shrink-0 shadow-inner">
            {profilePic ? (
              <img src={profilePic} alt={name} className="w-full h-full object-cover" />
            ) : (
              name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
            )}
          </div>

          {/* Core Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[22px] font-bold text-[#0b1f3a] truncate">{name}</h1>
              <span className="bg-blue-500 text-white rounded-full p-0.5" title="Verified Match">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            </div>
            {title && <p className="text-[14px] text-gray-500 font-medium mt-0.5">{title}</p>}
            {company && (
              <div className="flex items-center gap-2 mt-1.5">
                <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <span className="text-[13px] font-bold text-[#0b1f3a]">{company}</span>
              </div>
            )}
            <div className="flex items-center gap-4 mt-3 text-[12px] text-gray-400">
              {location !== "N/A" && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-300" /> {location}</span>}
              {yearsExp && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gray-300" /> {yearsExp}</span>}
            </div>
          </div>

          {/* AI Match Score */}
          {matchScore != null && <CircularScore score={matchScore} label="AI Match Score" />}
        </div>

        {/* ─── Executive Profile Snapshot ─── */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mt-6 mb-6">
          <h2 className="text-[15px] font-bold text-[#0b1f3a] mb-4 border-b border-gray-100 pb-2">Executive Profile Snapshot</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-[13px]">
            <div>
              <span className="text-gray-400 block font-medium">Current Company</span>
              <span className="font-bold text-[#0b1f3a] mt-0.5 block">{candidate.company || "—"}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Current Designation</span>
              <span className="font-bold text-[#0b1f3a] mt-0.5 block">{candidate.designation || "—"}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Tenure (Current Role)</span>
              <span className="font-bold text-[#0b1f3a] mt-0.5 block">{candidate.tenure ? `${candidate.tenure} Years` : "—"}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Qualifications</span>
              <span className="font-bold text-[#0b1f3a] mt-0.5 block">
                {Array.isArray(candidate.qual) ? candidate.qual.join(", ") : (candidate.qual || "—")}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Total Experience</span>
              <span className="font-bold text-[#0b1f3a] mt-0.5 block">{candidate.exp ? `${candidate.exp} Years` : "—"}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Current CTC</span>
              <span className="font-bold text-[#0b1f3a] mt-0.5 block">{formatLakhsToRupees(candidate.ctc)}</span>
            </div>
            {/* Prior Companies and Roles (full width) */}
            <div className="col-span-2">
              <span className="text-gray-400 block font-medium">Prior Companies and Roles</span>
              <div className="font-semibold text-[#0b1f3a] mt-1 space-y-1">
                {reportData?._format2?.relevant_experience ? (
                  <div className="space-y-2 mt-1">
                    {reportData._format2.relevant_experience.map((exp: any, idx: number) => (
                      <div key={idx} className="text-gray-700 text-[13px] font-semibold flex flex-col">
                        <span className="text-[#0b1f3a]">{exp.position}</span>
                        <span className="text-gray-500 font-normal text-[12px]">{exp.companyName} ({exp.duration})</span>
                      </div>
                    ))}
                  </div>
                ) : reportData?.["Relevant Experience"] ? (
                  <ul className="list-disc list-inside space-y-1 font-normal text-gray-600">
                    {reportData["Relevant Experience"].map((exp: string, idx: number) => (
                      <li key={idx}>{exp}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-400 italic font-normal">Check CV / Resume details below</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Snapshot View ─── */}
        {snapshot.length > 0 && (
          <>
            <h2 className="text-[17px] font-bold text-[#0b1f3a] mt-6 mb-3">Snapshot View</h2>
            <div className="grid grid-cols-3 gap-3">
              {snapshot.map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50/50 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</span>
                  </div>
                  {item.bar ? (
                    <div className="mt-3">
                      <span className="text-[15px] font-bold text-[#0b1f3a] block leading-none">{item.value}</span>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${item.bar}%` }} />
                      </div>
                    </div>
                  ) : (
                    <span className="text-[13px] font-semibold text-[#0b1f3a] block mt-2.5 leading-snug truncate">
                      {item.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── Main Framework Grid ─── */}
        <div className="grid grid-cols-2 gap-5 mt-6 items-start">
          {/* Left Column (Accordion Panels) */}
          {accordions.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {accordions.map((acc, i) => {
                const isOpen = !!openAccordions[acc.title];
                return (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggleAccordion(acc.title)}
                      className="w-full flex items-center justify-between p-4 text-left font-bold text-[14px] text-[#0b1f3a] hover:bg-gray-50 transition-colors"
                    >
                      <span>{acc.title}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-[13px] text-gray-600 leading-relaxed space-y-2 border-t border-gray-50">
                        {acc.isReferences ? (
                          <div className="space-y-3 pt-2">
                            {acc.content.map((r: any, idx: number) => (
                              <div key={idx} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                <div className="font-semibold text-gray-800 text-[13px]">
                                  {r.name} - {r.rel} ({r.org})
                                </div>
                                <p className="text-[12.5px] text-gray-500 mt-1 italic">&quot;{r.text}&quot;</p>
                              </div>
                            ))}
                          </div>
                        ) : Array.isArray(acc.content) ? (
                          <ul className="list-disc list-inside space-y-1.5 pt-2">
                            {acc.content.map((item: any, idx: number) => {
                              const textVal = typeof item === 'object' ? JSON.stringify(item) : String(item);
                              return (
                                <li key={idx} className="pl-1 text-[13px] leading-relaxed">{textVal}</li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="pt-2">{String(acc.content)}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-5 border border-gray-100 text-center text-gray-400 text-[13px]">
              No structured notes available.
            </div>
          )}

          {/* Right Column (Scoring Framework) */}
          <div>
            {hasScores ? (
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-[15px] font-bold text-[#0b1f3a] mb-4">Candidate Scoring Framework</h3>
                <div className="space-y-5">
                  {framework.categories.map((cat: any) => (
                    <div key={cat.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                      <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">{cat.name}</h4>
                      <div className="space-y-3">
                        {cat.criteria?.map((cr: any) => {
                          const scoreVal = reportData?.scores?.[cat.name]?.[cr.name] || 0;
                          const pct = Math.round(scoreVal * 10);
                          return (
                            <div key={cr.id} className="flex items-center gap-3">
                              <span className="text-[12px] text-gray-500 w-32 shrink-0 truncate">{cr.name}</span>
                              <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[12px] font-bold text-[#0b1f3a] w-12 text-right">
                                {pct} <span className="text-[10px] text-gray-300 font-normal">/100</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-5 border border-gray-100 text-center text-gray-400 text-[13px]">
                No evaluations or scoring data available for this position.
              </div>
            )}
          </div>
        </div>

        {/* ─── Compensation Details ─── */}
        {hasComp && (
          <div className="grid grid-cols-2 gap-5 mt-6">
            {/* Candidate CTC Framework */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-[15px] font-bold text-[#0b1f3a] mb-4">Candidate CTC Framework</h3>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <span className="text-[13px] font-bold text-[#0b1f3a] block border-b border-gray-100 pb-2">Year 1</span>
                  <div className="space-y-2 mt-3 text-[12px]">
                    <div className="flex justify-between text-gray-500"><span>Fixed (Base)</span> <span className="font-semibold text-[#0b1f3a]">{formatLakhsToRupees(candidate.fixedCtc)}</span></div>
                    <div className="flex justify-between text-gray-500"><span>Variable (Target)</span> <span className="font-semibold text-[#0b1f3a]">{formatLakhsToRupees(candidate.variableCtc)}</span></div>
                    <div className="flex justify-between pt-2 border-t border-dashed border-gray-100 font-bold text-indigo-600"><span>Total Year 1 CTC</span> <span>{formatLakhsToRupees(candidate.ctc)}</span></div>
                  </div>
                </div>
                {candidate.expected && (
                  <div>
                    <span className="text-[13px] font-bold text-[#0b1f3a] block border-b border-gray-100 pb-2">Expected Compensation</span>
                    <div className="space-y-2 mt-3 text-[12px]">
                      <div className="flex justify-between text-gray-500"><span>Target Fixed/Total</span> <span className="font-semibold text-[#0b1f3a]">{formatLakhsToRupees(candidate.expected)}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Compensation Benchmarking */}
            {candidate.ctc && (
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-[15px] font-bold text-[#0b1f3a] mb-4">Compensation Benchmarking</h3>
                <div className="flex justify-center gap-4 text-[10px] text-gray-400 mb-6">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-gray-300" /> Min</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-[#0b1f3a]" /> Market Median</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-emerald-500" /> Max</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-600" /> Candidate</span>
                </div>

                <div className="space-y-5">
                  {candidate.fixedCtc && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-semibold text-gray-500">Base Salary (Fixed)</span>
                      <div className="relative pt-1">
                        <div className="h-1.5 bg-gradient-to-r from-gray-200 via-[#0b1f3a] to-emerald-500 rounded-full w-full" />
                        <div className="absolute top-0 w-3.5 h-3.5 bg-violet-600 border-2 border-white rounded-full -translate-y-1/4 shadow-sm" style={{ left: `${getMarkerPct(candidate.fixedCtc, minBase, maxBase)}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>{formatLakhsToRupees(minBase)} (Min)</span>
                        <span>{formatLakhsToRupees(medianBase)} (Median)</span>
                        <span>{formatLakhsToRupees(maxBase)} (Max)</span>
                      </div>
                    </div>
                  )}

                  {candidate.fixedCtc && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-semibold text-gray-500">Total Cash (Fixed + Variable)</span>
                      <div className="relative pt-1">
                        <div className="h-1.5 bg-gradient-to-r from-gray-200 via-[#0b1f3a] to-emerald-500 rounded-full w-full" />
                        <div className="absolute top-0 w-3.5 h-3.5 bg-violet-600 border-2 border-white rounded-full -translate-y-1/4 shadow-sm" style={{ left: `${getMarkerPct(candidate.fixedCtc + (candidate.variableCtc || 0), minCash, maxCash)}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>{formatLakhsToRupees(minCash)}</span>
                        <span>{formatLakhsToRupees(medianCash)}</span>
                        <span>{formatLakhsToRupees(maxCash)}</span>
                      </div>
                    </div>
                  )}

                  {candidate.ctc && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-semibold text-gray-500">Total CTC</span>
                      <div className="relative pt-1">
                        <div className="h-1.5 bg-gradient-to-r from-gray-200 via-[#0b1f3a] to-emerald-500 rounded-full w-full" />
                        <div className="absolute top-0 w-3.5 h-3.5 bg-violet-600 border-2 border-white rounded-full -translate-y-1/4 shadow-sm" style={{ left: `${getMarkerPct(candidate.ctc, minCtc, maxCtc)}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>{formatLakhsToRupees(minCtc)}</span>
                        <span>{formatLakhsToRupees(medianCtc)}</span>
                        <span>{formatLakhsToRupees(maxCtc)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Remarks Section */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mt-6">
          <h3 className="text-[15px] font-bold text-[#0b1f3a] mb-1">Remarks / Special Instructions</h3>
          <span className="text-[10px] text-gray-400 block mb-3">(Visible to Mauna Kea Team)</span>
          <textarea
            placeholder="Add your remarks, feedback or special instructions for the Mauna Kea team..."
            className="w-full border border-gray-200 rounded-xl p-4 text-[13px] text-gray-700 placeholder:text-gray-400 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>
      </div> {/* Closes print:hidden container */}

      {/* ─── Executive Presentation Report ─── */}
      {reportData?.final_accepted_html && (
        <div className="max-w-4xl mx-auto w-full px-5 mt-10">
          <div className="flex items-center justify-between mb-4 print:hidden">
            <h2 className="text-[18px] font-bold text-[#0b1f3a]">Executive Presentation</h2>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto print:border-none print:shadow-none print:m-0 print:p-0">
            <div className="min-w-[794px] print:min-w-0 flex flex-col items-center py-10 print:py-0">
              <div dangerouslySetInnerHTML={{ __html: reportData.final_accepted_html }} />
            </div>
          </div>
        </div>
      )}

      {/* ─── Sticky Bottom Action Bar ─── */}
      <div className="sticky bottom-0 w-full z-40 bg-[#f4f6fb]/90 backdrop-blur-sm border-t border-gray-200 py-4 px-5 print:hidden mt-10">
        <div className="max-w-4xl mx-auto flex gap-3">
          <button
            onClick={() => handleStageChange("interviewed")}
            disabled={isUpdating}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-bold border transition-all duration-200 ${
              currentStage === "interviewed"
                ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <Check className="w-5 h-5 stroke-[3]" />
            Select for Interaction
          </button>

          <button
            onClick={() => handleStageChange("screening")}
            disabled={isUpdating}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-bold border transition-all duration-200 ${
              currentStage === "screening"
                ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/25"
                : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
            }`}
          >
            <Clock className="w-5 h-5 stroke-[2.5]" />
            On Hold
          </button>

          <button
            onClick={() => handleStageChange("universe")}
            disabled={isUpdating}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-bold border transition-all duration-200 ${
              currentStage === "universe"
                ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/25"
                : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
            }`}
          >
            <X className="w-5 h-5 stroke-[3]" />
            Not Selected
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
