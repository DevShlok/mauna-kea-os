"use client";

import { useState, useEffect } from "react";
import {
  Clock, CalendarCheck, CheckCircle2, XCircle, AlertCircle, HelpCircle,
  Star, Eye, FileDown, ChevronRight, Activity, Loader2,
} from "lucide-react";
import { getCandidateActivityLogAction } from "@/actions/client-command-centre";

interface CandidateActivityTimelineProps {
  mandateCandidateId: number;
  className?: string;
}

type LogEntry = {
  id: number;
  actionType: string;
  description: string;
  previousState: string | null;
  newState: string | null;
  performedBy: string | null;
  performedByRole: string | null;
  performedAt: Date | string | null;
};

function getEventIcon(actionType: string) {
  if (actionType.includes("interview_scheduled")) return { icon: CalendarCheck, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
  if (actionType.includes("interview_feedback")) return { icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" };
  if (actionType.includes("reject")) return { icon: XCircle, color: "text-rose-600", bg: "bg-rose-50 border-rose-200" };
  if (actionType.includes("hold")) return { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
  if (actionType.includes("more_info")) return { icon: HelpCircle, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" };
  if (actionType.includes("ranking")) return { icon: Star, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" };
  if (actionType.includes("visible") || actionType.includes("profile_view")) return { icon: Eye, color: "text-slate-600", bg: "bg-slate-100 border-slate-200" };
  if (actionType.includes("download")) return { icon: FileDown, color: "text-slate-600", bg: "bg-slate-100 border-slate-200" };
  return { icon: Activity, color: "text-slate-500", bg: "bg-slate-100 border-slate-200" };
}

function formatRelativeTime(dateInput: Date | string | null): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 2) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatRoleLabel(role: string | null) {
  if (!role) return "";
  const map: Record<string, string> = {
    admin: "Mauna Kea (Admin)",
    consultant: "Mauna Kea Consultant",
    client: "Client",
  };
  return map[role] || role;
}

function StateTransition({ prev, next }: { prev: string | null; next: string | null }) {
  if (!prev && !next) return null;
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
      {prev && <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-medium">{prev}</span>}
      {prev && next && <ChevronRight className="w-3 h-3 shrink-0" />}
      {next && <span className="px-1.5 py-0.5 bg-[#133255]/8 text-[#133255] rounded font-medium">{next}</span>}
    </div>
  );
}

export default function CandidateActivityTimeline({
  mandateCandidateId,
  className = "",
}: CandidateActivityTimelineProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mandateCandidateId) { setLoading(false); return; }
    getCandidateActivityLogAction(mandateCandidateId)
      .then((data) => {
        setLogs(data as LogEntry[]);
        setLoading(false);
      })
      .catch((e) => {
        setError("Could not load activity history.");
        setLoading(false);
      });
  }, [mandateCandidateId]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-10 gap-2 text-slate-400 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Loading activity...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 ${className}`}>
        {error}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className={`py-10 flex flex-col items-center gap-3 text-slate-400 ${className}`}>
        <Activity className="w-8 h-8 opacity-40" />
        <p className="text-xs font-medium">No activity recorded yet.</p>
        <p className="text-[11px] text-slate-400 max-w-xs text-center">
          Actions like ranking changes, interview scheduling, and client decisions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-0 ${className}`}>
      {logs.map((log, idx) => {
        const { icon: Icon, color, bg } = getEventIcon(log.actionType);
        const isLast = idx === logs.length - 1;

        return (
          <div key={log.id} className="flex gap-3 relative">
            {/* Timeline connector line */}
            {!isLast && (
              <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-100" />
            )}

            {/* Icon Bubble */}
            <div className={`relative z-10 w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${bg}`}>
              <Icon className={`w-3.5 h-3.5 ${color}`} />
            </div>

            {/* Content */}
            <div className={`flex-1 pb-5 ${isLast ? "" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-slate-900 leading-tight">{log.description}</p>
                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 mt-0.5">
                  {formatRelativeTime(log.performedAt)}
                </span>
              </div>

              <StateTransition prev={log.previousState} next={log.newState} />

              {log.performedBy && (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  by <span className="font-medium text-slate-600">{log.performedBy}</span>
                  {log.performedByRole && (
                    <span className="text-slate-400"> · {formatRoleLabel(log.performedByRole)}</span>
                  )}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
