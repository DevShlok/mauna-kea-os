"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Users,
  BrainCircuit,
  Scale,
  Database,
  Send,
  LogOut
} from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();

  const fullName = user?.fullName || "User";
  const initials = fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "MK";

  const navItems: any[] = [
    { section: "Search Delivery" },
    { label: "Mandates", icon: ClipboardList, href: "/dashboard/mandates", badge: 4 },
    { label: "Float List", icon: Send, href: "/dashboard/float-list" },
    { label: "AI Workbench", icon: BrainCircuit, href: "/dashboard/workbench" },
    { label: "Frameworks", icon: Scale, href: "/dashboard/frameworks" },
    { section: "Master Database" },
    { label: "Candidate DB", icon: Database, href: "/dashboard/candidates" },
    { label: "Submissions", icon: ClipboardList, href: "/dashboard/float-list/submissions" },
  ];

  return (
    <div className="w-[230px] min-w-[230px] h-screen bg-[#0b1f3a] flex flex-col overflow-y-auto shrink-0 text-white">
      <Link href="/dashboard" className="flex items-center gap-2 p-5 pb-4 border-b border-white/10 hover:bg-white/5 transition-colors">
        <div className="bg-[#D8B15B] text-[#133255] font-serif text-lg font-bold w-9 h-9 flex items-center justify-center rounded">MK</div>
        <div>
          <span className="font-serif text-[13px] font-bold block leading-tight">Mauna Kea</span>
          <span className="text-[9px] text-white/55 tracking-wider block">EXECUTIVE SEARCH OS</span>
        </div>
      </Link>

      <div className="flex-1 py-4">
        {navItems.map((item, idx) => {
          if (item.section) {
            return (
              <div key={idx} className="px-4 pt-4 pb-1.5 text-[9px] font-bold tracking-widest text-white/40 uppercase">
                {item.section}
              </div>
            );
          }

          const Icon = item.icon!;
          const isActive = pathname?.startsWith(item.href || "");

          return (
            <Link
              key={idx}
              href={item.href!}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-all relative ${
                isActive ? "bg-white/15 text-white font-semibold" : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span>{item.label}</span>
              {item.badge && (
                <span className={`ml-auto text-[10px] font-bold rounded-full px-1.5 min-w-[20px] text-center ${item.badgeColor || "bg-[#D8B15B] text-[#133255]"}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto p-3.5 border-t border-white/10 flex items-center gap-2.5">
        <div className="w-[34px] h-[34px] bg-[#D8B15B] text-[#133255] rounded-full flex items-center justify-center font-serif text-[13px] font-bold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-white text-xs font-semibold block truncate">{fullName}</span>
          <span className="text-white/50 text-[10px] block">Admin</span>
        </div>
        <button onClick={() => signOut({ redirectUrl: '/sign-in' })} className="text-white/45 hover:text-white transition-colors p-1" title="Sign Out">
          <LogOut className="w-[14px] h-[14px]" />
        </button>
      </div>
    </div>
  );
}
