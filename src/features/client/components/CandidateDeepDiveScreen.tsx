"use client";

import { useState } from "react";
import {
  FileCheck2,
  Download,
  ArrowLeft,
  Award,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  ShieldCheck,
  Brain,
  FileText,
  UserCheck,
  History,
} from "lucide-react";
import { logDocumentDownloadAction } from "@/actions/client-command-centre";
import CandidateActivityTimeline from "./CandidateActivityTimeline";
import toast from "react-hot-toast";

interface CandidateDeepDiveScreenProps {
  candidate: any;
  mandate: any;
  clientName: string;
  userName: string;
  onBack: () => void;
}

export default function CandidateDeepDiveScreen({
  candidate,
  mandate,
  clientName,
  userName,
  onBack,
}: CandidateDeepDiveScreenProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "behavioral" | "psychometric" | "references" | "competency" | "activity">("summary");

  const cand = candidate || {
    name: "Candidate",
    role: "Executive Leader",
    company: "Enterprise Corp",
    location: "Gurugram / Mumbai",
    exp: 14,
    ctc: "85 LPA",
    expected: "1.1 Cr",
    notice: "60 Days",
  };

  const handleDownloadPDF = async () => {
    try {
      await logDocumentDownloadAction({
        mandateId: mandate.id,
        candidateId: cand.id?.toString(),
        documentType: "Executive 360 Assessment Report",
      });
      toast.success("Downloading watermarked PDF report...");

      // Generate text window or trigger download
      const content = `CONFIDENTIAL EXECUTIVE REPORT\nPrepared for: ${clientName}\nDownloaded by: ${userName} on ${new Date().toLocaleString()}\n\nCandidate: ${cand.name}\nRole: ${cand.role} - ${cand.company}\nMonaki Score: 8.7/10`;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cand.name}_Monaki_360_Report.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e: any) {
      toast.error(e.message || "Failed to download document");
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Back & Header Bar ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shortlist</span>
        </button>

        <button
          onClick={handleDownloadPDF}
          className="px-5 py-2.5 bg-[#133255] text-white hover:bg-[#1a4473] rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <Download className="w-4 h-4 text-[#D8B15B]" />
          <span>Download Watermarked PDF</span>
        </button>
      </div>

      {/* ─── Candidate Executive Card ──────────────────────── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#133255] to-[#0b1f36] text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-lg">
            {cand.initials || "MK"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-serif font-bold text-slate-900">{cand.name}</h2>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-full">
                Verified Candidate
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">{cand.role} — {cand.company}</p>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {cand.location || "India"}</span>
              <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {cand.exp || 14} Yrs Exp</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Notice: {cand.notice || "60 Days"}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center min-w-[160px] self-stretch md:self-auto flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Overall Competency</span>
          <span className="text-3xl font-serif font-bold text-[#133255] block mt-1">8.7 <span className="text-xs text-slate-400 font-sans font-normal">/ 10</span></span>
          <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">Top P1 Choice</span>
        </div>
      </div>

      {/* ─── 360° Assessment Tabs ───────────────────────────── */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl px-4 shadow-sm overflow-x-auto">
        {[
          { id: "summary", label: "Executive Summary", icon: FileText },
          { id: "behavioral", label: "1. Behavioral Interview", icon: Brain },
          { id: "psychometric", label: "2. Psychometric Assessment", icon: ShieldCheck },
          { id: "references", label: "3. Reference Checks", icon: UserCheck },
          { id: "competency", label: "4. Competency Breakdown", icon: Award },
          { id: "activity", label: "Activity History", icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3.5 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? "border-[#133255] text-[#133255] bg-slate-50/80"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#133255]" : "opacity-75"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Tab Content Panels ─────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        {activeTab === "summary" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-serif font-bold text-slate-900">One-Page Executive Summary</h3>
              <p className="text-xs text-slate-500">Validated synthesis approved by Mauna Kea lead consultants.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200/60 space-y-2">
                <div className="font-bold text-emerald-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Key Strengths</span>
                </div>
                <ul className="text-xs text-emerald-900/90 space-y-1.5 list-disc pl-4">
                  <li>Proven track record scaling P&L operations from \$20M to \$100M+.</li>
                  <li>Exceptional strategic vision paired with strong digital execution pedigree.</li>
                  <li>High cultural adaptability and team retention rate (&gt;92%).</li>
                </ul>
              </div>

              <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200/60 space-y-2">
                <div className="font-bold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Key Considerations & Concerns</span>
                </div>
                <ul className="text-xs text-amber-900/90 space-y-1.5 list-disc pl-4">
                  <li>Requires 60-day notice period buyout negotiation.</li>
                  <li>Expecting performance-linked ESOP component in final offer structure.</li>
                </ul>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Mauna Kea Recommendation</h4>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Strongly recommended for immediate Panel Interview. Candidate displays rare combination of commercial acumen, operational discipline, and transformation pedigree required for the target growth mandate.
              </p>
            </div>
          </div>
        )}

        {activeTab === "behavioral" && (
          <div className="space-y-4">
            <h3 className="text-base font-serif font-bold text-slate-900">Behavioral Interview Assessment</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Demonstrates high emotional intelligence, structured problem solving under crisis, and transparent communication across executive boards.
            </p>
          </div>
        )}

        {activeTab === "psychometric" && (
          <div className="space-y-4">
            <h3 className="text-base font-serif font-bold text-slate-900">Psychometric Assessment Output</h3>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-[#133255] mx-auto" />
              <div className="font-bold text-slate-800 text-sm">Psychometric Assessment Verified</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                High resilience score, strong analytical reasoning, and high strategic orientation.
              </p>
            </div>
          </div>
        )}

        {activeTab === "references" && (
          <div className="space-y-4">
            <h3 className="text-base font-serif font-bold text-slate-900">Reference Check Highlights</h3>
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800">Former Board Director / Supervisor</div>
                <p className="text-slate-600 italic">"One of the sharpest commercial leaders I have worked with. Delivers results consistently."</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "competency" && (
          <div className="space-y-4">
            <h3 className="text-base font-serif font-bold text-slate-900">Competency Framework Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between font-bold">
                <span>Strategic Leadership</span>
                <span className="text-[#133255]">8.8 / 10</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between font-bold">
                <span>Commercial Acumen</span>
                <span className="text-[#133255]">8.2 / 10</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between font-bold">
                <span>Transformation</span>
                <span className="text-[#133255]">9.1 / 10</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between font-bold">
                <span>Team Leadership</span>
                <span className="text-[#133255]">8.7 / 10</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-3">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-serif font-bold text-slate-900">Activity History</h3>
              <p className="text-xs text-slate-500">All decisions, interview scheduling, and status changes for this candidate on this mandate.</p>
            </div>
            {candidate?.mandateCandidateId ? (
              <CandidateActivityTimeline mandateCandidateId={candidate.mandateCandidateId} />
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">Activity history is not available for this view.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
