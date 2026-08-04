"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getCandidateNotificationsAction, markCandidateNotificationsAsReadAction } from "@/actions/candidate-portal";
import type { CandidateNotification } from "@/db/schema";

function getPageInfo(pathname: string | null) {
  if (!pathname) return { title: "Home", subtitle: "Your career overview" };
  if (pathname.endsWith("/applications")) return { title: "My Applications", subtitle: "Track your interview journey" };
  if (pathname.endsWith("/profile")) return { title: "My Profile", subtitle: "Your professional snapshot" };
  if (pathname.endsWith("/consultants")) return { title: "My Consultants", subtitle: "Know your Mauna Kea team" };
  if (pathname.endsWith("/verification")) return { title: "Verification", subtitle: "Your verified credentials" };
  if (pathname.endsWith("/jobs")) return { title: "Jobs", subtitle: "Curated opportunities for you" };
  if (pathname.endsWith("/dream-companies")) return { title: "Dream Companies", subtitle: "Companies you aspire to join" };
  return { title: "Home", subtitle: "Your career overview" };
}

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

  const { title, subtitle } = getPageInfo(pathname);

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
      className="h-[76px] flex items-center px-6 gap-4 shrink-0 relative"
      style={{
        background: "linear-gradient(90deg, #133255 0%, #1a4270 100%)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex-1">
        <h1 className="font-serif text-[17px] font-bold text-white leading-tight">{title}</h1>
        <p className="text-[12px] text-[#D8B15B]/80 font-medium">{subtitle}</p>
      </div>

      <div className="relative">
        <button
          ref={bellRef}
          onClick={handleBellClick}
          className="relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 text-[#D8B15B] hover:text-white"
          style={{
            background: showNotifs ? "rgba(216,177,91,0.2)" : "rgba(255,255,255,0.08)",
            border: "1px solid rgba(216,177,91,0.25)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <Bell className="w-[17px] h-[17px]" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full text-white px-1 border-2 border-[#133255]"
              style={{ background: "linear-gradient(135deg, #e74c3c, #c0392b)", boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {showNotifs && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowNotifs(false)}
            />
            <div
              className="absolute right-0 top-11 w-80 z-50 rounded-2xl overflow-hidden"
              style={{
                background: "#0f2744",
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              }}
            >
              <div className="px-4 py-3 flex justify-between items-center border-b border-white/10">
                <h3 className="font-bold text-[13px] text-white">Notifications</h3>
                {unreadCount === 0 && (
                  <span className="text-[11px] text-white/50">All caught up</span>
                )}
                <button
                  onClick={() => setShowNotifs(false)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-[13px] text-white/50">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        setShowNotifs(false);
                        if (notif.link) router.push(notif.link);
                      }}
                      className={`px-4 py-3 border-b border-white/10 last:border-b-0 cursor-pointer transition-all duration-150 hover:bg-white/5 ${
                        !notif.isRead ? "bg-white/5" : ""
                      }`}
                    >
                      <div className="flex gap-2.5 items-start">
                        <span className="text-[16px] shrink-0 mt-0.5">
                          {typeIcon[notif.type ?? ""] ?? "📢"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-white/90 leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="text-[11px] text-[#D8B15B]/80 mt-1 block font-medium">
                            {new Date(notif.createdAt!).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        {!notif.isRead && (
                          <div className="w-2 h-2 rounded-full bg-[#D8B15B] shrink-0 mt-1.5" />
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

      <span
        className="px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-[#133255]"
        style={{
          background: "linear-gradient(135deg, #D8B15B, #f0c96a)",
          boxShadow: "0 2px 8px rgba(216,177,91,0.3)",
        }}
      >
        Candidate
      </span>
    </div>
  );
}
