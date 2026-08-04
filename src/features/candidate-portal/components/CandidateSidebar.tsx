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
  candidateSlug = "",
}: {
  userName?: string;
  unreadCount?: number;
  candidateSlug?: string;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const prefix = candidateSlug ? `/${candidateSlug}` : "/candidate";

  const navItems = [
    { label: "Home", href: prefix, icon: Home, exact: true },
    { label: "My Applications", href: `${prefix}/applications`, icon: ClipboardList },
    { label: "My Profile", href: `${prefix}/profile`, icon: User },
    { label: "My Consultants", href: `${prefix}/consultants`, icon: Users },
    { label: "Verification", href: `${prefix}/verification`, icon: ShieldCheck, skeleton: true },
    { label: "Jobs", href: `${prefix}/jobs`, icon: Briefcase, comingSoon: true },
    { label: "Dream Companies", href: `${prefix}/dream-companies`, icon: Star, comingSoon: true },
  ];

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
          background: "linear-gradient(180deg, #133255 0%, #0b1f36 100%)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "4px 0 20px rgba(0,0,0,0.15)",
        }}
      >
        {/* Logo */}
        <div
          className={`h-[76px] flex items-center px-5 border-b border-white/10 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <Link
            href={prefix}
            className={`flex items-center gap-3 overflow-hidden ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <div
              className="text-[#133255] font-serif text-lg font-bold w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
              style={{
                background: "linear-gradient(135deg, #D8B15B, #f0c96a)",
                boxShadow: "0 4px 14px rgba(216,177,91,0.35)",
              }}
            >
              MK
            </div>
            {!isCollapsed && (
              <div className="whitespace-nowrap">
                <span className="font-serif text-[16px] font-bold block leading-tight text-white">
                  Mauna Kea
                </span>
                <span className="text-[11px] text-[#D8B15B] tracking-wider block font-bold">
                  CAREER PORTAL
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Nav Items */}
        <div className="flex-1 py-5 flex flex-col gap-1.5 px-3">
          {navItems.map((item, idx) => {
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
                className={`flex items-center gap-3 rounded-xl transition-all duration-200 group/item relative font-medium
                  ${isCollapsed ? "justify-center px-0 py-3" : "px-4 py-3"}
                  ${
                    item.comingSoon
                      ? "opacity-40 cursor-not-allowed text-white/50"
                      : isActive
                      ? "text-white font-bold"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }
                `}
                style={
                  isActive && !item.comingSoon
                    ? {
                        background: "rgba(216,177,91,0.15)",
                        border: "1px solid rgba(216,177,91,0.3)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                      }
                    : {}
                }
              >
                <Icon
                  className={`w-[19px] h-[19px] shrink-0 transition-colors ${
                    isActive ? "text-[#D8B15B]" : "text-white/60 group-hover/item:text-white"
                  }`}
                />
                {!isCollapsed && (
                  <>
                    <span className="text-[14px] flex-1 tracking-wide">
                      {item.label}
                    </span>
                    {item.comingSoon && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/10 text-white/40">
                        Soon
                      </span>
                    )}
                    {item.skeleton && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#D8B15B]/20 text-[#D8B15B]">
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
          className={`p-4 border-t border-white/10 flex items-center overflow-hidden ${
            isCollapsed ? "flex-col gap-4 justify-center" : "gap-3"
          }`}
        >
          <div
            className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-serif text-[14px] font-bold shrink-0 text-[#133255]"
            style={{
              background: "linear-gradient(135deg, #D8B15B, #f0c96a)",
              boxShadow: "0 2px 8px rgba(216,177,91,0.3)",
            }}
            title={isCollapsed ? userName : undefined}
          >
            {initials}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <span className="text-white text-[14px] font-semibold block truncate">
                {userName}
              </span>
              <span className="text-[#D8B15B]/80 text-[11px] block font-medium">Candidate</span>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="text-white/40 hover:text-rose-400 transition-colors p-1 shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute top-1/2 -right-3.5 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 flex items-center justify-center cursor-pointer text-[#133255]"
        style={{
          background: "linear-gradient(135deg, #D8B15B, #f0c96a)",
          boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          border: "2px solid #133255",
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
