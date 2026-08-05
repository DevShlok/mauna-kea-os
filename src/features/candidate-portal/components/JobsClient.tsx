"use client";

import React, { useState } from "react";
import { CandidateJob } from "@/db/schema";
import { markJobInterestAction } from "@/actions/candidate-portal";
import {
  Briefcase,
  Lock,
  MapPin,
  IndianRupee,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  Building2,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

function NeoCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] relative overflow-hidden ${className}`}
      style={{
        background: "#eef2f7",
        boxShadow: "10px 10px 20px #cbd5e1, -10px -10px 20px #ffffff",
      }}
    >
      {children}
    </div>
  );
}

interface Props {
  jobs: CandidateJob[];
  initialInterests: Record<number, string>; // jobId -> status ('Interested' | 'Not Interested')
  sectors: string[];
}

export function JobsClient({ jobs, initialInterests, sectors }: Props) {
  const [interests, setInterests] = useState<Record<number, string>>(initialInterests);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [ctcFilter, setCtcFilter] = useState<string>("all"); // 'all' | 'lt50' | '50to100' | 'gt100'
  const [updatingJobId, setUpdatingJobId] = useState<number | null>(null);

  const handleInterest = async (jobId: number, status: "Interested" | "Not Interested") => {
    setUpdatingJobId(jobId);
    // Optimistic
    setInterests((prev) => ({ ...prev, [jobId]: status }));
    try {
      await markJobInterestAction(jobId, status);
      toast.success(
        status === "Interested"
          ? "Expressed interest! Our consultants have been notified."
          : "Preference saved."
      );
    } catch {
      toast.error("Failed to update interest");
    } finally {
      setUpdatingJobId(null);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = job.title.toLowerCase().includes(q);
      const companyMatch = (job.companyDisplay || "").toLowerCase().includes(q);
      const locMatch = (job.location || "").toLowerCase().includes(q);
      if (!titleMatch && !companyMatch && !locMatch) return false;
    }

    // Sector filter
    if (selectedSector && job.sector !== selectedSector) return false;

    // CTC filter
    if (ctcFilter !== "all") {
      const maxCtc = job.ctcRangeMax || job.ctcRangeMin || 0;
      if (ctcFilter === "lt50" && maxCtc > 50) return false;
      if (ctcFilter === "50to100" && (maxCtc < 50 || maxCtc > 100)) return false;
      if (ctcFilter === "gt100" && maxCtc < 100) return false;
    }

    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <NeoCard className="p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#133255] uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-[#D8B15B]" /> Curated Opportunities
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              Executive Jobs Feed
            </h1>
            <p className="text-slate-500 text-xs mt-1 max-w-lg font-medium leading-relaxed">
              Curated positions handpicked by Mauna Kea consultants tailored for your experience level. Express interest to initiate confidential discussions.
            </p>
          </div>

          <div
            className="px-4 py-2 rounded-2xl text-xs font-bold text-[#133255] shrink-0"
            style={{
              background: "#eef2f7",
              boxShadow: "inset 3px 3px 6px #cbd5e1, inset -3px -3px 6px #ffffff",
            }}
          >
            {filteredJobs.length} {filteredJobs.length === 1 ? "Role" : "Roles"} Available
          </div>
        </div>
      </NeoCard>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div
          className="rounded-2xl p-2.5 flex items-center gap-2 bg-[#eef2f7]"
          style={{
            boxShadow: "inset 3px 3px 6px #cbd5e1, inset -3px -3px 6px #ffffff",
          }}
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search roles or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-700 bg-transparent focus:outline-none placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* Sector dropdown */}
        <div
          className="rounded-2xl p-2.5 flex items-center gap-2 bg-[#eef2f7]"
          style={{
            boxShadow: "inset 3px 3px 6px #cbd5e1, inset -3px -3px 6px #ffffff",
          }}
        >
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="w-full text-xs text-slate-700 bg-transparent focus:outline-none font-medium cursor-pointer"
          >
            <option value="">All Sectors</option>
            {sectors.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        {/* CTC presets */}
        <div
          className="rounded-2xl p-2.5 flex items-center gap-2 bg-[#eef2f7]"
          style={{
            boxShadow: "inset 3px 3px 6px #cbd5e1, inset -3px -3px 6px #ffffff",
          }}
        >
          <IndianRupee className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <select
            value={ctcFilter}
            onChange={(e) => setCtcFilter(e.target.value)}
            className="w-full text-xs text-slate-700 bg-transparent focus:outline-none font-medium cursor-pointer"
          >
            <option value="all">All CTC Ranges</option>
            <option value="lt50">Up to ₹50 Lakhs</option>
            <option value="50to100">₹50L – ₹1 Cr</option>
            <option value="gt100">₹1 Cr+</option>
          </select>
        </div>
      </div>

      {/* Jobs Feed List */}
      {filteredJobs.length === 0 ? (
        <NeoCard className="p-12 text-center text-slate-400 font-medium">
          <Briefcase className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-bold text-slate-600">No matching jobs found.</p>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search query or filter options.
          </p>
        </NeoCard>
      ) : (
        <div className="space-y-5">
          {filteredJobs.map((job) => {
            const currentInterest = interests[job.id];
            const isUpdating = updatingJobId === job.id;

            return (
              <NeoCard key={job.id} className="p-6 sm:p-7 space-y-4">
                {/* Top Title & Badges Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200/60 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-slate-800 font-bold text-lg">{job.title}</h2>
                      {job.isConfidential && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" /> Confidential
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 font-semibold text-xs mt-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {job.companyDisplay || "Leading Organization"}
                    </p>
                  </div>

                  {job.sector && (
                    <span
                      className="px-3 py-1 rounded-full text-[11px] font-bold text-[#133255] self-start"
                      style={{
                        background: "#eef2f7",
                        boxShadow: "inset 2px 2px 4px #cbd5e1, inset -2px -2px 4px #ffffff",
                      }}
                    >
                      {job.sector}
                    </span>
                  )}
                </div>

                {/* Meta Badges Row */}
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 flex-wrap">
                  {job.location && (
                    <span className="flex items-center gap-1 bg-white/60 px-2.5 py-1 rounded-lg border border-slate-200/50">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}
                    </span>
                  )}
                  {(job.experienceMin || job.experienceMax) && (
                    <span className="flex items-center gap-1 bg-white/60 px-2.5 py-1 rounded-lg border border-slate-200/50">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {job.experienceMin || 0}–{job.experienceMax || 0} yrs exp
                    </span>
                  )}
                  {(job.ctcRangeMin || job.ctcRangeMax) && (
                    <span className="flex items-center gap-1 bg-white/60 px-2.5 py-1 rounded-lg border border-slate-200/50 text-emerald-700 font-bold">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> ₹{job.ctcRangeMin || 0}L – ₹{job.ctcRangeMax || 0}L
                    </span>
                  )}
                </div>

                {/* Description */}
                {job.description && (
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {job.description}
                  </p>
                )}

                {/* Highlights Bullet List */}
                {job.highlights && (job.highlights as string[]).length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {(job.highlights as string[]).map((hl, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                        <span className="text-[#D8B15B] font-bold mt-0.5">✦</span>
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bottom Interest Action Buttons */}
                <div className="flex items-center gap-3 pt-3 border-t border-slate-200/60">
                  <button
                    disabled={isUpdating}
                    onClick={() => handleInterest(job.id, "Interested")}
                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      currentInterest === "Interested"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                        : "bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {currentInterest === "Interested" ? "Interested Registered ✓" : "I'm Interested"}
                  </button>

                  <button
                    disabled={isUpdating}
                    onClick={() => handleInterest(job.id, "Not Interested")}
                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      currentInterest === "Not Interested"
                        ? "bg-slate-700 text-white shadow-md"
                        : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    {currentInterest === "Not Interested" ? "Not For Me ✓" : "Not for me"}
                  </button>
                </div>
              </NeoCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
