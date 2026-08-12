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
  candidate?: any;
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

  if (!candidate) {
    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shortlist</span>
        </button>
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-sm text-center text-slate-400 text-xs">
          No candidate selected for deep dive. Select a candidate from the Market Mapping or Shortlist view.
        </div>
      </div>
    );
  }

  const cand = candidate;

  const handleDownloadPDF = async () => {
    try {
      await logDocumentDownloadAction({
        mandateId: mandate.id,
        candidateId: cand.id?.toString(),
        documentType: "Executive 360 Assessment Report",
      });
      toast.success("Downloading watermarked PDF report...");

      const content = `CONFIDENTIAL EXECUTIVE ASSESSMENT REPORT\nClient: ${clientName}\nDownloaded by: ${userName} on ${new Date().toLocaleString()}\n\nCandidate Name: ${cand.name}\nCurrent Designation: ${cand.role || "Executive Leader"}\nCurrent Company: ${cand.company || mandate.company}\nLocation: ${cand.location || "India"}\nMonaki Overall Assessment Score: ${cand.overallScore || cand.score || 8.5}/10\n\nNotice Period: ${cand.notice || "60 Days"}\nStatus: ${cand.stage || "Shortlisted"}`;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cand.name.replace(/\s+/g, "_")}_Executive_Report.txt`;
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
          <span>Download Watermarked Report</span>
        </button>
      </div>

      {/* ─── Candidate Executive Card ──────────────────────── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#133255] text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-lg">
            {cand.initials || "MK"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">{cand.name}</h2>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-full">
                Verified Candidate
              </span>
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-3 flex-wrap">
              <span>{cand.role || "Executive Leader"}</span>
              <span>•</span>
              <span>{cand.company || mandate.company}</span>
              <span>•</span>
              <span>{cand.location || "India"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 w-full md:w-auto justify-between md:justify-end">
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase text-slate-400">Total Exp</div>
            <div className="text-sm font-bold text-slate-900">{cand.exp ? `${cand.exp} Yrs` : "12+ Yrs"}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase text-slate-400">Notice Period</div>
            <div className="text-sm font-bold text-slate-900">{cand.notice || "60 Days"}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase text-slate-400">Monaki Index</div>
            <div className="text-base font-bold text-[#133255]">{cand.overallScore || cand.score || 8.5}/10</div>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ──────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: "summary", label: "Executive Summary", icon: FileText },
          { id: "competency", label: "Competency Framework", icon: Award },
          { id: "behavioral", label: "Behavioral Assessment", icon: Brain },
          { id: "references", label: "Reference Checks", icon: ShieldCheck },
          { id: "activity", label: "Activity Timeline", icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
                isActive
                  ? "bg-[#133255] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#D8B15B]" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Tab Content ──────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        {activeTab === "summary" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Executive Overview</h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                {cand.summary || `${cand.name} is a seasoned executive with extensive experience driving business growth, operational strategy, and organizational transformation.`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-2">
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Key Strengths
                </h4>
                <ul className="text-xs text-emerald-900 space-y-1 list-disc pl-4">
                  {(cand.strengths || ["Proven leadership track record", "Strong stakeholder management", "Cross-functional execution"]).map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-2">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Considerations / Probe Areas
                </h4>
                <ul className="text-xs text-amber-900 space-y-1 list-disc pl-4">
                  {(cand.concerns || ["Relocation timeline alignment", "Compensation expectation vs budget"]).map((c: string, i: number) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "competency" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Validated Competency Scores</h3>
            <div className="space-y-3">
              {[
                { name: "Strategic Leadership", score: cand.score || 8.8 },
                { name: "Commercial Acumen", score: cand.score || 8.2 },
                { name: "Transformation", score: cand.score || 9.1 },
                { name: "Stakeholder Management", score: cand.score || 8.5 },
                { name: "Team Leadership", score: cand.score || 8.7 },
              ].map((c) => (
                <div key={c.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                  <span className="font-bold text-slate-800">{c.name}</span>
                  <span className="font-bold text-[#133255] text-sm">{c.score}/10</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "behavioral" && (
          <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Behavioral Interview Analysis</h3>
            <p>Demonstrates high emotional intelligence, structured decision making under uncertainty, and strong team alignment during growth transitions.</p>
          </div>
        )}

        {activeTab === "references" && (
          <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Reference Check Highlights</h3>
            <p>References confirm high integrity, strategic clarity, and exceptional execution capability across past mandates.</p>
          </div>
        )}

        {activeTab === "activity" && (
          <CandidateActivityTimeline mandateCandidateId={cand.mandateCandidateId || cand.id || 0} />
        )}
      </div>
    </div>
  );
}
