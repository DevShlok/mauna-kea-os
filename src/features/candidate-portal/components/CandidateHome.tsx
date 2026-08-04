"use client";

import { useRouter } from "next/navigation";
import type { Float, Candidate, CandidateNotification } from "@/db/schema";
import {
  Send,
  Clock,
  CalendarCheck,
  MessageSquare,
  ArrowRight,
  Building2,
  ChevronRight,
  TrendingUp,
  Bell,
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  Shared: { label: "Profile Shared", color: "text-blue-400", dot: "bg-blue-400" },
  "Under Review": { label: "Under Review", color: "text-amber-400", dot: "bg-amber-400" },
  Shortlisted: { label: "Shortlisted", color: "text-emerald-400", dot: "bg-emerald-400" },
  Interviewing: { label: "Interview Scheduled", color: "text-purple-400", dot: "bg-purple-400" },
  Rejected: { label: "Closed", color: "text-rose-400/70", dot: "bg-rose-400" },
  Hired: { label: "Hired 🎉", color: "text-emerald-400", dot: "bg-emerald-400" },
};

function NeoCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`neo-card relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  glow,
  onClick,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
  glow: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`neo-card-sm p-5 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 ${onClick ? "cursor-pointer hover:-translate-y-1" : ""}`}
    >
      {/* Decorative glow orb */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-30 blur-xl"
        style={{ background: color }}
      />
      <div
        className="w-11 h-11 neo-inset flex items-center justify-center relative z-10"
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="relative z-10">
        <div className="text-3xl font-bold text-slate-800 font-mono">{value}</div>
        <div className="text-[13px] text-slate-500 mt-0.5 font-medium">{label}</div>
      </div>
    </div>
  );
}

export function CandidateHome({
  candidate,
  recentFloats,
  stats,
  recentNotifs,
  candidateSlug = "",
}: {
  candidate: any;
  recentFloats: Float[];
  stats: {
    totalShared: number;
    awaiting: number;
    interviewing: number;
    feedbackAvailable: number;
  };
  recentNotifs: CandidateNotification[];
  candidateSlug?: string;
}) {
  const router = useRouter();
  const prefix = candidateSlug ? `/${candidateSlug}` : "/candidate";

  const initials = candidate?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "MK";

  const greeting = (() => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* ─── Welcome Header ────────────────────────────────────────── */}
      <NeoCard className="p-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          {candidate?.profilePic ? (
            <img
              src={candidate.profilePic}
              alt={candidate.name}
              className="w-16 h-16 rounded-2xl object-cover shrink-0"
              style={{ border: "2px solid #e0e5ec", boxShadow: "4px 4px 8px rgba(163,177,198,0.5)" }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-serif text-xl font-bold shrink-0"
              style={{
                background: "linear-gradient(135deg, #133255, #1d4d82)",
                boxShadow: "4px 4px 10px rgba(163,177,198,0.5), -4px -4px 10px rgba(255,255,255,0.8)",
              }}
            >
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[#133255] text-[13px] font-bold">{greeting}</p>
            <h2 className="text-slate-800 text-[22px] font-bold leading-tight truncate">
              {candidate?.name || "Welcome"}
            </h2>
            {candidate?.designation && candidate?.company && (
              <p className="text-slate-600 text-[14px] mt-0.5 flex items-center gap-1.5 font-medium">
                <Building2 className="w-3.5 h-3.5" />
                {candidate.designation} · {candidate.company}
              </p>
            )}
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1">
            <div
              className="px-3 py-1.5 rounded-full text-[12px] font-bold shadow-sm"
              style={{
                background: "#e0e5ec",
                color: "#133255",
                boxShadow: "inset 2px 2px 4px rgba(163,177,198,0.5), inset -2px -2px 4px rgba(255,255,255,0.8)",
              }}
            >
              Active Profile
            </div>
            <p className="text-slate-500 text-[11px] font-medium">Managed by Mauna Kea</p>
          </div>
        </div>
      </NeoCard>

      {/* ─── Stats Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Profiles Shared"
          value={stats.totalShared}
          icon={Send}
          color="#60a5fa"
          glow="rgba(96,165,250,0.08)"
          onClick={() => router.push(`${prefix}/applications`)}
        />
        <StatCard
          label="Awaiting Response"
          value={stats.awaiting}
          icon={Clock}
          color="#fbbf24"
          glow="rgba(251,191,36,0.08)"
          onClick={() => router.push(`${prefix}/applications`)}
        />
        <StatCard
          label="Interviews Active"
          value={stats.interviewing}
          icon={CalendarCheck}
          color="#a78bfa"
          glow="rgba(167,139,250,0.08)"
          onClick={() => router.push(`${prefix}/applications`)}
        />
        <StatCard
          label="Feedback Ready"
          value={stats.feedbackAvailable}
          icon={MessageSquare}
          color="#34d399"
          glow="rgba(52,211,153,0.08)"
          onClick={() => router.push(`${prefix}/applications`)}
        />
      </div>

      {/* ─── Bottom Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent Activity */}
        <NeoCard className="lg:col-span-3 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#133255]" />
              <h3 className="text-slate-800 font-semibold text-[15px]">Recent Activity</h3>
            </div>
            <button
              onClick={() => router.push(`${prefix}/applications`)}
              className="text-slate-500 hover:text-[#133255] transition-colors text-[12px] flex items-center gap-1 font-medium"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentFloats.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <Send className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-500 text-[13px] font-medium">No applications yet</p>
              <p className="text-slate-400 text-[12px] mt-1">
                Your consultant will share your profile when opportunities arise
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentFloats.map((f) => {
                const s = STATUS_MAP[f.status ?? ""] || {
                  label: f.status || "—",
                  color: "text-slate-500",
                  dot: "bg-slate-400",
                };
                return (
                  <div
                    key={f.id}
                    onClick={() => router.push("/candidate/applications")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group/item hover:-translate-y-0.5 neo-card-sm"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[12px] font-bold text-white shadow-sm"
                      style={{
                        background: "linear-gradient(135deg, #133255, #1d4d82)",
                      }}
                    >
                      {(f.client || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 text-[13px] font-semibold truncate">{f.client}</p>
                      <p className="text-slate-500 text-[11px] truncate">{f.role}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      <span className={`text-[11px] font-medium ${s.color}`}>{s.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover/item:text-slate-500 transition-colors" />
                  </div>
                );
              })}
            </div>
          )}
        </NeoCard>

        {/* Notifications */}
        <NeoCard className="lg:col-span-2 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#133255]" />
            <h3 className="text-slate-800 font-semibold text-[15px]">Notifications</h3>
          </div>

          {recentNotifs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <Bell className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-500 text-[13px] font-medium">No notifications yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentNotifs.map((n) => (
                <div
                  key={n.id}
                  className={`px-3 py-2.5 rounded-xl text-[12px] leading-relaxed transition-all neo-card-sm`}
                  style={{
                    opacity: !n.isRead ? 1 : 0.75
                  }}
                >
                  <p className="text-slate-700 font-medium">{n.message}</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    {new Date(n.createdAt!).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </NeoCard>
      </div>
    </div>
  );
}
