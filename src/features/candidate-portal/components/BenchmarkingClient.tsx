"use client";

import React, { useState, useTransition } from "react";
import {
  TrendingUp,
  Search,
  Filter,
  DollarSign,
  BarChart3,
  AlertCircle,
  Sparkles,
  Info,
  Building2,
  MapPin,
  Briefcase,
  Loader2,
} from "lucide-react";
import { getBenchmarkAction, BenchmarkResult } from "@/actions/benchmarking";
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
  candId?: string;
  candidateName?: string;
  initialDesignation?: string;
  initialExp?: number;
  initialLocation?: string;
  initialBenchmark?: BenchmarkResult;
}

export function BenchmarkingClient({
  candId,
  candidateName = "Candidate",
  initialDesignation = "",
  initialExp = 8,
  initialLocation = "",
  initialBenchmark,
}: Props) {
  const [designation, setDesignation] = useState(initialDesignation);
  const [expMin, setExpMin] = useState<number>(Math.max(0, (initialExp || 8) - 3));
  const [expMax, setExpMax] = useState<number>((initialExp || 8) + 3);
  const [location, setLocation] = useState(initialLocation);

  const [benchmark, setBenchmark] = useState<BenchmarkResult | undefined>(initialBenchmark);
  const [isPending, startTransition] = useTransition();

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await getBenchmarkAction({
          candId,
          designation,
          expMin,
          expMax,
          location,
        });
        if (res.success) {
          setBenchmark(res);
        } else {
          toast.error(res.error || "Failed to calculate benchmark.");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to fetch benchmark.");
      }
    });
  };

  const candCtc = benchmark?.candidateCtc;
  const p25 = benchmark?.p25 || 0;
  const p50 = benchmark?.p50 || 0;
  const p75 = benchmark?.p75 || 0;
  const maxBarVal = Math.max(candCtc || 0, p75 * 1.25, 100);

  return (
    <div className="w-full space-[#eef2f7] font-sans pb-12">
      {/* Header Banner */}
      <NeoCard className="p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#133255]/10 text-[#133255] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Market Intelligence
            </div>
            <h1 className="text-3xl font-serif font-bold text-slate-800">
              Compensation Benchmarking
            </h1>
            <p className="text-slate-600 text-sm max-w-xl">
              Compare your current compensation against real executive placement data across industries, experience bands, and locations in India.
            </p>
          </div>
          {benchmark?.percentile !== undefined && !benchmark.insufficient && (
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 text-center shrink-0 shadow-sm">
              <div className="text-xs font-bold uppercase text-slate-400">Market Position</div>
              <div className="text-4xl font-extrabold text-[#133255] mt-1">
                {benchmark.percentile}
                <span className="text-lg font-normal text-slate-500">th</span>
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Percentile Rank</div>
            </div>
          )}
        </div>
      </NeoCard>

      {/* Filter Form */}
      <NeoCard className="p-6 mb-8">
        <form onSubmit={handleFilterSubmit} className="space-y-4">
          <div className="flex items-center gap-2 mb-2 font-bold text-slate-700 text-sm">
            <Filter className="w-4 h-4 text-[#133255]" /> Benchmark Filters
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Role / Designation
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. CFO, VP Finance"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#133255]/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Min Experience (Years)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={expMin}
                onChange={(e) => setExpMin(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#133255]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Max Experience (Years)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={expMax}
                onChange={(e) => setExpMax(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#133255]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Location (Optional)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Mumbai, Bangalore"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#133255]/50"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#133255] hover:bg-[#133255]/90 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {isPending ? "Calculating..." : "Apply Benchmark Filters"}
            </button>
          </div>
        </form>
      </NeoCard>

      {/* Benchmark Results */}
      {benchmark?.insufficient ? (
        <NeoCard className="p-10 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Insufficient Market Data</h3>
          <p className="text-slate-600 text-sm max-w-md mx-auto mt-1">
            We currently have fewer than 3 matching verified candidate records for this specific role and experience window ({benchmark.sampleSize} sample{benchmark.sampleSize !== 1 ? "s" : ""}).
          </p>
          <p className="text-xs text-slate-400 mt-3">
            Try broadening your experience band or clearing the location filter to see wider market statistics.
          </p>
        </NeoCard>
      ) : benchmark ? (
        <div className="space-y-8">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Your CTC</span>
              <span className="text-2xl font-bold text-[#133255] mt-1 block">
                {candCtc ? `₹${candCtc} Lakhs` : "Not provided"}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Profile Annual Base + Fixed</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">25th Percentile (P25)</span>
              <span className="text-2xl font-bold text-slate-700 mt-1 block">
                ₹{p25} Lakhs
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Lower tier boundary</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-[#133255]">
              <span className="text-xs font-bold text-[#133255] uppercase tracking-wider block">Median Market CTC (P50)</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                ₹{p50} Lakhs
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Market midpoint benchmark</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">75th Percentile (P75)</span>
              <span className="text-2xl font-bold text-slate-700 mt-1 block">
                ₹{p75} Lakhs
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Upper executive tier</span>
            </div>
          </div>

          {/* Visual Distribution Chart */}
          <NeoCard className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Compensation Distribution Bar</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Based on {benchmark.sampleSize} verified candidate placements in your cohort.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-[#133255]">
                  <span className="w-3 h-3 rounded-full bg-[#133255] inline-block" /> You
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" /> Peer Benchmarks
                </span>
              </div>
            </div>

            {/* Bars */}
            <div className="space-y-6">
              {/* P25 */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>25th Percentile (P25)</span>
                  <span>₹{p25} Lakhs</span>
                </div>
                <div className="w-full bg-slate-200/70 h-4 rounded-full overflow-hidden">
                  <div
                    className="bg-slate-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (p25 / maxBarVal) * 100)}%` }}
                  />
                </div>
              </div>

              {/* P50 */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                  <span>Median Market Benchmark (P50)</span>
                  <span className="text-[#133255] font-extrabold">₹{p50} Lakhs</span>
                </div>
                <div className="w-full bg-slate-200/70 h-4 rounded-full overflow-hidden">
                  <div
                    className="bg-[#133255] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (p50 / maxBarVal) * 100)}%` }}
                  />
                </div>
              </div>

              {/* P75 */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>75th Percentile (P75)</span>
                  <span>₹{p75} Lakhs</span>
                </div>
                <div className="w-full bg-slate-200/70 h-4 rounded-full overflow-hidden">
                  <div
                    className="bg-slate-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (p75 / maxBarVal) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Candidate CTC if provided */}
              {candCtc && (
                <div className="pt-2 border-t border-slate-200/60">
                  <div className="flex justify-between text-xs font-bold text-[#133255] mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#133255]" /> Your Recorded CTC ({candidateName})
                    </span>
                    <span className="text-emerald-700 font-extrabold">₹{candCtc} Lakhs</span>
                  </div>
                  <div className="w-full bg-emerald-100 h-5 rounded-full overflow-hidden border border-emerald-300">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (candCtc / maxBarVal) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Explanation Note */}
            <div className="mt-8 bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#133255] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800 mb-0.5">How is this calculated?</p>
                <p>
                  Mauna Kea OS continuously analyzes salary distributions across our executive search database. Amounts represent annual fixed CTC in Lakhs (INR). Benchmarks update dynamically as new candidates and mandates are added to the platform.
                </p>
              </div>
            </div>
          </NeoCard>
        </div>
      ) : null}
    </div>
  );
}
