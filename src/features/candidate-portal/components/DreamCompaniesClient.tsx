"use client";

import React, { useState } from "react";
import { DreamCompanyStatus } from "@/db/schema";
import {
  addDreamCompanyAction,
  removeDreamCompanyAction,
} from "@/actions/candidate-portal";
import {
  Star,
  Plus,
  X,
  Search,
  Building2,
  Lock,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  ChevronRight,
  TrendingUp,
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
  dreamCos: string[];
  statuses: DreamCompanyStatus[];
  suggestions: string[];
  masterClientNames: string[];
  tier?: "A" | "B" | "C" | null;
}

function LockedState() {
  return (
    <div className="max-w-xl mx-auto py-24 flex flex-col items-center gap-4 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#eef2f7]"
        style={{ boxShadow: "4px 4px 10px #cbd5e1, -4px -4px 10px #ffffff" }}
      >
        <Lock className="w-8 h-8 text-[#133255]" />
      </div>
      <h2 className="text-slate-800 font-bold text-xl">Dream 10 — Locked</h2>
      <p className="text-slate-500 text-[14px] max-w-sm">
        Complete your Mauna Kea Assessment to unlock Dream 10 Executive Tracking.
        Tier B or above gives you access.
      </p>
    </div>
  );
}

const STATUS_CONFIG: Record<
  string,
  { label: string; colorClass: string; bgClass: string; borderClass: string; icon: any; subtext: string }
> = {
  "Not Started": {
    label: "Not Started",
    colorClass: "text-slate-600",
    bgClass: "bg-slate-100",
    borderClass: "border-slate-200",
    icon: Clock,
    subtext: "We'll make a best effort to reach out to HR",
  },
  "Outreach Sent": {
    label: "Outreach Sent",
    colorClass: "text-blue-700",
    bgClass: "bg-blue-100/80",
    borderClass: "border-blue-200",
    icon: TrendingUp,
    subtext: "We've reached out to decision makers at this company",
  },
  "In Talks": {
    label: "In Talks",
    colorClass: "text-amber-800",
    bgClass: "bg-amber-100/80",
    borderClass: "border-amber-200",
    icon: Clock,
    subtext: "Active conversations are ongoing with executive search lead",
  },
  Interviewed: {
    label: "Interviewed",
    colorClass: "text-orange-800",
    bgClass: "bg-orange-100/80",
    borderClass: "border-orange-200",
    icon: Award,
    subtext: "You've been put forward for an executive interview",
  },
  Rejected: {
    label: "Rejected",
    colorClass: "text-slate-500",
    bgClass: "bg-slate-100",
    borderClass: "border-slate-200",
    icon: AlertCircle,
    subtext: "No immediate fit found for current openings",
  },
  Offer: {
    label: "Offer Received 🎉",
    colorClass: "text-emerald-800",
    bgClass: "bg-emerald-100/80",
    borderClass: "border-emerald-200",
    icon: CheckCircle2,
    subtext: "Congratulations! An offer has been issued",
  },
};

