"use client";
import React, { useState, useEffect } from "react";

export const DualRangeSlider = ({ min, max, step, value, onChange }: any) => {
  const minVal = value.min === "" ? min : Number(value.min);
  const maxVal = value.max === "" ? max : Number(value.max);

  const [activeThumb, setActiveThumb] = useState<"min" | "max" | null>(null);

  const handleMinChange = (e: any) => {
    const v = Math.min(Number(e.target.value), maxVal);
    onChange({ ...value, min: v.toString() });
  };

  const handleMaxChange = (e: any) => {
    const v = Math.max(Number(e.target.value), minVal);
    onChange({ ...value, max: v.toString() });
  };

  const handleManualMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = Number(e.target.value);
    if (isNaN(v)) return;
    if (v < min) v = min;
    if (v > maxVal) v = maxVal;
    onChange({ ...value, min: v.toString() });
  };

  const handleManualMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = Number(e.target.value);
    if (isNaN(v)) return;
    if (v > max) v = max;
    if (v < minVal) v = minVal;
    onChange({ ...value, max: v.toString() });
  };

  const range = max - min || 1;
  const minPercent = ((minVal - min) / range) * 100;
  const maxPercent = ((maxVal - min) / range) * 100;

  return (
    <div className="pt-6 pb-2 px-2">
      <div className="relative w-full h-[6px] bg-[#e4e8f0] rounded-full">
        {/* Active Range Fill */}
        <div 
          className="absolute h-full bg-[#1d4ed8] rounded-full transition-all duration-75" 
          style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }} 
        />
        
        {/* Visible Thumbs (Candlesticks) */}
        <div 
          className={`absolute top-1/2 -translate-y-1/2 -ml-[6px] w-[12px] h-[20px] bg-white border-2 border-[#1d4ed8] rounded-[3px] shadow-sm pointer-events-none transition-transform duration-75 ${activeThumb === "min" ? "scale-110" : ""}`}
          style={{ left: `${minPercent}%`, zIndex: minVal > max - range * 0.1 ? 6 : 4 }}
        >
          {/* Decorative lines inside candlestick */}
          <div className="absolute top-[3px] bottom-[3px] left-1/2 -translate-x-1/2 w-[2px] bg-[#e4e8f0] rounded-full" />
        </div>
        <div 
          className={`absolute top-1/2 -translate-y-1/2 -ml-[6px] w-[12px] h-[20px] bg-white border-2 border-[#1d4ed8] rounded-[3px] shadow-sm pointer-events-none transition-transform duration-75 ${activeThumb === "max" ? "scale-110" : ""}`}
          style={{ left: `${maxPercent}%`, zIndex: 5 }}
        >
          {/* Decorative lines inside candlestick */}
          <div className="absolute top-[3px] bottom-[3px] left-1/2 -translate-x-1/2 w-[2px] bg-[#e4e8f0] rounded-full" />
        </div>

        {/* Floating Tooltips */}
        <div 
          className={`absolute top-[-34px] -ml-[18px] w-[36px] flex justify-center transition-opacity duration-200 ${activeThumb === "min" ? "opacity-100" : "opacity-0"}`}
          style={{ left: `${minPercent}%`, zIndex: 10 }}
        >
          <div className="bg-[#1e293b] text-white text-[11px] font-bold py-1 px-2 rounded-[6px] shadow-lg whitespace-nowrap">
            {minVal}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1e293b]" />
          </div>
        </div>

        <div 
          className={`absolute top-[-34px] -ml-[18px] w-[36px] flex justify-center transition-opacity duration-200 ${activeThumb === "max" ? "opacity-100" : "opacity-0"}`}
          style={{ left: `${maxPercent}%`, zIndex: 10 }}
        >
          <div className="bg-[#1e293b] text-white text-[11px] font-bold py-1 px-2 rounded-[6px] shadow-lg whitespace-nowrap">
            {maxVal}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1e293b]" />
          </div>
        </div>

        {/* Hidden Inputs for interaction */}
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          value={minVal} 
          onChange={handleMinChange}
          onMouseDown={() => setActiveThumb("min")}
          onMouseUp={() => setActiveThumb(null)}
          onTouchStart={() => setActiveThumb("min")}
          onTouchEnd={() => setActiveThumb(null)}
          className="absolute top-1/2 -translate-y-1/2 w-full h-[24px] opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-[24px] [&::-webkit-slider-thumb]:h-[24px] [&::-webkit-slider-thumb]:appearance-none appearance-none"
          style={{ zIndex: minVal > max - range * 0.1 ? 7 : 5 }}
        />
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          value={maxVal} 
          onChange={handleMaxChange}
          onMouseDown={() => setActiveThumb("max")}
          onMouseUp={() => setActiveThumb(null)}
          onTouchStart={() => setActiveThumb("max")}
          onTouchEnd={() => setActiveThumb(null)}
          className="absolute top-1/2 -translate-y-1/2 w-full h-[24px] opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-[24px] [&::-webkit-slider-thumb]:h-[24px] [&::-webkit-slider-thumb]:appearance-none appearance-none"
          style={{ zIndex: 6 }}
        />
      </div>

      <div className="flex justify-between items-center mt-5">
        <div className="flex flex-col gap-1 w-[45%]">
          <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider">Min</span>
          <div className="relative">
            <input 
              type="number"
              min={min}
              max={maxVal}
              value={minVal}
              onChange={handleManualMinChange}
              className="w-full h-[32px] neo-inset px-2 text-[12px] font-bold text-[#334155] outline-none"
            />
          </div>
        </div>
        <div className="w-[10%] flex justify-center text-[#94a3b8] mt-4">-</div>
        <div className="flex flex-col gap-1 w-[45%]">
          <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider text-right">Max</span>
          <div className="relative">
            <input 
              type="number"
              min={minVal}
              max={max}
              value={maxVal}
              onChange={handleManualMaxChange}
              className="w-full h-[32px] neo-inset px-2 text-[12px] font-bold text-[#334155] text-right outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
