"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Briefcase,
  Users,
  MessageSquare,
  Award,
  Calendar,
  Clock,
  ChevronRight,
  Search,
  Star,
  LogOut,
} from "lucide-react";
import { useClientPortal } from "../context/ClientPortalContext";

// ─── Types ───────────────────────────────────────────────
type MandateCandidate = {
  id: number;
  stage: string | null;
  name: string;
};

type Mandate = {
  id: number;
  company: string;
  role: string;
  status: string | null;
  internalStatus: string | null;
  opened: string | null;
  consultant: string | null;
  candidates: MandateCandidate[];
  createdAt: Date | null;
};

type Props = {
  clientName: string;
  mandates: Mandate[];
  initialTab?: "dashboard" | "shortlist" | "insights" | "profile";
};

// ─── Stage Helpers ───────────────────────────────────────
function getStageCounts(candidates: MandateCandidate[]) {
  const identified = candidates.length;
  const interviewed = candidates.filter(c => 
    c.stage && ["interviewed", "offered", "hired"].includes(c.stage)
  ).length;
  const offers = candidates.filter(c => 
    c.stage && ["offered", "hired"].includes(c.stage)
  ).length;
  const hired = candidates.filter(c => c.stage === "hired").length;
  return { identified, interviewed, offers, hired };
}

