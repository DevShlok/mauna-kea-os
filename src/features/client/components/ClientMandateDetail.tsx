"use client";

import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Users,
  Bell,
  Filter,
  CheckSquare,
  Square,
  ChevronRight,
  Building2,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClientSidebar } from "./ClientSidebar";

// ─── Types ───────────────────────────────────────────────
type MandateCandidate = {
  id: number;
  externalId: string;
  name: string;
  company: string | null;
  role: string | null;
  stage: string | null;
  score: number | null;
  initials: string | null;
  profilePic?: string | null;
};

type MandateDetail = {
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
  mandate: MandateDetail;
  clientName: string;
};

// ─── Circular Score Ring ─────────────────────────────────
function ScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (pct / 100) * circumference;

  // Color based on score
  let strokeColor = "#10b981"; // green
  if (pct < 70) strokeColor = "#f59e0b"; // amber
  if (pct < 50) strokeColor = "#ef4444"; // red

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[#0b1f3a]">
        {Math.round(pct)}%
      </span>
    </div>
  );
}

// ─── Avatar Colors ───────────────────────────────────────
const AVATAR_GRADIENTS = [
  "from-indigo-600 to-blue-500",
  "from-violet-600 to-purple-500",
  "from-blue-600 to-cyan-500",
  "from-emerald-600 to-teal-500",
  "from-amber-600 to-orange-500",
  "from-rose-600 to-pink-500",
  "from-sky-600 to-indigo-500",
  "from-fuchsia-600 to-violet-500",
  "from-teal-600 to-emerald-500",
];

// ─── Rank Badge Colors ───────────────────────────────────
function getRankStyle(rank: number) {
  if (rank <= 3) return "bg-[#0b1f3a] text-white";
  if (rank <= 6) return "bg-indigo-100 text-indigo-700";
  return "bg-emerald-100 text-emerald-700";
}

// ─── PIPELINE STAGES for filter ──────────────────────────
const FILTER_STAGES = [
  { key: "all", label: "All Candidates" },
  { key: "identified", label: "Identified" },
  { key: "screening", label: "Screening" },
  { key: "interviewed", label: "Interviewed" },
  { key: "offered", label: "Offered" },
  { key: "hired", label: "Hired" },
] as const;

