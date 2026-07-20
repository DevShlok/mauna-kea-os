"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { createPlanAction, reviewPlanAction } from "@/actions/calls";
import { useRouter } from "next/navigation";

export default function PlanningClient({ plans, isAdmin }: { plans: any[], isAdmin: boolean }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"Weekly" | "Daily">("Weekly");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    targetCalls: 0,
    planText: "",
    carryForwardCount: 0,
    pendingReason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createPlanAction({
        type: activeTab,
        date: form.date,
        targetCalls: Number(form.targetCalls),
        planText: form.planText,
        carryForwardCount: Number(form.carryForwardCount),
        pendingReason: form.pendingReason,
      });
      toast.success(`${activeTab} plan saved successfully!`);
      setForm({
        date: new Date().toISOString().split('T')[0],
        targetCalls: 0,
        planText: "",
        carryForwardCount: 0,
        pendingReason: "",
      });
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
            <label className="block text-[13px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Target Calls <span className="text-red-500">*</span></label>
            <input 
              required
              type="number"
              min="0"
              value={form.targetCalls} 
              onChange={e => setForm({...form, targetCalls: Number(e.target.value)})} 
              className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[15px] outline-none bg-white focus:border-[#133255]" 
            />
          </div>

          {activeTab === 'Weekly' && (
            <div>
              <label className="block text-[13px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Focus Areas / Strategy</label>
              <textarea 
                rows={3} 
                value={form.planText} 
                onChange={e => setForm({...form, planText: e.target.value})} 
                className="w-full border-[1.5px] border-[#D4E0F0] rounded-md p-3 text-[15px] outline-none bg-white focus:border-[#133255] resize-none" 
                placeholder="What roles or clients are you targeting this week?"
              ></textarea>
            </div>
          )}

          {activeTab === 'Daily' && (
            <>
              <div>
                <label className="block text-[13px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Carry Forward Calls</label>
                <input 
                  type="number"
                  min="0"
                  value={form.carryForwardCount} 
                  onChange={e => setForm({...form, carryForwardCount: Number(e.target.value)})} 
                  className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[15px] outline-none bg-white focus:border-[#133255]" 
                />
              </div>
              {form.carryForwardCount > 0 && (
                <div>
                  <label className="block text-[13px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Reason for Carry Forward</label>
                  <textarea 
                    rows={2} 
                    value={form.pendingReason} 
                    onChange={e => setForm({...form, pendingReason: e.target.value})} 
                    className="w-full border-[1.5px] border-[#D4E0F0] rounded-md p-3 text-[15px] outline-none bg-white focus:border-[#133255] resize-none" 
                    placeholder="Why were these calls not completed yesterday?"
                  ></textarea>
                </div>
              )}
            </>
          )}

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
          {filteredPlans.map(plan => (
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

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-[#f4f7fd] p-3 rounded-lg border border-[#e4e8f0]">
                  <div className="text-[11px] font-bold text-[#6b7a99] uppercase tracking-wider mb-1">Target Calls</div>
                  <div className="text-[18px] font-bold text-[#133255]">{plan.targetCalls}</div>
                </div>
                {plan.type === 'Daily' && plan.carryForwardCount > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                    <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider mb-1">Carried Forward</div>
                    <div className="text-[18px] font-bold text-red-700">{plan.carryForwardCount}</div>
                  </div>
                )}
              </div>

              {plan.type === 'Weekly' && plan.planText && (
                <div className="mt-4 text-[14px] text-[#4a5568]">
                  <span className="font-bold text-[#133255] block mb-1">Strategy:</span>
                  <div className="italic bg-gray-50 p-3 rounded border border-gray-100">"{plan.planText}"</div>
                </div>
              )}
              
              {plan.type === 'Daily' && plan.pendingReason && (
                <div className="mt-4 text-[14px] text-[#4a5568]">
                  <span className="font-bold text-red-700 block mb-1">Carry Forward Reason:</span>
                  <div className="italic bg-gray-50 p-3 rounded border border-gray-100">"{plan.pendingReason}"</div>
                </div>
              )}
            </div>
          ))}

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
