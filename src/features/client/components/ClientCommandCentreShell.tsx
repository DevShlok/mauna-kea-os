"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Users,
  GitCompare,
  FileCheck2,
  CalendarCheck,
  Send,
  ArrowLeft,
} from "lucide-react";
import { useClientPortal } from "@/features/client/context/ClientPortalContext";
import MarketMappingScreen from "./MarketMappingScreen";
import EngagementTrackerScreen from "./EngagementTrackerScreen";
import ShortlistCompareScreen from "./ShortlistCompareScreen";
import CandidateDeepDiveScreen from "./CandidateDeepDiveScreen";
import DecisionsSchedulingScreen from "./DecisionsSchedulingScreen";
import NextStepsScreen from "./NextStepsScreen";

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

  const { setTopbarConfig } = useClientPortal();

  useEffect(() => {
    setTopbarConfig({
      title: `${mandate.company} — ${mandate.role}`,
      subtitle: `Client Hiring Command Centre • ${clientName}`,
      showBack: true,
      backUrl: `/${clientSlug}`,
    });
  }, [mandate, clientName, clientSlug, setTopbarConfig]);

  const screens = [
    { id: "market_mapping" as ScreenType, label: "1. Market Mapping / Universe", icon: Compass, count: mandate?.candidates?.length || 0 },
    { id: "engagement_tracker" as ScreenType, label: "2. Candidate Engagement", icon: Users, count: mandate?.candidates?.filter((c: any) => c.stage && c.stage !== "universe").length || 0 },
    { id: "shortlist_compare" as ScreenType, label: "3. Shortlist & Compare", icon: GitCompare, count: mandate?.candidates?.filter((c: any) => c.stage === "shortlist" || c.stage === "client-shortlisted").length || 0 },
    { id: "deep_dive" as ScreenType, label: "4. Candidate Deep Dive", icon: FileCheck2 },
    { id: "scheduling" as ScreenType, label: "5. Decisions & Scheduling", icon: CalendarCheck },
    { id: "next_steps" as ScreenType, label: "6. Next Steps Loop", icon: Send },
  ];

  return (
    <div className="flex-1 overflow-y-auto w-full bg-[#f4f6fb]">
      <div className="max-w-7xl mx-auto w-full px-6 py-6 pb-12">
        {/* ─── Executive Mandate Context Bar ───────────────────── */}
        <div className="neo-card-sm p-5 border border-slate-200/60 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Link
              href={`/${clientSlug}`}
              className="p-2.5 neo-inset text-[#133255] hover:text-[#D8B15B] transition-all shrink-0 flex items-center justify-center"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center font-serif text-lg font-bold text-[#133255] shrink-0"
              style={{ background: "linear-gradient(135deg, #D8B15B, #f0c96a)", boxShadow: "0 4px 14px rgba(216,177,91,0.25)" }}
            >
              MK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#133255] uppercase tracking-wider">{clientName}</span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-500">Executive Mandate</span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                <span>{mandate.company} — {mandate.role}</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                  {mandate.status || "Active Search"}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveScreen("next_steps")}
              className="px-5 py-2.5 neo-btn-gold text-[#133255] font-bold text-xs flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Next Steps</span>
            </button>
          </div>
        </div>

        {/* ─── 6 Core Screen Navigation Tabs ─────────────────── */}
        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-2 mb-6">
          {screens.map(tab => {
            const Icon = tab.icon;
            const isActive = activeScreen === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "scheduling" && !selectedCandidateForScheduling) {
                    setSelectedCandidateForScheduling(mandate?.candidates?.[0] || null);
                  }
                  setActiveScreen(tab.id);
                }}
                className={`px-4 py-3 text-xs font-bold rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? "neo-btn-primary text-white"
                    : "neo-card-sm bg-white text-slate-600 hover:text-slate-900 border-slate-200/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#D8B15B]" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isActive ? "bg-[#D8B15B] text-[#133255]" : "neo-inset text-slate-600"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── Main Screen Content Body ───────────────────────── */}
        <div className="w-full">
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
            <DecisionsSchedulingScreen
              candidate={selectedCandidateForScheduling || mandate?.candidates?.[0]}
              mandate={mandate}
              onSuccess={() => setActiveScreen("shortlist_compare")}
            />
          )}

          {activeScreen === "next_steps" && (
            <NextStepsScreen
              mandate={mandate}
              clientName={clientName}
              userName={userName}
              onSuccess={() => setActiveScreen("market_mapping")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
