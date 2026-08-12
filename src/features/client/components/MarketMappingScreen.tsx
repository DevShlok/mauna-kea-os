"use client";

import { useState, useMemo } from "react";
import {
  Compass,
  Search,
  Filter,
  Download,
  Building2,
  MapPin,
  Briefcase,
  Award,
  ChevronRight,
  UserCheck,
  Eye,
  CalendarCheck,
} from "lucide-react";

interface MarketMappingScreenProps {
  mandate: any;
  onSelectDeepDive: (candidate: any) => void;
  onScheduleInterview: (candidate: any) => void;
}

export default function MarketMappingScreen({
  mandate,
  onSelectDeepDive,
  onScheduleInterview,
}: MarketMappingScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");

  const candidates = mandate?.candidates || [];

  // Compute actual database stage metrics
  const funnelMetrics = useMemo(() => {
    const totalMapped = mandate?.mappedCount ?? candidates.length;
    const contacted = mandate?.contactedCount ?? candidates.filter((c: any) => ["contacted", "engaged", "assessed", "shortlist", "client-shortlisted", "interviewing"].includes(c.stage)).length;
    const engaged = mandate?.engagedCount ?? candidates.filter((c: any) => ["engaged", "assessed", "shortlist", "client-shortlisted", "interviewing"].includes(c.stage)).length;
    const assessed = mandate?.assessedCount ?? candidates.filter((c: any) => ["assessed", "shortlist", "client-shortlisted", "interviewing"].includes(c.stage)).length;
    const shortlisted = mandate?.shortlistedCount ?? candidates.filter((c: any) => ["shortlist", "client-shortlisted"].includes(c.stage)).length;

    return { mapped: totalMapped, contacted, engaged, assessed, shortlisted };
  }, [mandate, candidates]);

  // Extract unique companies dynamically
  const companies = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c: any) => { if (c.company) set.add(c.company); });
    return Array.from(set);
  }, [candidates]);

  // Filter candidates dynamically
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c: any) => {
      const matchesSearch = !searchQuery ||
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || (c.stage || "universe") === statusFilter;
      const matchesCompany = companyFilter === "all" || c.company === companyFilter;

      return matchesSearch && matchesStatus && matchesCompany;
    });
  }, [candidates, searchQuery, statusFilter, companyFilter]);

  const handleExportCSV = () => {
    const headers = ["Candidate Name", "Current Company", "Designation", "Experience (Yrs)", "Location", "Monaki Status"];
    const rows = filteredCandidates.map((c: any) => [
      `"${c.name || ""}"`,
      `"${c.company || ""}"`,
      `"${c.role || ""}"`,
      c.exp || "-",
      `"${c.location || ""}"`,
      `"${c.stage || "Mapped"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${mandate.company || "Mandate"}_${mandate.role || "Search"}_Market_Mapping.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ─── Search Depth & Funnel Header Card ───────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#D8B15B]" />
              <h2 className="text-lg font-bold text-slate-900">1. Market Mapping / Talent Universe</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Search depth transparency: visual representation of executive coverage across candidate mapping and engagement.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* ─── 5-Step Visual Funnel Metrics ───────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "1. Mapped", value: funnelMetrics.mapped, desc: "Identified Talent" },
            { label: "2. Contacted", value: funnelMetrics.contacted, desc: "Outreach Done" },
            { label: "3. Engaged", value: funnelMetrics.engaged, desc: "Screened / Interested" },
            { label: "4. Assessed", value: funnelMetrics.assessed, desc: "Deep Evaluated" },
            { label: "5. Shortlisted", value: funnelMetrics.shortlisted, desc: "Client Presented" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between"
            >
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</div>
              <div className="text-2xl font-bold text-[#133255] my-1">{item.value}</div>
              <div className="text-[11px] text-slate-500 font-medium">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Filters & Search Controls ───────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate by name, company, or designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#133255] focus:bg-white transition-all text-slate-900"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-600">Company:</span>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-bold outline-none cursor-pointer"
            >
              <option value="all">All ({companies.length})</option>
              {companies.map((comp) => (
                <option key={comp} value={comp}>{comp}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
            <span className="font-bold text-slate-600">Stage:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-bold outline-none cursor-pointer capitalize"
            >
              <option value="all">All Stages</option>
              <option value="universe">Mapped / Universe</option>
              <option value="engaged">Engaged</option>
              <option value="shortlist">Shortlisted</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Candidate Universe Grid ────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Candidate Universe Records ({filteredCandidates.length})</span>
          <span className="text-slate-400 font-normal">Showing filtered subset</span>
        </div>

        {filteredCandidates.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No candidates match the selected filters or search terms.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCandidates.map((c: any) => (
              <div
                key={c.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#133255] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    {c.initials || "MK"}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold rounded-full capitalize">
                        {c.stage || "Mapped"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        {c.role || "Executive Leader"}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {c.company || mandate.company}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {c.location || "India"}
                      </span>
                    </div>
                    {c.comments && (
                      <p className="text-xs text-slate-500 italic mt-1 bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                        "{c.comments}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => onSelectDeepDive(c)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Deep Dive</span>
                  </button>
                  <button
                    onClick={() => onScheduleInterview(c)}
                    className="px-3.5 py-2 bg-[#133255] hover:bg-[#1a4473] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <CalendarCheck className="w-3.5 h-3.5 text-[#D8B15B]" />
                    <span>Decision / Interview</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