function getDaysOpen(opened: string | null, createdAt: Date | null): number {
  const dateStr = opened || (createdAt ? new Date(createdAt).toISOString().split("T")[0] : null);
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(opened: string | null, createdAt: Date | null): string {
  const dateStr = opened || (createdAt ? new Date(createdAt).toISOString().split("T")[0] : null);
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Status tag config
function getStatusConfig(status: string | null, internalStatus: string | null) {
  const tags: { label: string; color: string; bg: string }[] = [];
  const s = (status || "").toLowerCase();
  const is = (internalStatus || "").toLowerCase();

  if (s === "universe" || s === "active" || is === "active" || is === "inprogress") {
    tags.push({ label: "Active", color: "#059669", bg: "#d1fae5" });
  }
  if (is === "priority" || is === "hot") {
    tags.push({ label: "Priority", color: "#d97706", bg: "#fef3c7" });
  }
  if (is === "hot") {
    tags.unshift({ label: "Hot", color: "#dc2626", bg: "#fee2e2" });
  }
  if (is === "delayed" || s === "delayed") {
    tags.push({ label: "Delayed", color: "#dc2626", bg: "#fee2e2" });
  }
  if (s === "closed" || is === "closed") {
    tags.push({ label: "Closed", color: "#6b7280", bg: "#f3f4f6" });
  }
  if (tags.length === 0) {
    tags.push({ label: "Active", color: "#059669", bg: "#d1fae5" });
  }
  return tags;
}

// Funnel Chart
function FunnelChart({ counts }: { counts: { identified: number; interviewed: number; offers: number; hired: number } }) {
  const max = Math.max(counts.identified, 1);
  const barData = [
    { value: counts.identified, color: "#6366f1" },
    { value: counts.interviewed, color: "#818cf8" },
    { value: counts.offers, color: "#a5b4fc" },
    { value: counts.hired, color: "#c7d2fe" },
  ];

  return (
    <div className="flex items-end gap-[3px] h-[52px]">
      {barData.map((bar, i) => {
        const height = Math.max((bar.value / max) * 48, 4);
        return (
          <div
            key={i}
            className="rounded-t transition-all duration-500"
            style={{ width: "10px", height: `${height}px`, backgroundColor: bar.color }}
          />
        );
      })}
    </div>
  );
}

// Role icon
function getRoleIcon(role: string) {
  const r = role.toLowerCase();
  if (r.includes("chief") || r.includes("cfo") || r.includes("cto") || r.includes("cmo") || r.includes("ceo")) {
    return (
      <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
        <Briefcase className="w-5 h-5 text-indigo-600" />
      </div>
    );
  }
  if (r.includes("vp") || r.includes("vice president")) {
    return (
      <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
        <Users className="w-5 h-5 text-emerald-600" />
      </div>
    );
  }
  if (r.includes("director") || r.includes("head")) {
    return (
      <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
        <Award className="w-5 h-5 text-amber-600" />
      </div>
    );
  }
  return (
    <div className="w-11 h-11 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
      <Briefcase className="w-5 h-5 text-sky-600" />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────
export default function ClientDashboard({ clientName, mandates, initialTab = "dashboard" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as any;
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [showAllOpen, setShowAllOpen] = useState(false);
  const [showAllClosed, setShowAllClosed] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"dashboard" | "search" | "shortlist" | "insights" | "profile">(tabParam || initialTab);
  const { setTopbarConfig } = useClientPortal();

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    } else {
      setActiveTab(initialTab);
    }
  }, [tabParam, initialTab]);

  useEffect(() => {
    switch (activeTab) {
      case "dashboard":
        setTopbarConfig({
          title: clientName,
          subtitle: "Welcome back",
          showSearch: true,
          searchQuery,
          onSearchChange: setSearchQuery,
          showFilter: true,
          filterValue: filter,
          onFilterChange: (val: string) => setFilter(val as any),
        });
        break;
      case "insights":
        setTopbarConfig({ title: "Insights" });
        break;
      case "profile":
        setTopbarConfig({ title: "Profile" });
        break;
      case "shortlist":
        setTopbarConfig({ title: "Shortlisted Candidates" });
        break;
      default:
        setTopbarConfig({});
    }
  }, [activeTab, clientName, searchQuery, filter, setTopbarConfig]);

  const openMandates = mandates.filter(m => {
    const s = (m.status || "").toLowerCase();
    const is = (m.internalStatus || "").toLowerCase();
    return s !== "closed" && is !== "closed";
  });

  const closedMandates = mandates.filter(m => {
    const s = (m.status || "").toLowerCase();
    const is = (m.internalStatus || "").toLowerCase();
    return s === "closed" || is === "closed";
  });

  // Aggregate stats
  const totalCandidates = mandates.reduce((sum, m) => sum + getStageCounts(m.candidates).identified, 0);
  const totalInterviews = mandates.reduce((sum, m) => sum + getStageCounts(m.candidates).interviewed, 0);
  const totalOffers = mandates.reduce((sum, m) => sum + getStageCounts(m.candidates).offers, 0);

  // Show first 5 unless "View All" is clicked
  const visibleOpenMandates = showAllOpen ? openMandates : openMandates.slice(0, 5);
  const visibleClosedMandates = showAllClosed ? closedMandates : closedMandates.slice(0, 3);

  // Search across mandates
  const searchResults = searchQuery.trim()
    ? mandates.filter(m => m.role.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const navigateToMandate = (id: number) => {
    router.push(`/client/mandates/${id}`);
  };

  // ─── Insights View ─────────────────────────────────────
  if (activeTab === "insights") {
    const totalHired = mandates.reduce((sum, m) => sum + getStageCounts(m.candidates).hired, 0);
    return (
          <div className="flex-1 overflow-y-auto w-full">
            <div className="max-w-5xl mx-auto w-full px-8 mt-6 pb-12">
              <h2 className="text-[20px] font-bold text-[#0b1f3a] mb-5">Hiring Summary</h2>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Total Positions", value: mandates.length, color: "bg-indigo-50 text-indigo-600" },
                { label: "Open Positions", value: openMandates.length, color: "bg-emerald-50 text-emerald-600" },
                { label: "Candidates Identified", value: totalCandidates, color: "bg-sky-50 text-sky-600" },
                { label: "Interviews Conducted", value: totalInterviews, color: "bg-amber-50 text-amber-600" },
                { label: "Offers Extended", value: totalOffers, color: "bg-violet-50 text-violet-600" },
                { label: "Hires Made", value: totalHired, color: "bg-emerald-50 text-emerald-700" },
              ].map((stat, i) => (
                <div key={i} className={`rounded-xl p-4 ${stat.color.split(" ")[0]} border border-gray-100`}>
                  <span className="text-[28px] font-bold text-[#0b1f3a] block">{stat.value}</span>
                  <span className={`text-[12px] font-medium ${stat.color.split(" ")[1]}`}>{stat.label}</span>
                </div>
              ))}
            </div>

            <h3 className="text-[16px] font-bold text-[#0b1f3a] mb-3">Position Breakdown</h3>
            <div className="flex flex-col gap-2">
              {mandates.map(m => {
                const c = getStageCounts(m.candidates);
                return (
                  <div key={m.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <h4 className="text-[13px] font-bold text-[#0b1f3a] mb-2">{m.role}</h4>
                    <div className="flex items-center gap-4 text-[11px]">
                      <span className="text-gray-500">Identified: <strong className="text-[#0b1f3a]">{c.identified}</strong></span>
                      <span className="text-gray-500">Interviewed: <strong className="text-[#0b1f3a]">{c.interviewed}</strong></span>
                      <span className="text-gray-500">Offers: <strong className="text-[#0b1f3a]">{c.offers}</strong></span>
                      <span className="text-gray-500">Hired: <strong className="text-[#0b1f3a]">{c.hired}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
    );
  }

  // ─── Profile View ──────────────────────────────────────
  if (activeTab === "profile") {
    return (
          <div className="flex-1 overflow-y-auto w-full">
            <div className="max-w-5xl mx-auto w-full px-8 mt-6 pb-12">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center max-w-lg mx-auto">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                {clientName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
              </div>
              <h2 className="text-[20px] font-bold text-[#0b1f3a]">{clientName}</h2>
              <p className="text-[13px] text-gray-400 mt-1">Client Account</p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="bg-indigo-50 rounded-xl p-3">
                  <span className="text-[20px] font-bold text-[#0b1f3a] block">{mandates.length}</span>
                  <span className="text-[11px] text-indigo-600">Total Mandates</span>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3">
                  <span className="text-[20px] font-bold text-[#0b1f3a] block">{openMandates.length}</span>
                  <span className="text-[11px] text-emerald-600">Active</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-[20px] font-bold text-[#0b1f3a] block">{closedMandates.length}</span>
                  <span className="text-[11px] text-gray-600">Closed</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push("/")}
              className="mt-6 max-w-lg mx-auto w-full flex items-center justify-center gap-2 bg-white rounded-xl p-4 border border-red-100 text-red-600 font-medium text-[14px] hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
    );
  }

  // ─── Shortlist View ────────────────────────────────────
  if (activeTab === "shortlist") {
    const shortlisted = mandates.filter(m => {
      return m.candidates.some(c => c.stage && ["interviewed", "offered", "hired"].includes(c.stage));
    });
    return (
          <div className="flex-1 overflow-y-auto w-full">
            <div className="max-w-5xl mx-auto w-full px-8 mt-6 pb-12">
            {shortlisted.length > 0 ? shortlisted.map(mandate => {
              const shortCands = mandate.candidates.filter(c => c.stage && ["interviewed", "offered", "hired"].includes(c.stage));
              return (
                <div key={mandate.id} className="mb-5">
                  <h3 className="text-[14px] font-bold text-[#0b1f3a] mb-2 flex items-center gap-2">
                    {mandate.role}
                    <span className="text-[11px] font-normal text-gray-400">({shortCands.length} shortlisted)</span>
                  </h3>
                  <div className="flex flex-col gap-2">
                    {shortCands.map(c => {
                      const initials = c.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
                      const stageLabel = (c.stage || "").charAt(0).toUpperCase() + (c.stage || "").slice(1);
                      return (
                        <div key={c.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] font-semibold text-[#0b1f3a] truncate block">{c.name}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2.5 py-0.5">{stageLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-16 text-gray-400">
                <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-[14px]">No shortlisted candidates yet.</p>
              </div>
            )}
          </div>
        </div>
    );
  }

  // ─── Dashboard View (Default) ──────────────────────────
  return (
        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-5xl mx-auto w-full px-8 py-6 pb-12">
          {searchQuery.trim() ? (
            <div className="flex flex-col gap-2.5">
              <h2 className="text-[16px] font-bold text-[#0b1f3a] mb-2">Search Results</h2>
              {searchResults.length > 0 ? (
                searchResults.map(mandate => (
                  <button
                    key={mandate.id}
                    onClick={() => navigateToMandate(mandate.id)}
                    className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-3"
                  >
                    {getRoleIcon(mandate.role)}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-bold text-[#0b1f3a] truncate">{mandate.role}</h3>
                      <p className="text-[12px] text-gray-400">{mandate.candidates.length} candidates • {formatDate(mandate.opened, mandate.createdAt)}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </button>
                ))
              ) : (
                <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-[14px]">No positions match &quot;{searchQuery}&quot;</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 mb-8">
                {[
                  { icon: Briefcase, label: "Open Positions", value: openMandates.length, color: "text-indigo-600", bg: "bg-indigo-50", onClick: () => setFilter("open") },
                  { icon: Users, label: "Candidates Identified", value: totalCandidates, color: "text-sky-600", bg: "bg-sky-50", onClick: () => {} },
                  { icon: MessageSquare, label: "Interviews Conducted", value: totalInterviews, color: "text-emerald-600", bg: "bg-emerald-50", onClick: () => setActiveTab("shortlist") },
                  { icon: Award, label: "Offers Made", value: totalOffers, color: "text-violet-600", bg: "bg-violet-50", onClick: () => setActiveTab("shortlist") },
                ].map((stat, i) => (
                  <button
                key={i}
                onClick={stat.onClick}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow text-left"
              >
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-[18px] h-[18px] ${stat.color}`} />
                </div>
                <div>
                  <span className="text-[22px] font-bold text-[#0b1f3a] block leading-none">{stat.value}</span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">{stat.label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Open Positions */}
          {(filter === "all" || filter === "open") && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[17px] font-bold text-[#0b1f3a]">Open Positions</h2>
                  <span className="bg-indigo-100 text-indigo-700 text-[12px] font-semibold rounded-full px-2.5 py-0.5">{openMandates.length}</span>
                </div>
                {openMandates.length > 5 && (
                  <button
                    onClick={() => setShowAllOpen(!showAllOpen)}
                    className="text-[13px] text-indigo-600 font-medium hover:underline"
                  >
                    {showAllOpen ? "Show Less" : "View All"}
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {visibleOpenMandates.map(mandate => {
                  const counts = getStageCounts(mandate.candidates);
                  const tags = getStatusConfig(mandate.status, mandate.internalStatus);
                  const daysOpen = getDaysOpen(mandate.opened, mandate.createdAt);
                  const openedDate = formatDate(mandate.opened, mandate.createdAt);

                  return (
                    <div
                      key={mandate.id}
                      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group cursor-pointer"
                      onClick={() => navigateToMandate(mandate.id)}
                    >
                      <div className="flex items-start gap-4">
                        {getRoleIcon(mandate.role)}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[15px] font-bold text-[#0b1f3a] truncate">{mandate.role}</h3>
                          <div className="flex items-center gap-3 mt-1 text-[12px] text-gray-400">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Opened on {openedDate}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {daysOpen} days open</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-2.5">
                            {tags.map((t, i) => (
                              <span key={i} className="text-[11px] font-semibold rounded-full px-2.5 py-0.5" style={{ color: t.color, backgroundColor: t.bg }}>
                                {t.label}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-5 shrink-0">
                          <FunnelChart counts={counts} />
                          <div className="grid grid-cols-1 gap-0.5 text-[12px] min-w-[120px]">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-500" />
                              <span className="text-gray-500">Identified</span>
                              <span className="ml-auto font-bold text-[#0b1f3a]">{counts.identified}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-400" />
                              <span className="text-gray-500">Interviewed</span>
                              <span className="ml-auto font-bold text-[#0b1f3a]">{counts.interviewed}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-300" />
                              <span className="text-gray-500">Offers</span>
                              <span className="ml-auto font-bold text-[#0b1f3a]">{counts.offers}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-200" />
                              <span className="text-gray-500">Hired</span>
                              <span className="ml-auto font-bold text-[#0b1f3a]">{counts.hired || "–"}</span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => { e.stopPropagation(); navigateToMandate(mandate.id); }}
                            className="bg-[#0b1f3a] text-white text-[12px] font-medium rounded-lg px-4 py-2 hover:bg-[#162d4f] transition-colors whitespace-nowrap opacity-0 group-hover:opacity-100"
                          >
                            View Candidates
                          </button>
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {openMandates.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-[14px]">No open positions at the moment.</div>
                )}
              </div>
            </section>
          )}

          {/* Closed Positions */}
          {(filter === "all" || filter === "closed") && closedMandates.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[17px] font-bold text-[#0b1f3a]">Closed Positions</h2>
                  <span className="bg-gray-100 text-gray-600 text-[12px] font-semibold rounded-full px-2.5 py-0.5">{closedMandates.length}</span>
                </div>
                {closedMandates.length > 3 && (
                  <button
                    onClick={() => setShowAllClosed(!showAllClosed)}
                    className="text-[13px] text-indigo-600 font-medium hover:underline"
                  >
                    {showAllClosed ? "Show Less" : "View All"}
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {visibleClosedMandates.map(mandate => {
                  const counts = getStageCounts(mandate.candidates);
                  return (
                    <div
                      key={mandate.id}
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigateToMandate(mandate.id)}
                    >
                      <div className="flex items-center gap-4">
                        {getRoleIcon(mandate.role)}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[14px] font-bold text-[#0b1f3a] truncate">{mandate.role}</h3>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Closed • Opened on {formatDate(mandate.opened, mandate.createdAt)}
                          </p>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-center shrink-0">
                          {[
                            { label: "Identified", value: counts.identified },
                            { label: "Interviewed", value: counts.interviewed },
                            { label: "Offers", value: counts.offers },
                            { label: "Hired", value: counts.hired },
                          ].map((item, i) => (
                            <div key={i}>
                              <span className="text-[10px] text-gray-400 block">{item.label}</span>
                              <span className="text-[18px] font-bold text-[#0b1f3a]">{item.value}</span>
                            </div>
                          ))}
                        </div>
                        <span className="bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-full px-3 py-1 border border-gray-200">
                              Closed
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
          </div>
        </div>
  );
}
