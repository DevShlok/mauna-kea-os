"use client";

import { useState, useEffect } from "react";
import { Search, Bell, X, Coffee, Monitor } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { getConsultantNotificationsAction, markConsultantNotificationsAsReadAction } from "@/actions";

export function Topbar({ userRole = "candidate" }: { userRole?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [clockStatus, setClockStatus] = useState("Loading");
  useEffect(() => {
    if (userRole === 'consultant' || userRole === 'admin') {
      getConsultantNotificationsAction().then(setNotifications);
      
      const fetchStatus = () => {
        fetch('/api/time-logs')
          .then(res => res.json())
          .then(data => {
            if (data.success && data.status) {
              setClockStatus(data.status === 'On Break' ? 'On Break' : 'Active');
            } else {
              setClockStatus('Active');
            }
          })
          .catch(() => setClockStatus('Active'));
      };

      fetchStatus();

      window.addEventListener('break_status_changed', fetchStatus);
      return () => window.removeEventListener('break_status_changed', fetchStatus);
    }
  }, [userRole]);

  const handleBreakToggle = async () => {
    const action = clockStatus === 'On Break' ? 'break_end' : 'break_start';
    setClockStatus("Loading");
    try {
      const res = await fetch('/api/time-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        setClockStatus(action === 'break_start' ? 'On Break' : 'Active');
        window.dispatchEvent(new Event('break_status_changed'));
      }
    } catch (error) {
      console.error(error);
      setClockStatus("Active");
    }
  };

  const handleNotificationsClick = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && notifications.some(n => !n.isRead)) {
      await markConsultantNotificationsAsReadAction();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/sign-in');
    router.refresh();
  };

  const getPageInfo = (path: string | null) => {
    if (!path || path === "/dashboard") return { title: "Dashboard", subtitle: "Welcome back" };
    
    const map: Record<string, { title: string, subtitle: string }> = {
      "/dashboard/clients/new": { title: "Clients", subtitle: "Add Client" },
      "/dashboard/clients": { title: "Clients", subtitle: "Client Database" },
      "/dashboard/mandates/new": { title: "Clients", subtitle: "Add Mandate" },
      "/dashboard/mandates": { title: "Clients", subtitle: "Mandates" },
      "/dashboard/candidates/new": { title: "Candidates", subtitle: "Add Candidate" },
      "/dashboard/candidates": { title: "Candidates", subtitle: "Candidate Database" },
      "/dashboard/calls": { title: "Productivity Tools", subtitle: "Engagement Lists" },
      "/dashboard/float-list/submissions": { title: "Candidates", subtitle: "Submissions" },
      "/dashboard/candidate-jobs": { title: "Candidates", subtitle: "Curated Jobs Feed" },
      "/dashboard/float-list": { title: "Candidates", subtitle: "Float List" },
      "/dashboard/workbench": { title: "Productivity Tools", subtitle: "AI Workbench" },
      "/dashboard/frameworks": { title: "Productivity Tools", subtitle: "Frameworks" },
      "/dashboard/team/status": { title: "Team", subtitle: "Team Status" },
      "/dashboard/team/leave-approvals": { title: "Team", subtitle: "Leave Approvals" },
      "/dashboard/team/time-leave": { title: "Team", subtitle: "Time & Leave" },
      "/dashboard/admin/users/new": { title: "Admin", subtitle: "Add a User" },
      "/dashboard/admin/users": { title: "Admin", subtitle: "Users" },
      "/dashboard/admin/master-data": { title: "Admin", subtitle: "Master Data" },
      "/dashboard/admin/recycle-bin": { title: "Admin", subtitle: "Recycle Bin" },
    };

    // Sort by length descending to match most specific route first
    const match = Object.keys(map).sort((a,b) => b.length - a.length).find(route => path.startsWith(route));
    return match ? map[match] : { title: "Dashboard", subtitle: "" };
  };

  const { title, subtitle } = getPageInfo(pathname);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = e.currentTarget.value;
      if (q.trim()) {
        router.push(`/dashboard/candidates?search=${encodeURIComponent(q.trim())}`);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div
      className="h-[76px] flex items-center px-6 gap-4 shrink-0 text-white"
      style={{
        background: "linear-gradient(90deg, #133255 0%, #1a4270 100%)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Page Title */}
      <div className="flex-1">
        <span className="font-serif text-[17px] font-bold text-white block leading-tight">{title}</span>
        <span className="text-[12px] text-[#D8B15B]/80 block font-medium">{subtitle}</span>
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
        <input 
          type="text" 
          placeholder="Search candidates..." 
          onKeyDown={handleSearch}
          className="w-[200px] h-[38px] rounded-full pl-9 pr-4 text-[13px] text-white outline-none transition-all duration-200 focus:w-[260px] placeholder-white/40 focus:ring-1 focus:ring-[#D8B15B]/50"
          style={{ background: 'rgba(255,255,255,0.1)', boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.2), inset -1px -1px 4px rgba(255,255,255,0.06)' }}
        />
      </div>

      {/* Break Toggle */}
      {(userRole === 'admin' || userRole === 'consultant') && (
        <div>
          {clockStatus === 'Loading' ? (
            <div className="w-[110px] h-[32px] rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.12)' }} />
          ) : clockStatus === 'On Break' ? (
            <button
              onClick={handleBreakToggle}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #d97706, #b45309)", boxShadow: "0 2px 8px rgba(217,119,6,0.4)" }}
            >
              <span className="w-1.5 h-1.5 bg-white rounded-full neo-status-active" />
              Return to Work
            </button>
          ) : (
            <button
              onClick={handleBreakToggle}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold text-white/80 hover:text-white transition-all hover:bg-white/10"
              style={{ border: "1px solid rgba(255,255,255,0.18)" }}
            >
              <Coffee className="w-3.5 h-3.5" />
              Take a Break
            </button>
          )}
        </div>
      )}

      {/* Notifications */}
      <div className="relative">
        <button 
          onClick={handleNotificationsClick}
          className="relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200"
          style={{
            background: showNotifications ? "rgba(216,177,91,0.2)" : "rgba(255,255,255,0.1)",
            border: "1px solid rgba(216,177,91,0.25)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <Bell className="w-[17px] h-[17px] text-[#D8B15B]" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full text-white px-1 border-2 border-[#133255]"
              style={{ background: "linear-gradient(135deg, #e74c3c, #c0392b)", boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
            <div
              className="absolute right-0 top-12 w-80 z-50 rounded-2xl overflow-hidden"
              style={{
                background: "#0f2744",
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              }}
            >
              <div className="px-4 py-3 flex justify-between items-center border-b border-white/10">
                <h3 className="font-bold text-[13px] text-white">Notifications</h3>
                {unreadCount === 0 && <span className="text-[11px] text-white/50">All caught up</span>}
                <button onClick={() => setShowNotifications(false)} className="text-white/40 hover:text-white transition-colors ml-auto">
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
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        setShowNotifications(false);
                        if (notif.link) router.push(notif.link);
                      }}
                      className={`px-4 py-3 border-b border-white/10 last:border-b-0 cursor-pointer transition-all duration-150 hover:bg-white/5 ${!notif.isRead ? "border-l-2 border-l-[#D8B15B] bg-white/5" : ""}`}
                    >
                      <p className="text-[13px] text-white/90 leading-relaxed">{notif.message}</p>
                      <span className="text-[11px] text-[#D8B15B]/80 mt-1 block font-medium">
                        {new Date(notif.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Role Badge */}
      {userRole === "admin" && (
        <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
          style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }}>
          Admin
        </span>
      )}
      {userRole === "consultant" && (
        <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
          style={{ background: "rgba(96,165,250,0.2)", color: "#93c5fd", border: "1px solid rgba(96,165,250,0.25)" }}>
          Consultant
        </span>
      )}
      {userRole === "client" && (
        <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
          style={{ background: "rgba(52,211,153,0.2)", color: "#6ee7b7", border: "1px solid rgba(52,211,153,0.25)" }}>
          Client
        </span>
      )}
    </div>
  );
}
