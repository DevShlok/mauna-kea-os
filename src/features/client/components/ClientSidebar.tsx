"use client";

import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import {
  Home,
  Star,
  BarChart3,
  User,
  LogOut,
} from "lucide-react";

import { usePathname, useSearchParams } from "next/navigation";

type Props = {
  clientName: string;
};

export function ClientSidebar({ clientName }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  let activeTab = "dashboard";
  
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/sign-in';
  };

  if (pathname === "/client/mandates" && tab) {
    activeTab = tab;
  } else if (pathname.startsWith("/client/mandates/") || pathname.startsWith("/client/candidates/")) {
    activeTab = "dashboard";
  }

  const initials = clientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const navItems = [
    { key: "dashboard", icon: Home, label: "Dashboard", href: "/client/mandates" },
    { key: "shortlist", icon: Star, label: "Shortlist", href: "/client/mandates?tab=shortlist" },
    { key: "insights", icon: BarChart3, label: "Insights", href: "/client/mandates?tab=insights" },
    { key: "profile", icon: User, label: "Profile", href: "/client/mandates?tab=profile" },
  ];

  return (
    <div className="w-[260px] min-w-[260px] h-screen bg-[#0b1f3a] flex flex-col overflow-y-auto overflow-x-hidden shrink-0 text-white border-r border-[#D8B15B]">
      {/* ─── Logo ─── */}
      <Link
        href="/client/mandates"
        className="flex items-center gap-3 p-5 pb-4 border-b border-[#D8B15B] hover:bg-white/5 transition-colors"
      >
        <div className="bg-[#D8B15B] text-[#133255] font-serif text-lg font-bold w-10 h-10 flex items-center justify-center rounded">
          MK
        </div>
        <div>
          <span className="font-serif text-[16px] font-bold block leading-tight">
            Mauna Kea
          </span>
          <span className="text-[11px] text-white/55 tracking-wider block">
            CLIENT PORTAL
          </span>
        </div>
      </Link>

      {/* ─── Navigation ─── */}
      <div className="flex-1 py-4 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.key;

          if (item.href) {
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-3.5 transition-all duration-200 ${
                  isActive
                    ? "bg-white/12 text-white font-semibold border-l-[3px] border-[#D8B15B]"
                    : "text-white/55 hover:bg-white/5 hover:text-white border-l-[3px] border-transparent"
                }`}
              >
                <item.icon
                  className={`w-[19px] h-[19px] shrink-0 ${
                    isActive ? "text-[#D8B15B]" : ""
                  }`}
                />
                <span className="text-[14px] tracking-wide">{item.label}</span>
              </Link>
            );
          }
        })}
      </div>

      {/* ─── User Footer ─── */}
      <div className="mt-auto p-4 border-t border-white/10 flex items-center gap-3">
        <div className="w-[38px] h-[38px] bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center text-white text-[14px] font-bold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-white text-[14px] font-semibold block truncate">
            {clientName}
          </span>
          <span className="text-white/50 text-[11px] block">Client</span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-white/45 hover:text-white transition-colors p-1"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
