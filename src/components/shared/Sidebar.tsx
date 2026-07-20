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
  PanelLeftClose,
  PanelLeftOpen,
  PhoneCall
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
    <div className={`group relative h-screen transition-all duration-300 ease-in-out shrink-0 z-40 ${isCollapsed ? "w-[76px]" : "w-[270px]"}`}>
      <div className="absolute inset-0 bg-[#0b1f3a] flex flex-col overflow-y-auto overflow-x-hidden text-white border-r border-[#D8B15B]">
        <div className={`flex items-center p-5 pb-4 border-b border-[#D8B15B] hover:bg-white/5 transition-colors ${isCollapsed ? "justify-center" : ""}`}>
          <Link href="/dashboard" className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? "justify-center" : ""}`}>
            <div className="bg-[#D8B15B] text-[#133255] font-serif text-lg font-bold w-10 h-10 flex items-center justify-center rounded shrink-0">MK</div>
            {!isCollapsed && (
              <div className="whitespace-nowrap">
                <span className="font-serif text-[16px] font-bold block leading-tight">Mauna Kea</span>
                <span className="text-[11px] text-white/55 tracking-wider block">EXECUTIVE SEARCH OS</span>
              </div>
            )}
          </Link>
        </div>

      <div className="flex-1 py-4 flex flex-col gap-1">
        {categories.filter(cat => cat.visibleTo.includes(userRole)).map((category, idx) => {
          const isHovered = hoveredCategory === category.title;
          const isActive = category.children.some(child => pathname?.startsWith(child.href) && child.href !== "/dashboard");
          const isExpanded = isHovered;
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
                className={`flex items-center gap-3 py-3.5 cursor-pointer transition-all duration-200 ${
                  isHighlighted 
                    ? "bg-white/12 text-white font-semibold border-l-[3px] border-[#D8B15B] scale-[1.02]" 
                    : "text-white/70 hover:bg-white/5 hover:text-white border-l-[3px] border-transparent"
                } ${isCollapsed ? "px-0 justify-center" : "px-5"}`}
                onClick={() => {
                  if (isCollapsed) setIsCollapsed(false);
                }}
                title={isCollapsed ? category.title : undefined}
              >
                <category.icon className={`w-[19px] h-[19px] shrink-0 ${isHighlighted ? "text-[#D8B15B]" : ""}`} />
                {!isCollapsed && (
                  <>
                    <span className="text-[15px] flex-1 tracking-wide">{category.title}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-90 text-white" : "text-white/30"}`} />
                  </>
                )}
              </div>
              
              {!isCollapsed && (
                <div 
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                <div className="overflow-hidden min-h-0 flex flex-col bg-[#06152a]/50">
                  <div className="flex flex-col py-1">
                  {visibleChildren.map((child, childIdx) => {
                    const isChildActive = pathname === child.href;
                    return (
                      <Link
                        key={childIdx}
                        href={child.href}
                        className={`flex items-center gap-2.5 pr-5 py-2.5 text-[14px] transition-all duration-200
                          ${isChildActive ? "text-[#D8B15B] font-semibold border-l-[3px] border-[#D8B15B] pl-[45px] bg-white/5" : "text-white/60 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent pl-[45px]"}
                        `}
                        style={{
                          transform: isExpanded ? "translateX(0)" : "translateX(-8px)",
                          opacity: isExpanded ? 1 : 0,
                          transitionDelay: isExpanded ? `${childIdx * 30}ms` : "0ms"
                        }}
                      >
                        {child.icon && <child.icon className="w-4 h-4 shrink-0 opacity-70" />}
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                  </div>
                </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={`mt-auto p-4 border-t border-white/10 flex items-center overflow-hidden ${isCollapsed ? "flex-col gap-4 justify-center" : "gap-3"}`}>
        <div className="w-[38px] h-[38px] bg-[#D8B15B] text-[#133255] rounded-full flex items-center justify-center font-serif text-[15px] font-bold shrink-0" title={isCollapsed ? fullName : undefined}>
          {initials}
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <span className="text-white text-[15px] font-semibold block truncate">{fullName}</span>
            <span className="text-white/50 text-[12px] block capitalize">{userRole}</span>
          </div>
        )}
        <button onClick={handleSignOut} className="text-white/45 hover:text-white transition-colors p-1 shrink-0" title="Sign Out">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
      </div>
      
      {/* Floating Toggle Button */}
      <button 
        onClick={toggleSidebar} 
        className="absolute top-1/2 -right-3.5 -translate-y-1/2 bg-[#D8B15B] text-[#133255] p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 flex items-center justify-center cursor-pointer border border-[#133255]"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );
}
