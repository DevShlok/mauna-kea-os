"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  BrainCircuit,
  Database,
  LogOut,
  Building2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Shield,
  Trash2,
  PhoneCall,
  Briefcase
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";

export function Sidebar({ userRole = "candidate", linkedClientId, linkedCandidateId, userName = "User" }: { userRole?: string; linkedClientId?: string; linkedCandidateId?: string; userName?: string; }) {
  const pathname = usePathname();

  const fullName = userName;
  const initials = fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "MK";

  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved) setIsCollapsed(saved === "true");
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      localStorage.setItem("sidebarCollapsed", String(!prev));
      return !prev;
    });
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/sign-in';
  };

  const handleMouseEnter = (title: string) => setHoveredCategory(title);
  const handleMouseLeave = () => setHoveredCategory(null);

  const categories = [
    {
      title: "Clients",
      icon: Building2,
      visibleTo: ["admin", "consultant", "client"],
      children: [
        { label: "Client Database", href: "/dashboard/clients", visibleTo: ["admin", "consultant", "client"] },
        { label: "Add Client", href: "/dashboard/clients/new", icon: Plus, visibleTo: ["admin", "consultant", "client"] },
        { label: "Mandates", href: "/dashboard/mandates", visibleTo: ["admin", "consultant", "client"] },
        { label: "Add Mandate", href: "/dashboard/mandates/new", icon: Plus, visibleTo: ["admin", "consultant", "client"] },
      ]
    },
    {
      title: "Candidates",
      icon: Database,
      visibleTo: ["admin", "consultant", "candidate"],
      children: [
        { label: "Candidate Database", href: "/dashboard/candidates", visibleTo: ["admin", "consultant", "candidate"] },
        { label: "Add Candidate", href: "/dashboard/candidates/new", icon: Plus, visibleTo: ["admin", "consultant", "candidate"] },
        { label: "Float List", href: "/dashboard/float-list", visibleTo: ["admin", "consultant"] },
        { label: "Add to Float List", href: "/dashboard/candidates?mode=float", icon: Plus, visibleTo: ["admin", "consultant"] },
        { label: "Submissions", href: "/dashboard/float-list/submissions", visibleTo: ["admin", "consultant"] },
        { label: "Job Curation Feed", href: "/dashboard/candidate-jobs", icon: Briefcase, visibleTo: ["admin", "consultant"] },
      ]
    },
    {
      title: "Engagement Lists",
      icon: PhoneCall,
      visibleTo: ["admin", "consultant"],
      children: [
        { label: "My Engagement Lists", href: "/dashboard/calls", visibleTo: ["admin", "consultant"] },
        { label: "Weekly Planning", href: "/dashboard/calls/planning", visibleTo: ["admin", "consultant"] },
      ]
    },
    {
      title: "Productivity Tools",
      icon: BrainCircuit,
      visibleTo: ["admin", "consultant", "client"],
      children: [
        { label: "AI Workbench", href: "/dashboard/workbench", visibleTo: ["admin", "consultant", "client"] },
        { label: "Frameworks", href: "/dashboard/frameworks", visibleTo: ["admin", "consultant"] },
        { label: "Add Frameworks", href: "/dashboard/frameworks/new", icon: Plus, visibleTo: ["admin", "consultant"] },
      ]
    },
    {
      title: "Team",
      icon: Users,
      visibleTo: ["admin", "consultant"],
      children: [
        { label: "Team Status", href: "/dashboard/team/status", visibleTo: ["admin", "consultant"] },
        { label: "Time & Leave", href: "/dashboard/team/time-leave", visibleTo: ["admin", "consultant"] },
        { label: "Leave Approvals", href: "/dashboard/team/leave-approvals", visibleTo: ["admin", "consultant"] },
      ]
    },
    {
      title: "Admin",
      icon: Shield,
      visibleTo: ["admin"],
      children: [
        { label: "Users", href: "/dashboard/admin/users", visibleTo: ["admin"] },
        { label: "Add a User", href: "/dashboard/admin/users/new", icon: Plus, visibleTo: ["admin"] },
        { label: "Master Data", href: "/dashboard/admin/master-data", visibleTo: ["admin"] },
        { label: "Recycle Bin", href: "/dashboard/admin/recycle-bin", icon: Trash2, visibleTo: ["admin"] },
      ]
    }
  ];

  return (
    <div className={`group relative h-screen shrink-0 z-40 ${isCollapsed ? "w-[76px]" : "w-[270px]"}`} style={{ transition: 'width 280ms cubic-bezier(0.4, 0, 0.2, 1)', willChange: 'width' }}>
      <div
        className={`absolute inset-0 flex flex-col overflow-y-auto text-white border-r border-white/10 ${isCollapsed ? 'overflow-x-visible' : 'overflow-x-hidden'}`}
        style={{ background: "linear-gradient(180deg, #133255 0%, #0b1f36 100%)", boxShadow: "4px 0 20px rgba(0,0,0,0.18)" }}
      >
        {/* Logo */}
        <div className={`h-[76px] flex items-center px-5 border-b border-white/10 hover:bg-white/5 transition-colors ${isCollapsed ? "justify-center" : ""}`}>
          <Link href="/dashboard" className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? "justify-center" : ""}`}>
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
                <span className="font-serif text-[16px] font-bold block leading-tight text-white">Mauna Kea</span>
                <span className="text-[11px] text-[#D8B15B] tracking-wider block font-bold">EXECUTIVE SEARCH OS</span>
              </div>
            )}
          </Link>
        </div>

        <div className="flex-1 py-4 flex flex-col gap-0.5 px-3">
          {categories.filter(cat => cat.visibleTo.includes(userRole)).map((category, idx) => {
            const isHovered = hoveredCategory === category.title;
            const isActive = category.children.some(child => pathname?.startsWith(child.href) && child.href !== "/dashboard");
            const isExpanded = isHovered || isActive;
            const isHighlighted = isHovered || isActive;

            const visibleChildren = category.children.filter(child => child.visibleTo.includes(userRole));

            if (visibleChildren.length === 0) return null;

            return (
              <div
                key={idx}
                className="flex flex-col"
                onMouseEnter={() => handleMouseEnter(category.title)}
                onMouseLeave={handleMouseLeave}
              >
                <div
                  className={`flex items-center gap-3 py-3 cursor-pointer rounded-xl mx-0 ${
                    isHighlighted
                      ? "text-white font-semibold"
                      : "text-white/65 hover:text-white"
                  } ${isCollapsed ? "px-0 justify-center" : "px-3"}`}
                  style={
                    isHighlighted
                      ? {
                          background: "rgba(216,177,91,0.12)",
                          border: "1px solid rgba(216,177,91,0.25)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                          transition: 'color 150ms ease, background 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
                        }
                      : { border: "1px solid transparent", transition: 'color 150ms ease, background 150ms ease, border-color 150ms ease, box-shadow 150ms ease' }
                  }
                  onClick={() => {
                    if (isCollapsed) setIsCollapsed(false);
                  }}
                  title={isCollapsed ? category.title : undefined}
                >
                  <category.icon className={`w-[19px] h-[19px] shrink-0 transition-colors ${isHighlighted ? "text-[#D8B15B]" : ""}`} />
                  {!isCollapsed && (
                    <>
                      <span className="text-[14px] flex-1 tracking-wide">{category.title}</span>
                      <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-90 text-[#D8B15B]" : "text-white/30"}`} />
                    </>
                  )}
                </div>

                {!isCollapsed && (
                  <div
                    style={{
                      overflow: 'hidden',
                      maxHeight: isExpanded ? `${visibleChildren.length * 44}px` : '0px',
                      opacity: isExpanded ? 1 : 0,
                      transition: 'max-height 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms cubic-bezier(0.4, 0, 0.2, 1)',
                      willChange: 'max-height, opacity',
                    }}
                  >
                    <div className="flex flex-col py-1 pl-3">
                    {visibleChildren.map((child, childIdx) => {
                      const isChildActive = pathname === child.href;
                      return (
                        <Link
                          key={childIdx}
                          href={child.href}
                          className={`flex items-center gap-2.5 pl-8 pr-4 py-2.5 text-[13px] rounded-lg ${
                            isChildActive
                              ? "text-[#D8B15B] font-bold bg-[#D8B15B]/10 border border-[#D8B15B]/20"
                              : "text-white/55 hover:text-white hover:bg-white/5 border border-transparent"
                          }`}
                          style={{
                            transform: isExpanded ? 'translateX(0)' : 'translateX(-8px)',
                            opacity: isExpanded ? 1 : 0,
                            transition: `transform 220ms cubic-bezier(0.4, 0, 0.2, 1) ${isExpanded ? childIdx * 25 : 0}ms, opacity 200ms ease ${isExpanded ? childIdx * 25 : 0}ms`,
                            willChange: 'transform, opacity',
                          }}
                        >
                          {child.icon && <child.icon className="w-3.5 h-3.5 shrink-0 opacity-70" />}
                          <span>{child.label}</span>
                          {isChildActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D8B15B] shrink-0" />}
                        </Link>
                      );
                    })}
                    </div>
                  </div>
                )}

                {/* Flyout for collapsed state */}
                {isCollapsed && isHovered && (
                  <div
                    className="absolute left-[76px] ml-2 top-0 mt-2 w-56 py-2 z-50 rounded-2xl overflow-hidden"
                    style={{
                      background: "linear-gradient(180deg, #1a3d6b 0%, #0f2744 100%)",
                      border: "1px solid rgba(216,177,91,0.3)",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
                    }}
                  >
                    <div className="px-4 py-2 font-bold text-[#D8B15B] border-b border-white/10 mb-1 text-[11px] uppercase tracking-widest">{category.title}</div>
                    <div className="flex flex-col px-2">
                      {visibleChildren.map((child, childIdx) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={childIdx}
                            href={child.href}
                            className={`flex items-center gap-2.5 px-3 py-2.5 text-[13px] transition-colors rounded-xl ${
                              isChildActive ? "bg-white/10 text-white font-medium" : "text-white/60 hover:bg-white/8 hover:text-white"
                            }`}
                          >
                            {child.icon && <child.icon className="w-3.5 h-3.5 shrink-0" />}
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* User Footer */}
        <div className={`mt-auto p-4 border-t border-white/10 flex items-center overflow-hidden ${isCollapsed ? "flex-col gap-4 justify-center" : "gap-3"}`}>
          <div
            className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-serif text-[15px] font-bold shrink-0 text-[#133255]"
            style={{
              background: "linear-gradient(135deg, #D8B15B, #f0c96a)",
              boxShadow: "0 2px 8px rgba(216,177,91,0.3)",
            }}
            title={isCollapsed ? fullName : undefined}
          >
            {initials}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <span className="text-white text-[14px] font-semibold block truncate">{fullName}</span>
              <span className="text-[#D8B15B]/80 text-[11px] block capitalize font-medium">{userRole}</span>
            </div>
          )}
          <button onClick={handleSignOut} className="text-white/40 hover:text-rose-400 transition-colors p-1 shrink-0" title="Sign Out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute top-1/2 -right-3.5 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 flex items-center justify-center cursor-pointer text-[#133255]"
        style={{
          background: "linear-gradient(135deg, #D8B15B, #f0c96a)",
          boxShadow: "0 4px 10px rgba(0,0,0,0.3), 0 0 0 2px #133255",
        }}
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
