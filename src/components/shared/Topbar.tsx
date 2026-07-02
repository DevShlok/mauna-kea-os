"use client";

import { Search, Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

export function Topbar({ userRole = "candidate" }: { userRole?: string }) {
  const pathname = usePathname();

  let title = "Dashboard";
  let subtitle = "Welcome back";

  if (pathname?.startsWith("/dashboard/clients/new")) { title = "Clients"; subtitle = "Add Client"; }
  else if (pathname?.startsWith("/dashboard/clients")) { title = "Clients"; subtitle = "Client Database"; }
  else if (pathname?.startsWith("/dashboard/mandates/new")) { title = "Clients"; subtitle = "Add Mandate"; }
  else if (pathname?.startsWith("/dashboard/mandates")) { title = "Clients"; subtitle = "Mandates"; }
  else if (pathname?.startsWith("/dashboard/candidates/new")) { title = "Candidates"; subtitle = "Add Candidate"; }
  else if (pathname?.startsWith("/dashboard/candidates")) { title = "Candidates"; subtitle = "Candidate Database"; }
  else if (pathname?.startsWith("/dashboard/float-list/submissions")) { title = "Candidates"; subtitle = "Submissions"; }
  else if (pathname?.startsWith("/dashboard/float-list")) { title = "Candidates"; subtitle = "Float List"; }
  else if (pathname?.startsWith("/dashboard/workbench")) { title = "Productivity Tools"; subtitle = "AI Workbench"; }
  else if (pathname?.startsWith("/dashboard/frameworks")) { title = "Productivity Tools"; subtitle = "Frameworks"; }
  else if (pathname?.startsWith("/dashboard/admin/users/new")) { title = "Admin"; subtitle = "Add a User"; }
  else if (pathname?.startsWith("/dashboard/admin/users")) { title = "Admin"; subtitle = "Users"; }

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
          placeholder="Search..." 
          className="w-[200px] h-[34px] border border-white/20 rounded-full pl-9 pr-3 text-[14px] text-white outline-none transition-all focus:border-white focus:w-[240px] bg-white/10 placeholder-white/50"
        />
      </div>

      <button className="relative w-[34px] h-[34px] flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 transition-colors">
        <Bell className="w-[18px] h-[18px]" />
        <div className="absolute top-[5px] right-[5px] w-2 h-2 bg-[#C0392B] rounded-full border-2 border-[#0b1f3a]"></div>
      </button>

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

      <div className="flex items-center justify-center">
        <UserButton />
      </div>
    </div>
  );
}
