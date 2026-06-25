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
    <div className="h-[56px] bg-white border-b border-[#D4E0F0] flex items-center px-6 gap-4 shrink-0 shadow-sm">
      <div className="flex-1">
        <span className="font-serif text-base font-bold text-[#111] block">{title}</span>
        <span className="text-[12px] text-[#6b7a99] block">{subtitle}</span>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7a99]" />
        <input 
          type="text" 
          placeholder="Search..." 
          className="w-[200px] h-[34px] border-[1.5px] border-[#D4E0F0] rounded-full pl-9 pr-3 text-[14px] outline-none transition-all focus:border-[#133255] focus:w-[240px] bg-[#f9fafc]"
        />
      </div>

      <button className="relative w-[34px] h-[34px] flex items-center justify-center rounded-full hover:bg-[#EBF2FB] text-[#6b7a99] transition-colors">
        <Bell className="w-[18px] h-[18px]" />
        <div className="absolute top-[5px] right-[5px] w-2 h-2 bg-[#C0392B] rounded-full border-2 border-white"></div>
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
