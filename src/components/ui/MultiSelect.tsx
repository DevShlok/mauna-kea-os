"use client";
import React, { useState, useRef, useEffect } from "react";

export const MultiSelect = ({ options = [], selected = [], onChange, placeholder }: any) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter((x: string) => x !== opt));
    else onChange([...selected, opt]);
  };

  const filteredOptions = options.filter((opt: string) => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={ref}>
      <div 
        onClick={() => setOpen(!open)}
        className="w-full min-h-[42px] neo-inset px-3 py-2 text-[13.5px] cursor-pointer flex justify-between items-center"
      >
        <span className={selected.length === 0 ? "text-[#8a93a3]" : "text-gray-900 truncate pr-4 font-bold"}>
          {selected.length === 0 ? placeholder : selected.join(", ")}
        </span>
        <span className="text-[#8a93a3] text-[10px] flex-shrink-0">▼</span>
      </div>
      {open && (
        <div className="absolute top-full mt-2 left-0 w-full min-w-[240px] neo-card z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-2">
          <div className="p-2 border-b border-gray-100">
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full neo-inset px-3 py-1.5 text-[13px] text-[#111] outline-none placeholder-[#94a3b8]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-[250px] overflow-y-auto p-1.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-[13px] text-center text-gray-500">No matching options</div>
            ) : (
              filteredOptions.map((opt: string) => (
                <label key={opt} className="flex items-center gap-3 px-2.5 py-2 hover:bg-[#f0f5ff] rounded-[8px] cursor-pointer text-[13.5px] text-[#334155] font-medium transition-colors group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={selected.includes(opt)} 
                      onChange={() => toggle(opt)} 
                      className="peer appearance-none w-[16px] h-[16px] border-[1.5px] border-[#cbd5e1] rounded-[4px] checked:bg-[#1d4ed8] checked:border-[#1d4ed8] transition-colors cursor-pointer" 
                    />
                    <svg className="absolute w-[10px] h-[10px] text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="truncate group-hover:text-[#0f172a]">{opt}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
