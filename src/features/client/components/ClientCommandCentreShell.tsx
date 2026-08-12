"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Compass,
  Users,
  GitCompare,
  FileCheck2,
  CalendarCheck,
  Send,
  Sparkles,
  ChevronRight,
  Building2,
  Briefcase,
  Layers,
  Search,
  Filter,
  ArrowLeft,
} from "lucide-react";
import MarketMappingScreen from "./MarketMappingScreen";
import EngagementTrackerScreen from "./EngagementTrackerScreen";
import ShortlistCompareScreen from "./ShortlistCompareScreen";
import CandidateDeepDiveScreen from "./CandidateDeepDiveScreen";
import InterviewSchedulingModal from "./InterviewSchedulingModal";
import NextStepsModal from "./NextStepsModal";

type ScreenType = "market_mapping" | "engagement_tracker" | "shortlist_compare" | "deep_dive" | "scheduling" | "next_steps";

interface ClientCommandCentreProps {
  clientName: string;
  clientSlug: string;
  mandate: any;
  allMandates?: any[];
  userRole?: string;
  userName?: string;
}

export default function ClientCommandCentreShell({
  clientName,
  clientSlug,
  mandate,
  allMandates = [],
  userRole = "HR Head",
  userName = "User",
}: ClientCommandCentreProps) {
  const [activeScreen, setActiveScreen] = useState<ScreenType>("market_mapping");
  const [selectedCandidateForDeepDive, setSelectedCandidateForDeepDive] = useState<any | null>(null);
  const [selectedCandidateForScheduling, setSelectedCandidateForScheduling] = useState<any | null>(null);
  const [isNextStepsOpen, setIsNextStepsOpen] = useState(false);

  const screens = [
    { id: "market_mapping" as ScreenType, label: "1. Market Mapping / Universe", icon: Compass, count: mandate?.candidates?.length || 0 },
    { id: "engagement_tracker" as ScreenType, label: "2. Candidate Engagement", icon: Users, count: mandate?.candidates?.filter((c: any) => c.stage && c.stage !== "universe").length || 0 },
    { id: "shortlist_compare" as ScreenType, label: "3. Shortlist & Compare", icon: GitCompare, count: mandate?.candidates?.filter((c: any) => c.stage === "shortlist" || c.stage === "client-shortlisted").length || 0 },
    { id: "deep_dive" as ScreenType, label: "4. Candidate Deep Dive", icon: FileCheck2 },
    { id: "scheduling" as ScreenType, label: "5. Decisions & Scheduling", icon: CalendarCheck },
    { id: "next_steps" as ScreenType, label: "6. Next Steps Loop", icon: Send },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800">
      {/* ─── Top Command Centre Header ───────────────────────── */}
      <header className="bg-[#133255] text-white border-b border-[#1e4a7a] sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/${clientSlug}`}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10 shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center font-serif text-xl font-bold text-[#133255] shrink-0"
              style={{ background: "linear-gradient(135deg, #D8B15B, #f0c96a)", boxShadow: "0 4px 14px rgba(216,177,91,0.35)" }}
            >
              MK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#D8B15B] uppercase tracking-wider">{clientName}</span>
                <span className="text-xs text-white/40">•</span>
                <span className="text-xs text-white/70 font-medium">Hiring Command Centre</span>
              </div>
              <h1 className="text-xl font-serif font-bold text-white flex items-center gap-2 mt-0.5">
                <span>{mandate.company} — {mandate.role}</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-sans font-bold">
                  {mandate.status || "Active Search"}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Next Steps Quick Action */}
            <button
              onClick={() => setIsNextStepsOpen(true)}
              className="px-4 py-2 bg-[#D8B15B] text-[#133255] hover:bg-[#e6c16d] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Next Steps</span>
            </button>
          </div>
        </div>

        {/* ─── 6 Core Screen Navigation Tabs ─────────────────── */}
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-1 overflow-x-auto scrollbar-none border-t border-white/10">
          {screens.map(tab => {
            const Icon = tab.icon;
            const isActive = activeScreen === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "scheduling") {
                    setSelectedCandidateForScheduling(mandate?.candidates?.[0] || null);
                  }
                  if (tab.id === "next_steps") {
                    setIsNextStepsOpen(true);
                    return;
                  }
                  setActiveScreen(tab.id);
                }}
                className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? "border-[#D8B15B] text-[#D8B15B] bg-white/5"
                    : "border-transparent text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#D8B15B]" : "opacity-75"}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isActive ? "bg-[#D8B15B] text-[#133255]" : "bg-white/10 text-white/80"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ─── Main Screen Content Body ───────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeScreen === "market_mapping" && (
          <MarketMappingScreen
            mandate={mandate}
            onSelectDeepDive={(cand) => {
              setSelectedCandidateForDeepDive(cand);
              setActiveScreen("deep_dive");
            }}
            onScheduleInterview={(cand) => {
              setSelectedCandidateForScheduling(cand);
              setActiveScreen("scheduling");
            }}
          />
        )}

        {activeScreen === "engagement_tracker" && (
          <EngagementTrackerScreen
            mandate={mandate}
            onSelectDeepDive={(cand) => {
              setSelectedCandidateForDeepDive(cand);
              setActiveScreen("deep_dive");
            }}
          />
        )}

        {activeScreen === "shortlist_compare" && (
          <ShortlistCompareScreen
            mandate={mandate}
            onSelectDeepDive={(cand) => {
              setSelectedCandidateForDeepDive(cand);
              setActiveScreen("deep_dive");
            }}
            onScheduleInterview={(cand) => {
              setSelectedCandidateForScheduling(cand);
              setActiveScreen("scheduling");
            }}
          />
        )}

        {activeScreen === "deep_dive" && (
          <CandidateDeepDiveScreen
            candidate={selectedCandidateForDeepDive || mandate?.candidates?.[0]}
            mandate={mandate}
            clientName={clientName}
            userName={userName}
            onBack={() => setActiveScreen("shortlist_compare")}
          />
        )}

        {activeScreen === "scheduling" && (
          <InterviewSchedulingModal
            candidate={selectedCandidateForScheduling || mandate?.candidates?.[0]}
            mandate={mandate}
            onClose={() => setActiveScreen("shortlist_compare")}
          />
        )}
      </main>

      {/* ─── Next Steps Closed-Loop Feedback Modal ──────────── */}
      <NextStepsModal
        isOpen={isNextStepsOpen}
        onClose={() => setIsNextStepsOpen(false)}
        mandate={mandate}
        clientName={clientName}
        userName={userName}
      />
    </div>
  );
}
