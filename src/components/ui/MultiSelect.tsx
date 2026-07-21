"use client";
import React, { useState, useRef, useEffect } from "react";

export const MultiSelect = ({ options, selected, onChange, placeholder }: any) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter((x: string) => x !== opt));
    else onChange([...selected, opt]);
  };

  return (
    <div className="relative w-full" ref={ref}>
      <div 
        onClick={() => setOpen(!open)}
        className="w-full min-h-[42px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 py-2 text-[15px] bg-white cursor-pointer flex justify-between items-center hover:border-[#1d4ed8] transition-colors"
      >
        <span className={selected.length === 0 ? "text-[#8a93a3]" : "text-gray-900 truncate pr-4 font-medium"}>
          {selected.length === 0 ? placeholder : selected.join(", ")}
        </span>
        <span className="text-[#8a93a3] text-[12px]">▼</span>
      </div>
      {open && (
        <div className="absolute top-full mt-1 left-0 w-[240px] bg-white border border-[#e4e8f0] rounded-[10px] shadow-xl z-50 max-h-[300px] overflow-y-auto p-1">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-[14px] text-gray-500">No options</div>
          ) : (
            options.map((opt: string) => (
              <label key={opt} className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#f4f7fd] rounded-[6px] cursor-pointer text-[15px] text-gray-800 transition-colors">
                <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="w-[15px] h-[15px] accent-[#1d4ed8] cursor-pointer" />
                <span className="truncate">{opt}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
};
