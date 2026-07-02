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
  // Convert 10-point score to percentage (e.g. 8.7 -> 87)
  const pct = Math.min(Math.max(score * 10, 0), 100);
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
    <div className="h-screen overflow-hidden bg-[#f4f6fb] flex">
      <div className="shrink-0 h-full">
        <ClientSidebar activeTab="dashboard" clientName={clientName} />
      </div>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* ─── Top Bar ─── */}
        <header className="shrink-0 h-[77px] bg-[#0b1f3a] border-b border-[#133255] text-white flex items-center">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-8">
            <div className="flex items-center gap-3">
              <Link href="/client/mandates" className="bg-white/10 rounded-lg w-9 h-9 flex items-center justify-center hover:bg-white/20 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white/70" />
              </Link>
              <div>
                <span className="text-[11px] font-semibold text-white/50 tracking-wider uppercase">Position</span>
                <h1 className="text-[18px] font-bold text-white leading-tight">{mandate.role}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative text-white/50 hover:text-white/80 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0b1f3a]" />
              </button>
            </div>
          </div>
        </header>

        {/* ─── Content ─── */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-5xl mx-auto w-full px-8 pb-8">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rankedCandidates.map((candidate, idx) => {
              const rank = idx + 1;
              const isSelected = selectedIds.has(candidate.id);
              const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
              const initials = candidate.initials || candidate.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
              const stageLabel = candidate.stage ? candidate.stage.charAt(0).toUpperCase() + candidate.stage.slice(1) : "Universe";

              return (
                <div
                  key={candidate.id}
                  className={`bg-white rounded-2xl p-4 border shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer flex flex-col ${
                    isSelected ? "border-indigo-400 ring-1 ring-indigo-400" : "border-gray-100"
                  }`}
                  onClick={() => router.push(`/client/candidates/${candidate.externalId}?mandateId=${mandate.id}`)}
                >
                  {/* Top Bar with Badges */}
                  <div className="flex justify-between items-start mb-2">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-[12px] font-bold ${getRankStyle(rank)}`}>
                      {rank}
                    </div>
                    {candidate.score != null && (
                      <ScoreRing score={candidate.score} />
                    )}
                  </div>

                  {/* Avatar Center */}
                  <div className="mx-auto mb-4 mt-1">
                    {candidate.profilePic ? (
                      <img
                        src={candidate.profilePic}
                        alt={candidate.name}
                        className="w-24 h-24 rounded-full object-cover shadow-sm border border-gray-100"
                      />
                    ) : (
                      <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[28px] font-bold shadow-sm border border-gray-100`}>
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Left-aligned Info */}
                  <div className="flex-1 text-left">
                    <h3 className="text-[15px] font-bold text-[#0b1f3a] truncate">{candidate.name}</h3>
                    {candidate.role && (
                      <p className="text-[12px] text-gray-500 mt-0.5 truncate">{candidate.role}</p>
                    )}
                    
                    {candidate.company && (
                      <div className="flex items-center gap-1.5 mt-2.5 text-[#0b1f3a] font-bold text-[13px]">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="truncate">{candidate.company}</span>
                      </div>
                    )}

                    <p className="text-[11px] font-medium text-gray-500 mt-1">
                       {/* Mock experience or Stage */}
                       {stageLabel} Phase
                    </p>
                  </div>

                  {/* Bottom Left Checkbox */}
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(candidate.id); }}
                      className="shrink-0 flex items-center justify-center"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-[18px] h-[18px] text-indigo-600" />
                      ) : (
                        <Square className="w-[18px] h-[18px] text-gray-300 group-hover:text-gray-400 transition-colors" />
                      )}
                    </button>
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
    </div>
  );
}
