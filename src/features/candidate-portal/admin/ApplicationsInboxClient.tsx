"use client";

import { useState, useTransition } from "react";
import { updateApplicationStatusAction } from "@/actions/candidate-portal";
import { Users, Clock, ChevronDown, CheckCircle2, Search } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  "Profile Submitted",
  "Under Review",
  "Shortlisted",
  "Closed",
];

const STATUS_STYLES: Record<string, string> = {
  "Profile Submitted": "bg-blue-100 text-blue-800",
  "Under Review":      "bg-amber-100 text-amber-800",
  "Shortlisted":       "bg-emerald-100 text-emerald-700",
  "Closed":            "bg-slate-200 text-slate-500",
};

interface Application {
  id: number;
  candId: string;
  jobId: number | null;
  status: string | null;
  appliedAt: Date | null;
  candidateName: string | null;
  candidateCompany: string | null;
  jobTitle: string | null;
}

interface Props {
  applications: Application[];
}

export default function ApplicationsInboxClient({ applications: initial }: Props) {
  const [apps, setApps] = useState(initial);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const handleStatusChange = (appId: number, newStatus: string) => {
    // Optimistic update
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
    setOpenDropdown(null);
    startTransition(async () => {
      try {
        await updateApplicationStatusAction(appId, newStatus);
        toast.success(`Status updated to: ${newStatus}`);
      } catch {
        toast.error("Failed to update status. Please try again.");
      }
    });
  };

  const filtered = apps.filter((app) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (app.candidateName || "").toLowerCase().includes(q) ||
      (app.jobTitle || "").toLowerCase().includes(q) ||
      (app.candidateCompany || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#133255] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-[#133255] font-serif">
              Self-Apply Inbox
            </h2>
            <p className="text-slate-500 text-[12px] font-medium">
              {apps.length} application{apps.length !== 1 ? "s" : ""} received
            </p>
          </div>
        </div>

        {/* Search */}
        {apps.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search candidate or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs text-slate-700 bg-transparent focus:outline-none placeholder:text-slate-400 font-medium w-full"
            />
          </div>
        )}
      </div>

      {/* Empty state */}
      {apps.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <Clock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-600 text-[14px]">No applications yet</p>
          <p className="text-[12px] text-slate-400 mt-1 max-w-xs mx-auto">
            When candidates click &quot;Apply Now&quot; on job cards, their applications will appear here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500 text-sm font-medium">No results match your search.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-[13px]">
            <thead className="bg-[#133255]/5 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                  Applied For
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Candidate */}
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800 text-[13px]">
                      {app.candidateName || app.candId}
                    </p>
                    {app.candidateCompany && (
                      <p className="text-slate-400 text-[11px] mt-0.5">{app.candidateCompany}</p>
                    )}
                    {/* Mobile: show job title inline */}
                    <p className="text-slate-500 text-[11px] mt-0.5 sm:hidden">
                      {app.jobTitle || `Job #${app.jobId}`}
                    </p>
                  </td>

                  {/* Job Title */}
                  <td className="px-4 py-3.5 text-slate-700 font-medium hidden sm:table-cell">
                    {app.jobTitle || `Job #${app.jobId}`}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3.5 text-slate-500 text-[12px] hidden md:table-cell">
                    {app.appliedAt
                      ? new Date(app.appliedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>

                  {/* Status + Dropdown */}
                  <td className="px-4 py-3.5">
                    <div className="relative inline-block">
                      <button
                        onClick={() =>
                          setOpenDropdown(openDropdown === app.id ? null : app.id)
                        }
                        disabled={isPending}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all hover:opacity-80 ${
                          STATUS_STYLES[app.status || ""] || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {app.status || "Profile Submitted"}
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {openDropdown === app.id && (
                        <>
                          {/* Backdrop to close */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenDropdown(null)}
                          />
                          <div className="absolute left-0 top-full mt-1.5 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-[170px]">
                            {STATUS_OPTIONS.map((s) => (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(app.id, s)}
                                className={`w-full text-left px-4 py-2.5 text-[12px] font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                                  app.status === s
                                    ? "text-[#133255] bg-[#133255]/5"
                                    : "text-slate-700"
                                }`}
                              >
                                {app.status === s && (
                                  <CheckCircle2 className="w-3 h-3 text-[#133255] shrink-0" />
                                )}
                                <span className={app.status === s ? "ml-0" : "ml-[15px]"}>{s}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
