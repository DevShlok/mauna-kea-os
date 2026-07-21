"use client";

import { useState, useEffect } from "react";
import { Search, Bell, X } from "lucide-react";
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

  return (
    <div className="h-[77px] bg-[#0b1f3a] border-b border-[#133255] flex items-center px-6 gap-4 shrink-0 shadow-sm text-white">
      <div className="flex-1">
        <span className="font-serif text-base font-bold text-white block">{title}</span>
        <span className="text-[12px] text-white/60 block">{subtitle}</span>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
        <input 
          type="text" 
          placeholder="Search candidates..." 
          onKeyDown={handleSearch}
          className="w-[200px] h-[34px] border border-white/20 rounded-full pl-9 pr-3 text-[14px] text-white outline-none transition-all focus:border-white focus:w-[240px] bg-white/10 placeholder-white/50"
        />
      </div>



      <div className="relative">
        <button 
          onClick={handleNotificationsClick}
          className="relative w-[34px] h-[34px] flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 transition-colors"
        >
          <Bell className="w-[18px] h-[18px]" />
          {notifications.some(n => !n.isRead) && (
            <div className="absolute top-[5px] right-[5px] w-2 h-2 bg-[#C0392B] rounded-full border-2 border-[#0b1f3a]"></div>
          )}
        </button>

        {showNotifications && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
            <div className="absolute right-0 top-11 bg-white rounded-xl shadow-xl border border-gray-100 w-80 z-50 overflow-hidden flex flex-col text-gray-900">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-[14px]">Notifications</h3>
                <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">No new notifications</div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      onClick={() => {
                        setShowNotifications(false);
                        if (notif.link) router.push(notif.link);
                      }}
                      className={`px-4 py-3 border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50 ${notif.isRead ? 'bg-white' : 'bg-indigo-50/30'}`}
                    >
                      <p className="text-[13px] text-gray-800 leading-relaxed">{notif.message}</p>
                      <span className="text-[11px] text-gray-400 mt-1 block">{new Date(notif.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {(userRole === 'admin' || userRole === 'consultant') && (
        <div className="mr-2">
          {clockStatus === 'Loading' ? (
            <div className="w-[100px] h-[30px] bg-white/10 animate-pulse rounded-full" />
          ) : clockStatus === 'On Break' ? (
            <button onClick={handleBreakToggle} className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Return to Work
            </button>
          ) : (
            <button onClick={handleBreakToggle} className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-full transition-colors">
              Take a Break
            </button>
          )}
        </div>
      )}

      {userRole === "admin" && (
        <span className="px-2.5 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider bg-[#fde8e8] text-[#C0392B]">
          Admin
        </span>
      )}
      {userRole === "consultant" && (
        <span className="px-2.5 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
          Consultant
        </span>
      )}
      {userRole === "client" && (
        <span className="px-2.5 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider bg-green-100 text-green-800">
          Client
        </span>
      )}
      {userRole === "candidate" && (
        <span className="px-2.5 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
          Candidate
        </span>
      )}
    </div>
  );
}