export function DreamCompaniesClient({
  dreamCos: initialDreamCos,
  statuses: initialStatuses,
  suggestions: initialSuggestions,
  masterClientNames,
  tier,
}: Props) {
  if (!tier || tier === "C") {
    return <LockedState />;
  }
  const [dreamCos, setDreamCos] = useState<string[]>(initialDreamCos);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingCo, setRemovingCo] = useState<string | null>(null);

  const statusMap = new Map<string, string>();
  for (const s of initialStatuses) {
    statusMap.set(s.companyName.toLowerCase(), s.status || "Not Started");
  }

  const handleAddCompany = async (companyName: string) => {
    const cleanName = companyName.trim();
    if (!cleanName) return;

    if (dreamCos.length >= 10) {
      toast.error("Maximum 10 dream companies limit reached.");
      return;
    }

    if (dreamCos.some((c) => c.toLowerCase() === cleanName.toLowerCase())) {
      toast.error("Company is already in your dream list.");
      return;
    }

    setIsSubmitting(true);
    setDreamCos((prev) => [...prev, cleanName]);
    try {
      const res = await addDreamCompanyAction(cleanName);
      if (res.success) {
        toast.success(`Added ${cleanName} to your dream companies!`);
        setIsAddModalOpen(false);
        setSearchQuery("");
      } else {
        toast.error(res.error || "Failed to add company");
        setDreamCos((prev) => prev.filter((c) => c.toLowerCase() !== cleanName.toLowerCase()));
      }
    } catch {
      toast.error("Failed to add company");
      setDreamCos((prev) => prev.filter((c) => c.toLowerCase() !== cleanName.toLowerCase()));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCompany = async (companyName: string) => {
    setRemovingCo(companyName);
    setDreamCos((prev) => prev.filter((c) => c.toLowerCase() !== companyName.toLowerCase()));
    try {
      await removeDreamCompanyAction(companyName);
      toast.success(`Removed ${companyName}`);
    } catch {
      toast.error("Failed to remove company");
    } finally {
      setRemovingCo(null);
    }
  };

  const searchResults = masterClientNames.filter((name) => {
    if (!searchQuery) return true;
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !dreamCos.some((c) => c.toLowerCase() === name.toLowerCase())
    );
  }).slice(0, 8);

  const availableSuggestions = initialSuggestions.filter(
    (s) => !dreamCos.some((c) => c.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <NeoCard className="p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#133255] uppercase tracking-wider mb-1">
              <Star className="w-4 h-4 text-[#D8B15B]" /> Proactive Representation
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              Dream Companies Tracker
            </h1>
            <p className="text-slate-500 text-xs mt-1 max-w-lg font-medium leading-relaxed">
              List up to 10 dream companies where you'd like to work. Our executive search team will make a best-effort outreach to represent your profile—at no charge.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            disabled={dreamCos.length >= 10}
            className="inline-flex items-center gap-2 bg-[#133255] hover:bg-[#1d4d82] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Company ({dreamCos.length}/10)
          </button>
        </div>
      </NeoCard>

      {/* Dream Companies Cards Grid */}
      {dreamCos.length === 0 ? (
        <NeoCard className="p-12 text-center text-slate-400 font-medium">
          <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-bold text-slate-600">No dream companies added yet.</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click "+ Add Company" or pick from the suggested companies below to start tracking representation status.
          </p>
        </NeoCard>
      ) : (
        <div className="space-y-4">
          {dreamCos.map((comp, index) => {
            const currentStatusKey = statusMap.get(comp.toLowerCase()) || "Not Started";
            const cfg = STATUS_CONFIG[currentStatusKey] || STATUS_CONFIG["Not Started"];
            const StatusIcon = cfg.icon;

            return (
              <NeoCard key={comp} className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-[#133255] shrink-0 text-sm"
                      style={{
                        background: "#eef2f7",
                        boxShadow: "inset 2px 2px 4px #cbd5e1, inset -2px -2px 4px #ffffff",
                      }}
                    >
                      #{index + 1}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 text-base truncate">
                        {comp}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.bgClass} ${cfg.colorClass} border ${cfg.borderClass}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                          · {cfg.subtext}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={removingCo === comp}
                    onClick={() => handleRemoveCompany(comp)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shrink-0"
                    title="Remove from dream list"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </NeoCard>
            );
          })}
        </div>
      )}

      {/* Suggested Companies Section */}
      {availableSuggestions.length > 0 && (
        <NeoCard className="p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Sparkles className="w-4 h-4 text-[#D8B15B]" /> Suggested for you based on your profile
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Similar companies matching your industry experience and aspirations:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {availableSuggestions.map((sug) => (
              <button
                key={sug}
                onClick={() => handleAddCompany(sug)}
                disabled={dreamCos.length >= 10}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#133255] bg-white border border-slate-200 hover:border-[#133255] hover:bg-indigo-50/50 transition-all cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5 text-[#D8B15B]" /> {sug}
              </button>
            ))}
          </div>
        </NeoCard>
      )}

      {/* Premium Representation Teaser Card */}
      <NeoCard className="p-7 text-center relative overflow-hidden border border-slate-200/50">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800">
            Premium Representation Program
          </span>
          <h3 className="text-slate-800 font-bold text-lg">
            Guaranteed Structured Target Outreach
          </h3>
          <p className="text-slate-500 text-xs font-medium leading-relaxed">
            Get guaranteed, structured outreach to 10 target companies with dedicated senior Mauna Kea consultant support and direct C-suite introductions.
          </p>
          <button
            onClick={() => toast.success("Premium representation details will be announced soon!")}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-all mt-2 cursor-pointer"
          >
            Learn More — Coming Soon <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </NeoCard>

      {/* Add Company Search Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-base text-[#133255] flex items-center gap-2">
                <Star className="w-4 h-4 text-[#D8B15B]" /> Add Dream Company
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search or enter company name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#133255] font-medium"
              />
            </div>

            {/* Quick Results List */}
            <div className="space-y-1 max-h-48 overflow-y-auto pt-1">
              {searchQuery && !masterClientNames.some((c) => c.toLowerCase() === searchQuery.trim().toLowerCase()) && (
                <button
                  onClick={() => handleAddCompany(searchQuery)}
                  disabled={isSubmitting}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-indigo-50/60 text-xs font-bold text-indigo-700 flex items-center justify-between border border-dashed border-indigo-200"
                >
                  <span>+ Add custom "{searchQuery}"</span>
                  <Plus className="w-4 h-4" />
                </button>
              )}

              {searchResults.map((name) => (
                <button
                  key={name}
                  onClick={() => handleAddCompany(name)}
                  disabled={isSubmitting}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-gray-100 text-xs font-semibold text-gray-800 flex items-center justify-between transition-colors"
                >
                  <span>{name}</span>
                  <Plus className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-400 font-medium">
              <span>{dreamCos.length} / 10 added</span>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-500 hover:text-gray-800 font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
