"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { createPlanAction, reviewPlanAction } from "@/actions/calls";
import { useRouter } from "next/navigation";

export default function PlanningClient({ plans, availableTargets, isAdmin }: { plans: any[], availableTargets: any[], isAdmin: boolean }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"Weekly" | "Daily">("Weekly");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [targetTypeTab, setTargetTypeTab] = useState<"Candidate" | "Client">("Candidate");

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

  return (
    <div className="flex gap-6 items-start">
      {/* Create Plan Form */}
      <div className="w-1/3 bg-white border border-[#e4e8f0] rounded-[16px] shadow-sm p-6 sticky top-6">
        <h2 className="text-xl font-bold text-[#133255] mb-5">Create New Plan</h2>
        
        <div className="flex bg-[#f4f7fd] p-1 rounded-lg mb-6">
          <button 
            className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'Weekly' ? 'bg-white text-[#133255] shadow-sm' : 'text-[#6b7a99]'}`}
            onClick={() => setActiveTab('Weekly')}
          >
            Weekly
          </button>
          <button 
            className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'Daily' ? 'bg-white text-[#133255] shadow-sm' : 'text-[#6b7a99]'}`}
            onClick={() => setActiveTab('Daily')}
          >
            Daily
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">
              {activeTab === 'Weekly' ? "Week Commencing" : "Date"} <span className="text-red-500">*</span>
            </label>
            <input 
              required
              type="date" 
              value={form.date} 
              onChange={e => setForm({...form, date: e.target.value})} 
              className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[15px] outline-none bg-white focus:border-[#133255]" 
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[13px] font-bold tracking-wide uppercase text-[#6b7a99]">Select Targets <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setTargetTypeTab("Candidate")} className={`text-[12px] font-bold uppercase tracking-wider ${targetTypeTab === "Candidate" ? "text-[#133255]" : "text-gray-400"}`}>Candidates</button>
                <span className="text-gray-300">|</span>
                <button type="button" onClick={() => setTargetTypeTab("Client")} className={`text-[12px] font-bold uppercase tracking-wider ${targetTypeTab === "Client" ? "text-[#133255]" : "text-gray-400"}`}>Clients</button>
              </div>
            </div>
            
            <div className="border-[1.5px] border-[#D4E0F0] rounded-md overflow-hidden bg-white max-h-[250px] overflow-y-auto">
              {targetTypeTab === "Candidate" && availableTargets.length > 0 ? (
                availableTargets.map(target => (
                  <label key={target.candId} className="flex items-center gap-3 p-2.5 border-b border-[#f0f4f8] hover:bg-[#f8fafc] cursor-pointer">
                    <input type="checkbox" checked={selectedTargets.includes(target.candId)} onChange={() => toggleTarget(target.candId)} className="w-4 h-4 text-[#133255] rounded border-gray-300 focus:ring-[#133255]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold text-[#111] truncate">{target.name}</div>
                      <div className="text-[12px] text-gray-500 truncate">{target.designation} at {target.company}</div>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#eef2fb] text-[#133255]">{target.list}</span>
                  </label>
                ))
              ) : targetTypeTab === "Candidate" ? (
                <div className="p-4 text-center text-gray-500 text-[13px]">No candidates in your Calling or BD lists.</div>
              ) : (
                <div className="p-4 text-center text-gray-500 text-[13px]">Client selection coming soon.</div>
              )}
            </div>
            <div className="text-right text-[12px] text-[#6b7a99] mt-1 font-bold">{selectedTargets.length} selected</div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full h-11 mt-2 rounded-md text-[15px] font-bold bg-[#133255] text-white hover:bg-[#0e2150] transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Saving..." : `Save ${activeTab} Plan`}
          </button>
        </form>
      </div>

      {/* Plan List */}
      <div className="w-2/3 bg-white border border-[#e4e8f0] rounded-[16px] shadow-sm overflow-hidden">
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
