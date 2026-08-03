"use client";

import { useState } from "react";
import type { Float } from "@/db/schema";
import { nudgeConsultantAction } from "@/actions/candidate-portal";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
  Send,
  Bell,
  XCircle,
  Trophy,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  TrendingUp,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Stage Configuration ─────────────────────────────────────────────────────
type StageKey = "Shared" | "Under Review" | "Shortlisted" | "Interviewing" | "Decision";

const STAGES: { key: string; label: string }[] = [
  { key: "Shared", label: "Profile Shared" },
  { key: "Under Review", label: "Under Review" },
  { key: "Shortlisted", label: "Shortlisted" },
  { key: "Interviewing", label: "Interviewing" },
  { key: "Decision", label: "Decision" },
];

const TERMINAL_POSITIVE = ["Hired"];
const TERMINAL_NEGATIVE = ["Rejected"];
const TERMINAL = [...TERMINAL_POSITIVE, ...TERMINAL_NEGATIVE];

function getStageIndex(status: string | null): number {
  if (!status) return 0;
  if (status === "Hired") return 5;
  if (status === "Rejected") return -1;
  return Math.max(0, STAGES.findIndex((s) => s.key === status));
}

function canNudge(float: Float): boolean {
  if (TERMINAL.includes(float.status ?? "")) return false;
  const created = float.createdAt ? new Date(float.createdAt).getTime() : 0;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const twoDays = 2 * 24 * 60 * 60 * 1000;
  if (Date.now() - created < sevenDays) return false;
  if (float.nudgeSentAt) {
    const nudgeSent = new Date(float.nudgeSentAt).getTime();
    if (Date.now() - nudgeSent < twoDays) return false;
  }
  return true;
}

function NeoCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl relative overflow-hidden ${className}`}
      style={{
        background: "#e0e5ec",
        boxShadow: "9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)",
      }}
    >
      {children}
    </div>
  );
}

// ─── Stage Progress Bar ──────────────────────────────────────────────────────
function StageBar({ status }: { status: string | null }) {
  const idx = getStageIndex(status);
  const isRejected = status === "Rejected";
  const isHired = status === "Hired";

  return (
    <div className="flex items-center gap-1.5 mt-2">
      {STAGES.map((stage, i) => {
        const isComplete = !isRejected && i < idx;
        const isCurrent = !isRejected && i === idx && !isHired;
        const isHiredFinal = isHired && i <= 4;
        return (
          <div key={stage.key} className="flex items-center gap-1.5 flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className="w-2.5 h-2.5 rounded-full transition-all duration-500 relative"
                style={{
                  background:
                    isRejected && i <= idx
                      ? "#ef4444"
                      : isComplete || isHiredFinal
                      ? "#10b981"
                      : isCurrent
                      ? "#133255"
                      : "#c8d0e0",
                  boxShadow:
                    isCurrent
                      ? "0 0 8px rgba(19,50,85,0.7)"
                      : isComplete || isHiredFinal
                      ? "0 0 6px rgba(16,185,129,0.5)"
                      : "inset 1px 1px 2px rgba(163,177,198,0.5)",
                }}
              >
                {isCurrent && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-[#133255]/40" />
                )}
              </div>
              <span
                className="text-[9px] text-center font-bold leading-tight w-16"
                style={{
                  color:
                    isRejected && i <= idx
                      ? "#ef4444"
                      : isComplete || isHiredFinal
                      ? "#10b981"
                      : isCurrent
                      ? "#133255"
                      : "#94a3b8",
                }}
              >
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className="h-px flex-1 -mt-4 transition-all duration-700"
                style={{
                  background:
                    isRejected
                      ? "rgba(239,68,68,0.2)"
                      : i < idx - 1 || (isHired && i < 4)
                      ? "rgba(16,185,129,0.4)"
                      : "rgba(163,177,198,0.4)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Application Card ────────────────────────────────────────────────────────
function ApplicationCard({ float, candId }: { float: Float; candId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [nudging, setNudging] = useState(false);
  const [nudged, setNudged] = useState(
    float.nudgeSentAt
      ? Date.now() - new Date(float.nudgeSentAt).getTime() < 2 * 24 * 60 * 60 * 1000
      : false
  );

  const isRejected = float.status === "Rejected";
  const isHired = float.status === "Hired";
  const isTerminal = TERMINAL.includes(float.status ?? "");
  const hasFeedback = float.feedbackPositives || float.feedbackImprovements || float.feedbackNextSteps;
  const nudgeAllowed = canNudge(float);

  const handleNudge = async () => {
    setNudging(true);
    try {
      await nudgeConsultantAction(float.id);
      setNudged(true);
      toast.success("Your consultant has been notified!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setNudging(false);
    }
  };

  return (
    <NeoCard
      className={`p-5 transition-all duration-300 ${
        isHired
          ? "ring-1 ring-emerald-500/30"
          : isRejected
          ? "opacity-70"
          : ""
      }`}
    >
      {/* Hired glow */}
      {isHired && (
        <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-[15px] shrink-0"
          style={{
            background: "linear-gradient(135deg, #133255, #1d4d82)",
            boxShadow: "2px 2px 5px rgba(163,177,198,0.5)",
          }}
        >
          {(float.client || "?").charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-slate-800 font-bold text-[15px] truncate">
              {float.client || "Confidential Company"}
            </h3>
            {isHired && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                <Trophy className="w-3 h-3" /> Hired
              </span>
            )}
            {isRejected && (
              <span className="text-[11px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                Closed
              </span>
            )}
          </div>
          <p className="text-slate-500 font-medium text-[13px]">{float.role || "Role not specified"}</p>
          <div className="flex items-center gap-3 mt-1 text-[12px] text-slate-400 font-medium">
            {float.dateShared && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {float.dateShared}
              </span>
            )}
            {float.interviewDate && (
              <span className="flex items-center gap-1 text-purple-500">
                <CheckCircle2 className="w-3 h-3" /> Interview: {float.interviewDate}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition-all shrink-0"
          style={{ background: "#e0e5ec", boxShadow: "2px 2px 4px rgba(163,177,198,0.4), -2px -2px 4px rgba(255,255,255,0.6)" }}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Stage Bar */}
      <div className="mt-4">
        <StageBar status={float.status} />
      </div>

      {/* Expandable: Feedback + Nudge */}
      {expanded && (
        <div className="mt-4 flex flex-col gap-3">
          {/* Feedback Section */}
          {hasFeedback ? (
            <div
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{
                background: "#e0e5ec",
                boxShadow: "inset 2px 2px 5px rgba(163,177,198,0.5), inset -2px -2px 5px rgba(255,255,255,0.7)",
              }}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#133255]" />
                <span className="text-[13px] font-bold text-slate-700">Interview Feedback</span>
              </div>

              {float.feedbackPositives && (
                <div className="flex gap-2.5">
                  <ThumbsUp className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
                      Strengths
                    </p>
                    <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
                      {float.feedbackPositives}
                    </p>
                  </div>
                </div>
              )}

              {float.feedbackImprovements && (
                <div className="flex gap-2.5">
                  <TrendingUp className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">
                      Areas to Grow
                    </p>
                    <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
                      {float.feedbackImprovements}
                    </p>
                  </div>
                </div>
              )}

              {float.feedbackNextSteps && (
                <div className="flex gap-2.5">
                  <Lightbulb className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                      Next Steps
                    </p>
                    <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
                      {float.feedbackNextSteps}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            !isTerminal && (
              <div
                className="rounded-xl p-3.5 flex items-center gap-3 text-[13px] text-slate-500 font-medium"
                style={{ background: "#e0e5ec", boxShadow: "inset 2px 2px 5px rgba(163,177,198,0.5), inset -2px -2px 5px rgba(255,255,255,0.7)" }}
              >
                <MessageSquare className="w-4 h-4 shrink-0 opacity-50" />
                Feedback will appear here once received from the client.
              </div>
            )
          )}

          {/* Nudge Button */}
          {!isTerminal && (
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-slate-400 font-medium">
                {nudgeAllowed ? "Haven't heard back? Prompt your consultant." : ""}
              </p>
              {nudged ? (
                <span className="flex items-center gap-1.5 text-[12px] text-emerald-500 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Request sent
                </span>
              ) : nudgeAllowed ? (
                <button
                  onClick={handleNudge}
                  disabled={nudging}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 disabled:opacity-50 hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #133255, #1d4d82)",
                    color: "white",
                    boxShadow: nudging ? "none" : "3px 3px 6px rgba(163,177,198,0.5)",
                  }}
                >
                  <Bell className="w-3.5 h-3.5" />
                  {nudging ? "Sending..." : "Nudge Consultant"}
                </button>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Quick expand hint if not expanded */}
      {!expanded && hasFeedback && (
        <div
          className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-emerald-500 cursor-pointer hover:text-emerald-600 transition-colors"
          onClick={() => setExpanded(true)}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Feedback available — tap to view
          <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </NeoCard>
  );
}

// ─── Main Applications Client ────────────────────────────────────────────────
export function ApplicationsClient({
  floats: myFloats,
  candId,
}: {
  floats: Float[];
  candId: string;
}) {
  const active = myFloats.filter((f) => !TERMINAL.includes(f.status ?? ""));
  const closed = myFloats.filter((f) => TERMINAL.includes(f.status ?? ""));

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-800 text-[22px] font-bold">My Applications</h2>
          <p className="text-slate-500 font-medium text-[14px] mt-0.5">
            {myFloats.length === 0
              ? "No applications yet"
              : `${active.length} active · ${closed.length} closed`}
          </p>
        </div>
        <div
          className="px-3 py-1.5 rounded-full text-[13px] font-bold text-slate-600"
          style={{
            background: "#e0e5ec",
            boxShadow: "inset 2px 2px 4px rgba(163,177,198,0.5), inset -2px -2px 4px rgba(255,255,255,0.7)",
          }}
        >
          {myFloats.length} Total
        </div>
      </div>

      {myFloats.length === 0 ? (
        <div
          className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
          style={{
            background: "#e0e5ec",
            boxShadow: "inset 3px 3px 6px rgba(163,177,198,0.5), inset -3px -3px 6px rgba(255,255,255,0.7)",
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "#e0e5ec", boxShadow: "4px 4px 8px rgba(163,177,198,0.5), -4px -4px 8px rgba(255,255,255,0.7)" }}
          >
            <Send className="w-8 h-8 text-[#133255]" />
          </div>
          <h3 className="text-slate-800 text-[17px] font-bold mb-2">No applications yet</h3>
          <p className="text-slate-500 font-medium text-[14px] max-w-xs">
            Your profile will appear here when your consultant shares it with a potential employer.
          </p>
        </div>
      ) : (
        <>
          {/* Active Applications */}
          {active.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                Active
              </p>
              {active.map((f) => (
                <ApplicationCard key={f.id} float={f} candId={candId} />
              ))}
            </div>
          )}

          {/* Closed */}
          {closed.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                Closed
              </p>
              {closed.map((f) => (
                <ApplicationCard key={f.id} float={f} candId={candId} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
