import React from "react";

export default function Loader() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] h-full w-full bg-transparent">
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