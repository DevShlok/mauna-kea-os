"use client";

import { Search, Bell } from "lucide-react";
import { usePathname } from "next/navigation";

export function Topbar() {
  const pathname = usePathname();

  // Simple title mapping
  let title = "Dashboard";
  let subtitle = "Welcome back";
  if (pathname?.includes("mandates")) { title = "Mandates"; subtitle = "Active search mandates"; }
  if (pathname?.includes("float-list")) { title = "Float List"; subtitle = "Talent pipeline dashboard"; }
  if (pathname?.includes("workbench")) { title = "AI Workbench"; subtitle = "Generate assessment report"; }

  return (
    <div className="h-[56px] bg-white border-b border-[#D4E0F0] flex items-center px-6 gap-4 shrink-0 shadow-sm">
      <div className="flex-1">
        <span className="font-serif text-base font-bold text-[#111] block">{title}</span>
        <span className="text-[11px] text-[#6b7a99] block">{subtitle}</span>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7a99]" />
        <input 
          type="text" 
          placeholder="Search..." 
          className="w-[200px] h-[34px] border-[1.5px] border-[#D4E0F0] rounded-full pl-9 pr-3 text-[13px] outline-none transition-all focus:border-[#123D8D] focus:w-[240px] bg-[#f9fafc]"
        />
      </div>

      <button className="relative w-[34px] h-[34px] flex items-center justify-center rounded-full hover:bg-[#EBF2FB] text-[#6b7a99] transition-colors">
        <Bell className="w-[18px] h-[18px]" />
        <div className="absolute top-[5px] right-[5px] w-2 h-2 bg-[#C0392B] rounded-full border-2 border-white"></div>
      </button>

      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#fde8e8] text-[#C0392B]">
        Admin
      </span>

      <div className="w-8 h-8 bg-[#123D8D] text-white rounded-full flex items-center justify-center font-serif text-xs font-bold cursor-pointer">
        RK
      </div>
    </div>
  );
}
