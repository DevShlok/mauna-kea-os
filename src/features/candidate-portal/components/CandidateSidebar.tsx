"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ClipboardList,
  User,
  Users,
  ShieldCheck,
  Briefcase,
  Star,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { label: "Home", href: "/candidate", icon: Home, exact: true },
  { label: "My Applications", href: "/candidate/applications", icon: ClipboardList },
  { label: "My Profile", href: "/candidate/profile", icon: User },
  { label: "My Consultants", href: "/candidate/consultants", icon: Users },
  { label: "Verification", href: "/candidate/verification", icon: ShieldCheck, skeleton: true },
  { label: "Jobs", href: "/candidate/jobs", icon: Briefcase, comingSoon: true },
  { label: "Dream Companies", href: "/candidate/dream-companies", icon: Star, comingSoon: true },
];

export function CandidateSidebar({
  userName = "User",
  unreadCount = 0,
}: {
  userName?: string;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "MK";

  useEffect(() => {
    const saved = localStorage.getItem("candidateSidebarCollapsed");
    if (saved) setIsCollapsed(saved === "true");
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      localStorage.setItem("candidateSidebarCollapsed", String(!prev));
      return !prev;
    });
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/sign-in";
  };

  return (
    <div
      className={`group relative h-screen transition-all duration-300 ease-in-out shrink-0 z-40 ${
        isCollapsed ? "w-[76px]" : "w-[270px]"
      }`}
    >
      <div
        className="absolute inset-0 flex flex-col overflow-y-auto"
        style={{
          background: "#e0e5ec",
          borderRight: "1px solid rgba(255,255,255,0.4)",
          boxShadow: "4px 0 16px rgba(163,177,198,0.2)",
        }}
      >
        {/* Logo */}
        <div
          className={`flex items-center p-5 pb-4 border-b border-slate-300/40 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <Link
            href="/candidate"
            className={`flex items-center gap-3 overflow-hidden ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <div
              className="text-white font-serif text-lg font-bold w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
              style={{
                background: "linear-gradient(135deg, #133255, #1d4d82)",
                boxShadow: "4px 4px 10px rgba(163,177,198,0.5), -4px -4px 10px rgba(255,255,255,0.8)",
              }}
            >
              MK
            </div>
            {!isCollapsed && (
              <div className="whitespace-nowrap">
                <span className="font-serif text-[16px] font-bold block leading-tight text-slate-800">
                  Mauna Kea
                </span>
                <span className="text-[11px] text-[#133255] tracking-wider block font-semibold">
                  CAREER PORTAL
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Nav Items */}
        <div className="flex-1 py-5 flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item, idx) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname?.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={idx}
                href={item.comingSoon ? "#" : item.href}
                onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-xl transition-all duration-200 group/item relative
                  ${isCollapsed ? "justify-center px-0 py-3" : "px-4 py-3"}
                  ${
                    item.comingSoon
                      ? "opacity-40 cursor-not-allowed"
                      : isActive
                      ? "text-[#133255]"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }
                `}
                style={
                  isActive && !item.comingSoon
                    ? {
                        background: "#e0e5ec",
                        boxShadow:
                          "inset 4px 4px 8px rgba(163,177,198,0.5), inset -4px -4px 8px rgba(255,255,255,0.8)",
                      }
                    : {}
                }
              >
                <Icon
                  className={`w-[19px] h-[19px] shrink-0 transition-colors ${
                    isActive ? "text-[#D8B15B]" : "text-current"
                  }`}
                />
                {!isCollapsed && (
                  <>
                    <span className="text-[14px] font-medium flex-1 tracking-wide">
                      {item.label}
                    </span>
                    {item.comingSoon && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-300/50 text-slate-500">
                        Soon
                      </span>
                    )}
                    {item.skeleton && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#133255]/10 text-[#133255]">
                        New
                      </span>
                    )}
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D8B15B] shrink-0" />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>

        {/* User Footer */}
        <div
          className={`p-4 border-t border-slate-300/40 flex items-center overflow-hidden ${
            isCollapsed ? "flex-col gap-4 justify-center" : "gap-3"
          }`}
          style={{
            background: "transparent",
          }}
        >
          <div
            className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-serif text-[14px] font-bold shrink-0 text-white"
            style={{
              background: "linear-gradient(135deg, #133255, #1d4d82)",
              boxShadow: "2px 2px 6px rgba(163,177,198,0.6)",
            }}
            title={isCollapsed ? userName : undefined}
          >
            {initials}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <span className="text-slate-800 text-[14px] font-semibold block truncate">
                {userName}
              </span>
              <span className="text-slate-500 text-[11px] block font-medium">Candidate</span>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="text-slate-400 hover:text-rose-500 transition-colors p-1 shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute top-1/2 -right-3.5 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 flex items-center justify-center cursor-pointer text-white"
        style={{
          background: "linear-gradient(135deg, #133255, #1d4d82)",
          boxShadow: "3px 3px 6px rgba(163,177,198,0.6)",
          border: "1.5px solid #e0e5ec",
        }}
        title={isCollapsed ? "Expand" : "Collapse"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
