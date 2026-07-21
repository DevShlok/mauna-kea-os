"use client";
import React from "react";

export const DualRangeSlider = ({ min, max, step, value, onChange }: any) => {
  const minVal = value.min === '' ? min : Number(value.min);
  const maxVal = value.max === '' ? max : Number(value.max);

  const handleMinChange = (e: any) => {
    const v = Math.min(Number(e.target.value), maxVal);
    onChange({ ...value, min: v.toString() });
  };

  const handleMaxChange = (e: any) => {
    const v = Math.max(Number(e.target.value), minVal);
    onChange({ ...value, max: v.toString() });
  };

  const minPercent = ((minVal - min) / (max - min)) * 100;
  const maxPercent = ((maxVal - min) / (max - min)) * 100;

  return (
    <div className="relative w-[92%] mx-auto h-[5px] bg-[#e4e8f0] rounded-full mt-5 mb-3">
      <div 
        className="absolute h-full bg-[#1d4ed8] rounded-full" 
        style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }} 
      />
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={minVal} 
        onChange={handleMinChange}
        className="absolute w-full h-[5px] opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
        style={{ zIndex: minVal > max - (max-min)*0.1 ? 5 : 3 }}
      />
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={maxVal} 
        onChange={handleMaxChange}
        className="absolute w-full h-[5px] opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
        style={{ zIndex: 4 }}
      />
      <div className="absolute top-full mt-2 w-full flex justify-between text-[11px] font-bold text-[#8a93a3]">
        <span>{value.min === '' ? 'Min' : value.min}</span>
        <span>{value.max === '' ? 'Max' : value.max}</span>
      </div>
    </div>
  );
};
