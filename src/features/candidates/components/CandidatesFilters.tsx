"use client";
import React from "react";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { DualRangeSlider } from "@/components/ui/DualRangeSlider";

export const CandidatesFilters = ({
  searchQuery, setSearchQuery,
  companyFilter, setCompanyFilter, uniqueCompanies,
  roleFilter, setRoleFilter, uniqueRoles,
  locationFilter, setLocationFilter, uniqueLocations,
  ctcRange, setCtcRange, maxCtc,
  statusFilter, setStatusFilter, uniqueStatuses,
  filteredCount, totalCount
}: any) => {
  return (
    <div className="bg-white border border-[#e4e8f0] rounded-[16px] p-5 shadow-[0_1px_2px_rgba(16,33,80,0.04)] mb-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
        <div className="relative w-full md:w-1/3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a93a3]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            placeholder="Search candidates by name, email, phone..." 
            className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-[#e4e8f0] rounded-[12px] text-[15px] outline-none focus:bg-white focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed8]/10 transition-all font-medium text-gray-900 placeholder:text-[#8a93a3]"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-[13px] font-bold text-[#6b7a99] bg-[#f8fafc] px-3 py-1.5 rounded-lg border border-[#e4e8f0]">
          Showing <span className="text-[#133255]">{filteredCount}</span> of <span className="text-[#133255]">{totalCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-[13px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">Company</label>
          <MultiSelect options={uniqueCompanies} selected={companyFilter} onChange={setCompanyFilter} placeholder="Any" />
        </div>
        <div>
          <label className="block text-[13px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">Designation</label>
          <MultiSelect options={uniqueRoles} selected={roleFilter} onChange={setRoleFilter} placeholder="Any" />
        </div>
        <div>
          <label className="block text-[13px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">Location</label>
          <MultiSelect options={uniqueLocations} selected={locationFilter} onChange={setLocationFilter} placeholder="Any" />
        </div>
        <div>
          <label className="block text-[13px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5 flex justify-between">
            <span>CTC (LPA)</span>
          </label>
          <div className="flex gap-2 mb-1">
            <input type="number" placeholder="Min" value={ctcRange.min} onChange={e => {
              let val = e.target.value;
              if(ctcRange.max && val !== '' && Number(val) > Number(ctcRange.max)) val = ctcRange.max;
              setCtcRange({...ctcRange, min: val});
            }} className="w-1/2 h-[38px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[15px] outline-none focus:border-[#1d4ed8] bg-white" step="1"/>
            
            <input type="number" placeholder="Max" value={ctcRange.max} onChange={e => {
              let val = e.target.value;
              if(ctcRange.min && val !== '' && Number(val) < Number(ctcRange.min)) val = ctcRange.min;
              setCtcRange({...ctcRange, max: val});
            }} className="w-1/2 h-[38px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[15px] outline-none focus:border-[#1d4ed8] bg-white" step="1"/>
          </div>
          <DualRangeSlider min={0} max={maxCtc} step={5} value={ctcRange} onChange={setCtcRange} />
        </div>
        <div>
          <label className="block text-[13px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">Status</label>
          <MultiSelect options={uniqueStatuses} selected={statusFilter} onChange={setStatusFilter} placeholder="Any" />
        </div>
      </div>
    </div>
  );
};
