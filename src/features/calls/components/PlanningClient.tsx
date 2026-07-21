"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { createPlanAction, reviewPlanAction } from "@/actions/calls";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export default function PlanningClient({ plans, availableTargets, isAdmin, user }: { plans: any[], availableTargets: any[], isAdmin: boolean, user?: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"Weekly" | "Daily">("Weekly");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [targetTypeTab, setTargetTypeTab] = useState<"Candidate" | "Client">("Candidate");
  const [searchQuery, setSearchQuery] = useState("");

  const selectedTargetObjs = availableTargets.filter(t => selectedTargets.includes(t.candId));
  const filteredTargets = availableTargets.filter(target => 
    !selectedTargets.includes(target.candId) &&
    (target.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    target.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    target.designation?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    planText: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTargets.length === 0) {
      toast.error("Please select at least one target for the plan");
      return;
    }
    setIsSubmitting(true);
    try {
      await createPlanAction({
        type: activeTab,
        date: form.date,
        targetCandIds: selectedTargets,
        targetClientIds: [], // Placeholder for future client support
        planText: form.planText,
      });
      toast.success(`${activeTab} plan saved successfully!`);
      setForm({
        date: new Date().toISOString().split('T')[0],
        planText: "",
      });
      setSelectedTargets([]);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReview = async (planId: number) => {
    try {
      await reviewPlanAction(planId);
      toast.success("Plan marked as reviewed!");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to review plan");
    }
  };

  const toggleTarget = (id: string) => {
    if (selectedTargets.includes(id)) {
      setSelectedTargets(selectedTargets.filter(t => t !== id));
    } else {
      setSelectedTargets([...selectedTargets, id]);
    }
  };

  const filteredPlans = plans.filter(p => p.type === activeTab);

  const firstName = user?.name?.split(" ")[0] || "Consultant";
  
  // Calculate today's plan metrics for the banner
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysPlan = plans.find(p => p.type === 'Daily' && p.date === todayStr);
  const plannedIds = todaysPlan?.targetCandIds as string[] || [];
  
  // We consider a call "completed" if it has a terminal status or is no longer pending/to call
  const terminalStatuses = ['Converted', 'Archived', 'Do Not Contact', 'Connected - Not Interested', 'Connected - Follow Up', 'Left Voicemail', 'In Progress'];
  const completedTargets = availableTargets.filter(t => plannedIds.includes(t.candId) && terminalStatuses.includes(t.status));
  
  const totalPlanned = plannedIds.length;
  const totalCompleted = completedTargets.length;
  const totalRemaining = Math.max(0, totalPlanned - totalCompleted);
  const progressPercent = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Personalized Greeting & Progress Banner */}
      <div className="bg-gradient-to-r from-[#133255] to-[#1a4fa8] rounded-xl p-6 shadow-sm text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
        
        <div className="z-10 mb-6 md:mb-0">
          <h1 className="text-2xl font-bold font-serif mb-1">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {firstName}!
          </h1>
          <p className="text-white/80 text-sm">
            Here is your daily planning summary. Keep up the momentum!
          </p>
        </div>

        {/* Animated Circular Progress */}
        <div className="z-10 flex items-center gap-6 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
          <div className="flex flex-col gap-1 text-right">
            <span className="text-white/70 text-xs font-bold uppercase tracking-wider">Today's Progress</span>
            <span className="text-2xl font-bold">{progressPercent}%</span>
          </div>
          
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Background circle */}
            <svg className="w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/20" />
              {/* Animated foreground circle */}
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent"
                strokeDasharray="175"
                strokeDashoffset={175 - (175 * progressPercent) / 100}
                strokeLinecap="round"
                className="text-[#D8B15B] transition-all duration-1000 ease-out"
              />
            </svg>
          </div>
          
          <div className="flex flex-col gap-3 pl-4 border-l border-white/20">
            <div className="flex flex-col">
              <span className="text-white/70 text-[10px] uppercase tracking-wider font-bold leading-tight">Calls Completed</span>
              <span className="font-bold text-sm leading-tight text-green-300">{totalCompleted} / {totalPlanned}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white/70 text-[10px] uppercase tracking-wider font-bold leading-tight">Yet to Call</span>
              <span className="font-bold text-sm leading-tight text-orange-300">{totalRemaining}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Create Plan Form */}
      <div className="w-full bg-white border border-[#e4e8f0] rounded-[16px] shadow-sm p-6">
        <h2 className="text-xl font-bold text-[#133255] mb-5">Create New Plan</h2>
        
        <div className="flex bg-[#f4f7fd] p-1 rounded-lg mb-6 w-fit">
          <button 
            className={`px-8 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'Weekly' ? 'bg-white text-[#133255] shadow-sm' : 'text-[#6b7a99]'}`}
            onClick={() => setActiveTab('Weekly')}
          >
            Weekly Plan
          </button>
          <button 
            className={`px-8 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'Daily' ? 'bg-white text-[#133255] shadow-sm' : 'text-[#6b7a99]'}`}
            onClick={() => setActiveTab('Daily')}
          >
            Daily Plan
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[13px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">
                {activeTab === 'Weekly' ? "Week Commencing" : "Date"} <span className="text-red-500">*</span>
              </label>
              <input 
                required
                type="date" 
                min={new Date().toISOString().split('T')[0]}
                value={form.date} 
                onChange={e => setForm({...form, date: e.target.value})} 
                className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[15px] outline-none bg-white focus:border-[#133255]" 
              />
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[13px] font-bold tracking-wide uppercase text-[#6b7a99]">Select Targets <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setTargetTypeTab("Candidate")} className={`text-[12px] font-bold uppercase tracking-wider ${targetTypeTab === "Candidate" ? "text-[#133255]" : "text-gray-400"}`}>Candidates</button>
                  <span className="text-gray-300">|</span>
                  <button type="button" onClick={() => setTargetTypeTab("Client")} className={`text-[12px] font-bold uppercase tracking-wider ${targetTypeTab === "Client" ? "text-[#133255]" : "text-gray-400"}`}>Clients</button>
                </div>
              </div>
              
              <div className="border-[1.5px] border-[#D4E0F0] rounded-md p-3 bg-white shadow-sm">
                {/* Selected Chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTargetObjs.map(t => (
                    <div key={t.candId} className="flex items-center gap-1.5 bg-[#eef2fb] text-[#133255] px-2.5 py-1.5 rounded-md text-[13px] font-semibold border border-[#d4e0f0]">
                      <span>{t.name}</span>
                      <button type="button" onClick={() => toggleTarget(t.candId)} className="text-[#133255] hover:text-red-500 rounded p-0.5 transition-colors"><X size={14} /></button>
                    </div>
                  ))}
                  {selectedTargets.length === 0 && <div className="text-gray-400 text-[13px] italic py-1">No targets selected yet. Search below to add.</div>}
                </div>

                {/* Search & Select */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder={`Search ${targetTypeTab.toLowerCase()}s by name, company, or designation...`}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 text-[14px] bg-[#f8fafc] border border-[#e4e8f0] rounded-md outline-none focus:border-[#133255] transition-colors"
                  />
                </div>
                
                {targetTypeTab === "Candidate" ? (
                  <div className="max-h-[200px] overflow-y-auto border border-[#f0f4f8] rounded bg-[#f8fafc]">
                    {filteredTargets.length > 0 ? (
                      filteredTargets.slice(0, 50).map(target => (
                        <div key={target.candId} onClick={() => toggleTarget(target.candId)} className="flex justify-between items-center p-2.5 border-b border-[#f0f4f8] hover:bg-white cursor-pointer transition-colors group">
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-bold text-[#111] truncate group-hover:text-[#133255] transition-colors">{target.name}</div>
                            <div className="text-[12px] text-gray-500 truncate">{target.designation} at {target.company}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#eef2fb] text-[#133255]">{target.list}</span>
                            <span className="text-[12px] font-semibold text-[#133255] opacity-0 group-hover:opacity-100 transition-opacity">Select +</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-[13px]">No matching {targetTypeTab.toLowerCase()}s.</div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 text-[13px]">Client selection coming soon.</div>
                )}
              </div>
              <div className="text-right text-[12px] text-[#6b7a99] mt-1 font-bold">{selectedTargets.length} selected</div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || selectedTargets.length === 0} 
            className="w-full h-11 rounded-md text-[15px] font-bold bg-[#133255] text-white hover:bg-[#0e2150] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Saving..." : `Save ${activeTab} Plan`}
          </button>
        </form>
      </div>

      {/* Plan List */}
      <div className="w-full bg-white border border-[#e4e8f0] rounded-[16px] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#D4E0F0] flex justify-between items-center bg-[#f8fafc]">
          <h2 className="text-[17px] font-bold text-[#133255]">Submitted {activeTab} Plans</h2>
        </div>
        
        <div className="divide-y divide-[#e4e8f0]">
          {filteredPlans.map(plan => {
            // Find explicitly planned candidates
            const planCands = plan.targetCandIds ? availableTargets.filter(t => (plan.targetCandIds as string[]).includes(t.candId)) : [];
            
            // Calculate automatic carry-forwards for Daily plans
            let carryForwardCands: any[] = [];
            if (plan.type === 'Daily') {
              const pastDailyPlans = plans.filter(p => p.type === 'Daily' && p.date < plan.date && p.userId === plan.userId);
              const pastTargetIds = new Set<string>();
              pastDailyPlans.forEach(p => {
                if (p.targetCandIds) {
                  (p.targetCandIds as string[]).forEach(id => pastTargetIds.add(id));
                }
              });
              // Filter to those whose CURRENT status implies they still need to be called
              // E.g., 'To Call', 'Pending', 'Left Voicemail'
              const terminalStatuses = ['Converted', 'Archived', 'Do Not Contact', 'Connected - Not Interested'];
              carryForwardCands = availableTargets.filter(t => 
                pastTargetIds.has(t.candId) && 
                !terminalStatuses.includes(t.status) &&
                !(plan.targetCandIds as string[] || []).includes(t.candId) // don't double count if they re-planned them
              );
            }

            return (
            <div key={plan.id} className="p-5 hover:bg-gray-50/50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[16px] text-[#111]">{plan.userName}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-[#eef2fb] text-[#1d4ed8]">
                      {plan.type}
                    </span>
                    {plan.isReviewed ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-green-100 text-green-700">Reviewed</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-amber-100 text-amber-700">Pending Review</span>
                    )}
                  </div>
                  <div className="text-[13px] text-[#6b7a99] font-medium">
                    {plan.type === 'Weekly' ? 'Week of' : 'Date'}: <span className="text-[#133255] font-bold">{plan.date}</span>
                  </div>
                </div>
                
                {isAdmin && !plan.isReviewed && (
                  <button 
                    onClick={() => handleReview(plan.id)}
                    className="px-3 py-1.5 bg-[#D8B15B] text-[#133255] rounded-md text-[13px] font-bold hover:bg-[#e8c97a] transition-colors"
                  >
                    Mark as Reviewed
                  </button>
                )}
              </div>

              <div className="mt-4">
                <div className="text-[12px] font-bold text-[#6b7a99] uppercase tracking-wider mb-2">Planned Targets ({planCands.length})</div>
                <div className="flex flex-wrap gap-2">
                  {planCands.map(c => (
                    <span key={c.candId} className="px-2.5 py-1 bg-white border border-[#D4E0F0] rounded-full text-[13px] text-[#133255] font-semibold">
                      {c.name}
                    </span>
                  ))}
                  {planCands.length === 0 && <span className="text-gray-400 text-sm italic">No specific candidates mapped.</span>}
                </div>
              </div>

              {plan.type === 'Daily' && carryForwardCands.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dashed border-[#e4e8f0]">
                  <div className="text-[12px] font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    Automatically Carried Forward ({carryForwardCands.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {carryForwardCands.map(c => (
                      <span key={c.candId} className="px-2.5 py-1 bg-red-50 border border-red-200 rounded-full text-[13px] text-red-700 font-semibold">
                        {c.name} <span className="text-red-400 text-[11px] font-normal italic ml-1">({c.status})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            );
          })}

          {filteredPlans.length === 0 && (
            <div className="p-10 text-center text-gray-500">
              No {activeTab.toLowerCase()} plans submitted yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
