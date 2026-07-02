import React from "react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#f4f6fb] w-full h-full min-h-0">
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Spinning circular border behind the logo */}
        <div className="absolute inset-0 rounded-full border-[3px] border-[#0b1f3a]/10 border-t-[#D8B15B] animate-spin"></div>
        
        {/* The MK logo */}
        <div className="bg-[#D8B15B] text-[#133255] font-serif text-2xl font-bold w-12 h-12 flex items-center justify-center rounded shadow-sm z-10">
          MK
        </div>
      </div>
    </div>
  );
}
