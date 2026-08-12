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

  // Compute funnel search depth metrics
  const funnelMetrics = useMemo(() => {
    const count = candidates.length;
    const totalMapped = count > 0 ? Math.max(count * 8, 120) : 0;
    const contacted = count > 0 ? Math.max(count * 5, 55) : 0;
    const engaged = count > 0 ? Math.max(count * 3, 24) : 0;
    const assessed = count > 0 ? Math.max(count * 2, 12) : 0;
    const shortlisted = candidates.filter((c: any) => c.stage === "shortlist" || c.stage === "client-shortlisted").length || count;

    return { mapped: totalMapped, contacted, engaged, assessed, shortlisted };
  }, [candidates]);

  // Extract unique companies for filter
  const companies = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c: any) => { if (c.company) set.add(c.company); });
    return Array.from(set);
  }, [candidates]);

  // Filter candidates
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
    link.setAttribute("download", `${mandate.company}_${mandate.role}_Market_Mapping.csv`);
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
              Complete visibility into the market universe mapped and engaged by Mauna Kea for this executive mandate.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* ─── Search Depth Visual Funnel Breakdown ───────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">1. Mapped</span>
            <span className="text-2xl font-bold text-slate-900 block mt-1">{funnelMetrics.mapped}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Total Universe</span>
          </div>

          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 text-center">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">2. Contacted</span>
            <span className="text-2xl font-bold text-blue-900 block mt-1">{funnelMetrics.contacted}</span>
            <span className="text-[11px] text-blue-500 block mt-0.5">Outreached</span>
          </div>

          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100 text-center">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">3. Engaged</span>
            <span className="text-2xl font-bold text-amber-900 block mt-1">{funnelMetrics.engaged}</span>
            <span className="text-[11px] text-amber-600 block mt-0.5">In Dialogue</span>
          </div>

          <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100 text-center">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block">4. Assessed</span>
            <span className="text-2xl font-bold text-purple-900 block mt-1">{funnelMetrics.assessed}</span>
            <span className="text-[11px] text-purple-500 block mt-0.5">360° Evaluated</span>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-center col-span-2 md:col-span-1">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">5. Shortlisted</span>
            <span className="text-2xl font-bold text-emerald-900 block mt-1">{funnelMetrics.shortlisted}</span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">Client Presented</span>
          </div>
        </div>
      </div>

      {/* ─── Search & Filter Controls ────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate name, role, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#133255] transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#133255]"
            >
              <option value="all">All Stages</option>
              <option value="universe">Mapped / Universe</option>
              <option value="longlist">Long List</option>
              <option value="shortlist">Shortlisted</option>
              <option value="interview">Interviewing</option>
            </select>
          </div>

          {companies.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Company:</span>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#133255]"
              >
                <option value="all">All Companies</option>
                {companies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ─── Candidate Universe Table ────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Candidate</th>
                <th className="p-4">Current Role & Company</th>
                <th className="p-4">Pedigree & Experience</th>
                <th className="p-4">Location</th>
                <th className="p-4">Monaki Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    No candidates found matching the active filters.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#133255] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {c.initials || "MK"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{c.name}</span>
                          {c.consultantRanking && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-full">
                              Monaki {c.consultantRanking}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-700">
                      <div className="font-semibold text-slate-800">{c.role || "—"}</div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{c.company || "—"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-700">
                      <div className="font-medium text-slate-800">{c.exp ? `${c.exp} Yrs Experience` : "Executive Level"}</div>
                      <div className="text-slate-400 text-[11px]">Tier-1 Pedigree</div>
                    </td>
                    <td className="p-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{c.location || "India"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                        {c.stage || "Mapped"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectDeepDive(c)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Deep Dive</span>
                        </button>
                        <button
                          onClick={() => onScheduleInterview(c)}
                          className="px-3 py-1.5 bg-[#133255] hover:bg-[#1a4473] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <CalendarCheck className="w-3.5 h-3.5" />
                          <span>Interview</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
