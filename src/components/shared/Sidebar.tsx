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
  Briefcase,
  Scale,
  Receipt,
  BarChart3,
  ShieldCheck,
  FileText,
  Banknote
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";

export function Sidebar({ userRole = "candidate", linkedClientId, linkedCandidateId, userName = "User" }: { userRole?: string; linkedClientId?: string; linkedCandidateId?: string; userName?: string; }) {
  const pathname = usePathname();

  const fullName = userName;
  const initials = fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "MK";

  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Explicit click-toggle state alongside hover auto-open
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedSubGroups, setExpandedSubGroups] = useState<Record<string, boolean>>({});

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

  interface NavChild {
    label: string;
    href: string;
    icon?: any;
    visibleTo: string[];
  }

  interface NavGroup {
    header: string;
    icon: any;
    items: NavChild[];
  }

  interface NavCategory {
    title: string;
    icon: any;
    visibleTo: string[];
    children?: NavChild[];
    groups?: NavGroup[];
  }

  const categories: NavCategory[] = [
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
      title: "Legal & Finance",
      icon: Scale,
      visibleTo: ["admin", "consultant", "finance"],
      groups: [
        {
          header: "Contracts",
          icon: FileText,
          items: [
            { label: "Contract Repository", href: "/dashboard/legal-finance/contracts", visibleTo: ["admin", "consultant", "finance"] },
            { label: "Create New Contract", href: "/dashboard/legal-finance/contracts/new", icon: Plus, visibleTo: ["admin", "consultant", "finance"] },
            { label: "Contract Templates", href: "/dashboard/legal-finance/contracts/templates", visibleTo: ["admin", "finance"] },
            { label: "Renewals", href: "/dashboard/legal-finance/contracts?tab=Expiring", visibleTo: ["admin", "consultant", "finance"] },
          ]
        },
        {
          header: "Invoices",
          icon: Receipt,
          items: [
            { label: "Raise Invoice", href: "/dashboard/legal-finance/invoices/new", icon: Plus, visibleTo: ["admin", "finance"] },
            { label: "Invoice Repository", href: "/dashboard/legal-finance/invoices", visibleTo: ["admin", "finance"] },
            { label: "Payment Dashboard", href: "/dashboard/legal-finance/payments/dashboard", visibleTo: ["admin", "finance"] },
            { label: "Payment Ledger", href: "/dashboard/legal-finance/payments", visibleTo: ["admin", "finance"] },
            { label: "Credit Notes", href: "/dashboard/legal-finance/invoices?status=Credit+Note&page=1", visibleTo: ["admin", "finance"] },
          ]
        },
        {
          header: "Reports",
          icon: BarChart3,
          items: [
            { label: "Revenue", href: "/dashboard/legal-finance/reports?tab=revenue", visibleTo: ["admin", "finance"] },
            { label: "Outstanding", href: "/dashboard/legal-finance/reports?tab=outstanding", visibleTo: ["admin", "finance"] },
            { label: "Upcoming Renewals", href: "/dashboard/legal-finance/reports?tab=renewals", visibleTo: ["admin", "finance"] },
            { label: "Collection Dashboard", href: "/dashboard/legal-finance/reports?tab=collection", visibleTo: ["admin", "finance"] },
          ]
        },
        {
          header: "Governance",
          icon: ShieldCheck,
          items: [
            { label: "Compliance", href: "/dashboard/legal-finance/compliance", visibleTo: ["admin", "finance"] },
            { label: "Audit Log", href: "/dashboard/legal-finance/audit-log", visibleTo: ["admin", "finance"] },
          ]
        }
      ]
    },
    {
      title: "Payroll",
      icon: Banknote,
      visibleTo: ["admin", "finance"],
      groups: [
        {
          header: "Runs",
          icon: Receipt,
          items: [
            { label: "Payroll Dashboard", href: "/dashboard/payroll", visibleTo: ["admin", "finance"] },
            { label: "New Payroll Run", href: "/dashboard/payroll/new", icon: Plus, visibleTo: ["admin", "finance"] },
          ]
        },
        {
          header: "Configuration",
          icon: FileText,
          items: [
            { label: "CTC Master", href: "/dashboard/payroll/ctc-master", visibleTo: ["admin", "finance"] },
            { label: "Employee Profiles", href: "/dashboard/payroll/employees", visibleTo: ["admin", "finance"] },
          ]
        }
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

  // Auto-expand active category section on navigation & close non-active sections
  useEffect(() => {
    let activeCatTitle: string | null = null;
    let activeGroupHeader: string | null = null;

    categories.forEach(category => {
      let allChildren: NavChild[] = [];
      if (category.children) {
        allChildren = category.children.filter(c => c.visibleTo.includes(userRole));
      } else if (category.groups) {
        allChildren = category.groups.flatMap(g => g.items.filter(i => i.visibleTo.includes(userRole)));
      }

      const isActive = allChildren.some(child => pathname?.startsWith(child.href) && child.href !== "/dashboard");
      if (isActive) {
        activeCatTitle = category.title;

        if (category.groups) {
          category.groups.forEach(g => {
            const isGroupActive = g.items.some(i => pathname?.startsWith(i.href) && i.href !== "/dashboard");
            if (isGroupActive) {
              activeGroupHeader = g.header;
            }
          });
        }
      }
    });

    if (activeCatTitle) {
      setExpandedSections({ [activeCatTitle]: true });
    } else {
      setExpandedSections({});
    }

    if (activeGroupHeader) {
      setExpandedSubGroups({ [activeGroupHeader]: true });
    } else {
      setExpandedSubGroups({});
    }
  }, [pathname, userRole]);

  const toggleCategory = (title: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setExpandedSections(prev => {
      const isCurrentlyOpen = !!prev[title];
      return isCurrentlyOpen ? {} : { [title]: true };
    });
  };

  const toggleSubGroup = (header: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSubGroups(prev => {
      const isCurrentlyOpen = !!prev[header];
      return isCurrentlyOpen ? {} : { [header]: true };
    });
  };

  return (
    <div className={`group relative h-screen shrink-0 z-40 ${isCollapsed ? "w-[76px]" : "w-[285px]"}`} style={{ transition: 'width 280ms cubic-bezier(0.4, 0, 0.2, 1)', willChange: 'width' }}>
      {/* Structural Outer Sidebar Container — Fixed Height, No Global Scroll */}
      <div
        className="absolute inset-0 flex flex-col h-full overflow-hidden text-white border-r border-white/10"
        style={{ background: "linear-gradient(180deg, #133255 0%, #0b1f36 100%)", boxShadow: "4px 0 20px rgba(0,0,0,0.18)" }}
      >
        {/* 1. FIXED LOGO HEADER — Never scrolls or moves upward */}
        <div className={`h-[76px] shrink-0 flex items-center px-5 border-b border-white/10 bg-[#133255] select-none ${isCollapsed ? "justify-center" : ""}`}>
          <Link href="/dashboard" className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? "justify-center" : ""}`}>
            <div
              className="text-[#133255] font-serif text-xl font-bold w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
              style={{
                background: "linear-gradient(135deg, #D8B15B, #f0c96a)",
                boxShadow: "0 4px 14px rgba(216,177,91,0.35)",
              }}
            >
              MK
            </div>
            {!isCollapsed && (
              <div className="whitespace-nowrap">
                <span className="font-serif text-[17px] font-bold block leading-tight text-white">Mauna Kea</span>
                <span className="text-[12px] text-[#D8B15B] tracking-wider block font-bold">EXECUTIVE SEARCH OS</span>
              </div>
            )}
          </Link>
        </div>

        {/* 2. MIDDLE SCROLLABLE NAVIGATION LIST — Only this section scrolls when items expand */}
        <div className={`flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 space-y-0.5 scrollbar-thin ${isCollapsed ? 'overflow-x-visible' : 'overflow-x-hidden'}`} style={{ scrollbarGutter: 'stable' }}>
          {categories.filter(cat => cat.visibleTo.includes(userRole)).map((category, idx) => {
            let allChildren: NavChild[] = [];
            if (category.children) {
              allChildren = category.children.filter(c => c.visibleTo.includes(userRole));
            } else if (category.groups) {
              allChildren = category.groups.flatMap(g => g.items.filter(i => i.visibleTo.includes(userRole)));
            }

            if (allChildren.length === 0) return null;

            const isActive = allChildren.some(child => pathname?.startsWith(child.href) && child.href !== "/dashboard");
            const isHovered = hoveredCategory === category.title;
            // Auto open on hover OR active route OR explicit click
            const isExpanded = isHovered || isActive || !!expandedSections[category.title];
            const isHighlighted = isHovered || isActive || isExpanded;

            return (
              <div
                key={idx}
                className="flex flex-col shrink-0"
                onMouseEnter={() => setHoveredCategory(category.title)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                {/* Parent Category Header */}
                <div
                  className={`flex items-center gap-3 py-3 cursor-pointer rounded-xl mx-0 select-none transition-colors duration-200 ease-out ${
                    isHighlighted
                      ? "text-white font-bold"
                      : "text-white/75 hover:text-white"
                  } ${isCollapsed ? "px-0 justify-center" : "px-3"}`}
                  style={
                    isHighlighted
                      ? {
                          background: "rgba(216,177,91,0.14)",
                          border: "1px solid rgba(216,177,91,0.3)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                        }
                      : { border: "1px solid transparent" }
                  }
                  onClick={() => toggleCategory(category.title)}
                  title={isCollapsed ? category.title : undefined}
                >
                  <category.icon className={`w-[20px] h-[20px] shrink-0 transition-colors duration-200 ease-out ${isHighlighted ? "text-[#D8B15B]" : ""}`} />
                  {!isCollapsed && (
                    <>
                      <span className="text-[15.5px] flex-1 tracking-wide font-semibold">{category.title}</span>
                      <ChevronRight className={`w-4 h-4 transition-transform duration-280 ease-out ${isExpanded ? "rotate-90 text-[#D8B15B]" : "text-white/35"}`} />
                    </>
                  )}
                </div>

                {/* Wobble-Free CSS Grid Accordion Expansion (Hover + Click Auto Open) */}
                {!isCollapsed && (
                  <div className={`grid transition-[grid-template-rows,opacity] duration-280 ease-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      {/* STANDARD FLAT CHILDREN */}
                      {category.children && (
                        <div className="flex flex-col py-1.5 pl-3 space-y-0.5">
                          {allChildren.map((child, childIdx) => {
                            const isChildActive = pathname === child.href;
                            return (
                              <Link
                                key={childIdx}
                                href={child.href}
                                className={`flex items-center gap-2.5 pl-8 pr-4 py-2 text-[14.5px] font-medium rounded-lg transition-colors duration-200 ease-out ${
                                  isChildActive
                                    ? "text-[#D8B15B] font-bold bg-[#D8B15B]/14 border border-[#D8B15B]/25"
                                    : "text-white/65 hover:text-white hover:bg-white/5 border border-transparent"
                                }`}
                              >
                                {child.icon && <child.icon className="w-4 h-4 shrink-0 opacity-80" />}
                                <span>{child.label}</span>
                                {isChildActive && <div className="ml-auto w-2 h-2 rounded-full bg-[#D8B15B] shrink-0" />}
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {/* CASCADING NESTED GROUPS (Legal & Finance) */}
                      {category.groups && (
                        <div className="flex flex-col py-1.5 pl-3 space-y-1">
                          {category.groups.map((group, groupIdx) => {
                            const visibleGroupItems = group.items.filter(i => i.visibleTo.includes(userRole));
                            if (visibleGroupItems.length === 0) return null;

                            const isGroupActive = visibleGroupItems.some(i => pathname === i.href || (pathname.startsWith(i.href) && i.href.length > 25));
                            const isSubGroupExpanded = isGroupActive || !!expandedSubGroups[group.header];

                            return (
                              <div
                                key={groupIdx}
                                className="flex flex-col rounded-xl overflow-hidden"
                              >
                                {/* Sub-Heading Header */}
                                <div
                                  onClick={(e) => toggleSubGroup(group.header, e)}
                                  className={`flex items-center gap-2.5 pl-6 pr-3 py-2 text-[14.5px] font-bold cursor-pointer rounded-lg select-none transition-colors duration-200 ease-out ${
                                    isSubGroupExpanded
                                      ? "text-[#D8B15B] bg-white/5"
                                      : "text-white/80 hover:text-white hover:bg-white/5"
                                  }`}
                                >
                                  <group.icon className={`w-4 h-4 shrink-0 transition-colors duration-200 ease-out ${isSubGroupExpanded ? "text-[#D8B15B]" : "text-white/45"}`} />
                                  <span className="flex-1 tracking-wide">{group.header}</span>
                                  <ChevronRight className={`w-4 h-4 transition-transform duration-280 ease-out ${isSubGroupExpanded ? "rotate-90 text-[#D8B15B]" : "text-white/35"}`} />
                                </div>

                                {/* Dynamic Sub-Group Items (CSS Grid expansion) */}
                                <div className={`grid transition-[grid-template-rows,opacity] duration-280 ease-out ${isSubGroupExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                                  <div className="overflow-hidden">
                                    <div className="flex flex-col py-1 pl-4 space-y-0.5">
                                      {visibleGroupItems.map((item, itemIdx) => {
                                        const isItemActive = pathname === item.href;
                                        return (
                                          <Link
                                            key={itemIdx}
                                            href={item.href}
                                            className={`flex items-center gap-2 pl-6 pr-3 py-1.5 text-[13.5px] font-medium rounded-lg transition-colors duration-200 ease-out ${
                                              isItemActive
                                                ? "text-[#D8B15B] font-bold bg-[#D8B15B]/15 border border-[#D8B15B]/25"
                                                : "text-white/65 hover:text-white hover:bg-white/5 border border-transparent"
                                            }`}
                                          >
                                            <span className={`text-[11px] ${isItemActive ? "text-[#D8B15B]" : "text-white/35"}`}>•</span>
                                            <span className="truncate">{item.label}</span>
                                            {isItemActive && <div className="ml-auto w-2 h-2 rounded-full bg-[#D8B15B] shrink-0" />}
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Collapsed Flyout Overlay (when sidebar is in collapsed icon mode) */}
                {isCollapsed && isHovered && (
                  <div
                    className="absolute left-[76px] ml-2 top-0 mt-2 w-64 py-3 z-50 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in-0 slide-in-from-left-2 duration-200 ease-out"
                    style={{
                      background: "linear-gradient(180deg, #1a3d6b 0%, #0f2744 100%)",
                      border: "1px solid rgba(216,177,91,0.3)",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
                    }}
                  >
                    <div className="px-4 py-2 font-bold text-[#D8B15B] border-b border-white/10 mb-2 text-[13px] uppercase tracking-widest flex items-center justify-between">
                      <span>{category.title}</span>
                    </div>

                    <div className="flex flex-col px-2 max-h-[420px] overflow-y-auto space-y-1">
                      {category.children && allChildren.map((child, childIdx) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={childIdx}
                            href={child.href}
                            className={`flex items-center gap-2.5 px-3 py-2 text-[14px] font-medium transition-colors duration-200 ease-out rounded-xl ${
                              isChildActive ? "bg-white/10 text-[#D8B15B] font-bold" : "text-white/75 hover:bg-white/8 hover:text-white"
                            }`}
                          >
                            {child.icon && <child.icon className="w-4 h-4 shrink-0" />}
                            {child.label}
                          </Link>
                        );
                      })}

                      {category.groups && category.groups.map((group, groupIdx) => {
                        const visibleGroupItems = group.items.filter(i => i.visibleTo.includes(userRole));
                        if (visibleGroupItems.length === 0) return null;

                        return (
                          <div key={groupIdx} className="space-y-1">
                            <div className="px-3 pt-2 text-[12.5px] font-bold text-[#D8B15B] uppercase tracking-wider flex items-center gap-2">
                              <group.icon className="w-3.5 h-3.5 text-[#D8B15B]" />
                              <span>{group.header}</span>
                            </div>
                            {visibleGroupItems.map((item, itemIdx) => {
                              const isItemActive = pathname === item.href;
                              return (
                                <Link
                                  key={itemIdx}
                                  href={item.href}
                                  className={`flex items-center gap-2 px-4 py-2 text-[13.5px] font-medium transition-colors duration-200 ease-out rounded-lg ${
                                    isItemActive ? "bg-[#D8B15B]/15 text-[#D8B15B] font-bold" : "text-white/65 hover:text-white hover:bg-white/5"
                                  }`}
                                >
                                  <span className="text-[10px] text-[#D8B15B]">•</span>
                                  <span>{item.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 3. FIXED USER FOOTER — Never moves or gets pushed down */}
        <div className={`shrink-0 p-4 border-t border-white/10 bg-[#0b1f36] flex items-center overflow-hidden ${isCollapsed ? "flex-col gap-4 justify-center" : "gap-3"}`}>
          <div
            className="w-[40px] h-[40px] rounded-full flex items-center justify-center font-serif text-[16px] font-bold shrink-0 text-[#133255]"
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
              <span className="text-white text-[15px] font-bold block truncate">{fullName}</span>
              <span className="text-[#D8B15B]/90 text-[12.5px] block capitalize font-medium">{userRole}</span>
            </div>
          )}
          <button onClick={handleSignOut} className="text-white/40 hover:text-rose-400 transition-colors duration-200 ease-out p-1 shrink-0" title="Sign Out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute top-1/2 -right-3.5 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-280 ease-out z-50 flex items-center justify-center cursor-pointer text-[#133255]"
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