// ─── Component ───────────────────────────────────────────
export default function ClientMandateDetail({ mandate, clientName }: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [stageFilter, setStageFilter] = useState("all");

  // Sort candidates by score (highest first = AI-ranked)
  const rankedCandidates = useMemo(() => {
    let list = [...mandate.candidates];

    // Filter by stage
    if (stageFilter !== "all") {
      list = list.filter(c => (c.stage || "universe").toLowerCase() === stageFilter);
    }

    // Sort by score descending (AI-ranked)
    list.sort((a, b) => (b.score || 0) - (a.score || 0));
    return list;
  }, [mandate.candidates, stageFilter]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === rankedCandidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rankedCandidates.map(c => c.id)));
    }
  };

  const allSelected = rankedCandidates.length > 0 && selectedIds.size === rankedCandidates.length;

  return (
    <div className="min-h-screen bg-[#f4f6fb] flex">
      <ClientSidebar activeTab="dashboard" clientName={clientName} />
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* ─── Top Bar ─── */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-8 py-3.5">
            <div className="flex items-center gap-3">
              <Link href="/client/mandates" className="bg-gray-100 rounded-lg w-9 h-9 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <span className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">Position</span>
                <h1 className="text-[18px] font-bold text-[#0b1f3a] leading-tight">{mandate.role}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
              </button>
            </div>
          </div>
        </header>

        {/* ─── Content ─── */}
        <div className="max-w-5xl mx-auto w-full flex-1 px-8 pb-8">
          {/* Section Title + Filter */}
          <div className="flex items-start justify-between mt-6 mb-1">
            <div>
              <h2 className="text-[20px] font-bold text-[#0b1f3a] leading-tight">
                Top {rankedCandidates.length} Selected Candidates
              </h2>
              <p className="text-[12px] text-gray-400 mt-0.5">AI-ranked for best fit</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                  stageFilter !== "all"
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <Filter className="w-[18px] h-[18px]" />
              </button>
              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                  <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-48 z-50">
                    {FILTER_STAGES.map(stage => (
                      <button
                        key={stage.key}
                        onClick={() => { setStageFilter(stage.key); setFilterOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${
                          stageFilter === stage.key
                            ? "bg-indigo-50 text-indigo-700 font-semibold"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {stage.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Selection Bar */}
          <div className="flex items-center justify-between mt-4 mb-4">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-[13px] text-gray-500 hover:text-gray-700 transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="w-[18px] h-[18px] text-indigo-600" />
              ) : (
                <Square className="w-[18px] h-[18px]" />
              )}
              <span>{selectedIds.size}/{rankedCandidates.length} Selected</span>
            </button>
            <button
              onClick={() => {
                if (selectedIds.size > 0) setSelectedIds(new Set());
                else setSelectedIds(new Set(rankedCandidates.map(c => c.id)));
              }}
              className="text-[12px] text-indigo-600 font-medium hover:underline"
            >
              {selectedIds.size > 0 ? "Clear" : "Select All"}
            </button>
          </div>

          {/* Candidate List */}
          <div className="flex flex-col gap-3">
            {rankedCandidates.map((candidate, idx) => {
              const rank = idx + 1;
              const isSelected = selectedIds.has(candidate.id);
              const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
              const initials = candidate.initials || candidate.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
              const stageLabel = candidate.stage ? candidate.stage.charAt(0).toUpperCase() + candidate.stage.slice(1) : "Universe";

              return (
                <div
                  key={candidate.id}
                  className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer ${
                    isSelected ? "border-indigo-300 ring-1 ring-indigo-200" : "border-gray-100"
                  }`}
                  onClick={() => toggleSelect(candidate.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${getRankStyle(rank)}`}>
                      {rank}
                    </div>

                    {/* Avatar */}
                    {candidate.profilePic ? (
                      <img
                        src={candidate.profilePic}
                        alt={candidate.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                      />
                    ) : (
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[13px] font-bold shadow-sm shrink-0`}>
                        {initials}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-bold text-[#0b1f3a] truncate">{candidate.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                        {candidate.company && (
                          <span className="flex items-center gap-1 truncate">
                            <Building2 className="w-3 h-3 shrink-0" />
                            {candidate.company}
                          </span>
                        )}
                        {candidate.role && (
                          <span className="flex items-center gap-1 truncate">
                            <Briefcase className="w-3 h-3 shrink-0" />
                            {candidate.role}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    {candidate.score != null && <ScoreRing score={candidate.score} />}

                    {/* Stage */}
                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2.5 py-0.5">
                      {stageLabel}
                    </span>

                    {/* Select */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(candidate.id); }}
                      className="shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                      )}
                    </button>

                    {/* Navigate */}
                    <Link
                      href={`/client/candidates/${candidate.externalId}?mandateId=${mandate.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                    </Link>
                  </div>
                </div>
              );
            })}

            {rankedCandidates.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-[14px]">No candidates found for this position.</p>
              </div>
            )}
          </div>

          {/* ─── Review Selected CTA ─── */}
          <div className="sticky bottom-4 mt-6 z-40">
            <button
              disabled={selectedIds.size === 0}
              className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-[14px] font-semibold transition-all duration-200 ${
                selectedIds.size > 0
                  ? "bg-[#0b1f3a] text-white hover:bg-[#162d4f] shadow-lg shadow-[#0b1f3a]/25"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Users className="w-5 h-5" />
              Review Selected Candidates ({selectedIds.size})
              {selectedIds.size > 0 && <ChevronRight className="w-4 h-4 ml-1" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
