"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, Check } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getCandidateNotificationsAction, markCandidateNotificationsAsReadAction } from "@/actions/candidate-portal";
import type { CandidateNotification } from "@/db/schema";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/candidate": { title: "Home", subtitle: "Your career overview" },
  "/candidate/applications": { title: "My Applications", subtitle: "Track your interview journey" },
  "/candidate/profile": { title: "My Profile", subtitle: "Your professional snapshot" },
  "/candidate/consultants": { title: "My Consultants", subtitle: "Know your Mauna Kea team" },
  "/candidate/verification": { title: "Verification", subtitle: "Your verified credentials" },
  "/candidate/jobs": { title: "Jobs", subtitle: "Curated opportunities for you" },
  "/candidate/dream-companies": { title: "Dream Companies", subtitle: "Companies you aspire to join" },
};

export function CandidateTopbar({
  candId,
  userName,
}: {
  candId: string;
  userName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [notifications, setNotifications] = useState<CandidateNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Find page info
  const sortedKeys = Object.keys(PAGE_TITLES).sort((a, b) => b.length - a.length);
  const match = sortedKeys.find((key) => pathname?.startsWith(key));
  const { title, subtitle } = match ? PAGE_TITLES[match] : { title: "Portal", subtitle: "" };

  useEffect(() => {
    if (candId) {
      getCandidateNotificationsAction(candId).then(setNotifications);
    }
  }, [candId]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleBellClick = async () => {
    setShowNotifs((prev) => !prev);
    if (!showNotifs && unreadCount > 0) {
      await markCandidateNotificationsAsReadAction(candId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const typeIcon: Record<string, string> = {
    status_update: "📋",
    feedback_received: "✅",
    nudge_ack: "🔔",
    assessment_ready: "🔬",
  };

  return (
    <div
      className="h-[70px] flex items-center px-6 gap-4 shrink-0 relative"
      style={{
        background: "#e0e5ec",
        borderBottom: "1px solid rgba(255,255,255,0.4)",
        boxShadow: "0 4px 12px rgba(163,177,198,0.2)",
      }}
    >
      {/* Page title */}
      <div className="flex-1">
        <h1 className="font-serif text-[17px] font-bold text-slate-800 leading-tight">{title}</h1>
        <p className="text-[12px] text-slate-500">{subtitle}</p>
      </div>

      {/* Notification Bell */}
      <div className="relative">
        <button
          ref={bellRef}
          onClick={handleBellClick}
          className="relative w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 text-slate-500 hover:text-slate-800"
          style={{
            background: showNotifs ? "#d1d9e6" : "#e0e5ec",
            boxShadow: showNotifs 
              ? "inset 3px 3px 6px rgba(163,177,198,0.5), inset -3px -3px 6px rgba(255,255,255,0.8)"
              : "3px 3px 6px rgba(163,177,198,0.5), -3px -3px 6px rgba(255,255,255,0.8)",
          }}
        >
          <Bell className="w-[17px] h-[17px]" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center text-[10px] font-bold rounded-full text-white px-1"
              style={{ background: "linear-gradient(135deg, #e74c3c, #c0392b)", boxShadow: "2px 2px 4px rgba(163,177,198,0.5)" }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {showNotifs && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowNotifs(false)}
            />
            <div
              className="absolute right-0 top-11 w-80 z-50 rounded-2xl overflow-hidden"
              style={{
                background: "#e0e5ec",
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow: "10px 10px 20px rgba(163,177,198,0.4), -10px -10px 20px rgba(255,255,255,0.8)",
              }}
            >
              <div className="px-4 py-3 flex justify-between items-center border-b border-slate-300/40">
                <h3 className="font-bold text-[13px] text-slate-800">Notifications</h3>
                {unreadCount === 0 && (
                  <span className="text-[11px] text-slate-500">All caught up</span>
                )}
                <button
                  onClick={() => setShowNotifs(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-[13px] text-slate-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        setShowNotifs(false);
                        if (notif.link) router.push(notif.link);
                      }}
                      className={`px-4 py-3 border-b border-slate-300/30 last:border-b-0 cursor-pointer transition-all duration-150 hover:bg-white/50 ${
                        !notif.isRead ? "bg-slate-200/50" : ""
                      }`}
                    >
                      <div className="flex gap-2.5 items-start">
                        <span className="text-[16px] shrink-0 mt-0.5">
                          {typeIcon[notif.type ?? ""] ?? "📢"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-slate-700 leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                            {new Date(notif.createdAt!).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        {!notif.isRead && (
                          <div className="w-2 h-2 rounded-full bg-[#133255] shrink-0 mt-1.5" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Candidate badge */}
      <span
        className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
        style={{
          background: "rgba(139,92,246,0.1)",
          border: "1px solid rgba(139,92,246,0.2)",
          color: "#7c3aed",
          boxShadow: "inset 1px 1px 2px rgba(139,92,246,0.1)",
        }}
      >
        Candidate
      </span>
    </div>
  );
}
