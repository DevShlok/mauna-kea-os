"use client";
import { useState } from "react";
import { STAGE_OPTIONS } from "@/lib/helpers";
import { updateFloatUnifiedStageAction } from "@/actions";
import toast from "react-hot-toast";
import { ChevronDown } from "lucide-react";

export function FloatStageDropdown({ id, currentStage }: { id: string, currentStage: string }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [stage, setStage] = useState(currentStage || "universe");

  const STAGE_COLORS: Record<string, string> = {
    universe: 'bg-gray-100 text-gray-700',
    mapping: 'bg-purple-100 text-purple-800',
    longlist: 'bg-orange-100 text-orange-800',
    calllist: 'bg-amber-100 text-amber-800',
    shortlist: 'bg-blue-100 text-[#133255]',
    interview: 'bg-emerald-100 text-emerald-800',
    'client-shortlisted': 'bg-emerald-100 text-emerald-800',
    'offer-sent': 'bg-indigo-100 text-indigo-800',
    'offer-accepted': 'bg-teal-100 text-teal-800',
    closed: 'bg-red-100 text-red-800',
    'position-closed': 'bg-rose-100 text-rose-800',
  };

  const handleStageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStage = e.target.value;
    setStage(newStage);
    setIsUpdating(true);
    try {
      await updateFloatUnifiedStageAction(id, newStage);
      toast.success("Stage updated successfully");
    } catch (err) {
      toast.error("Failed to update stage");
      setStage(currentStage); // Revert
    } finally {
      setIsUpdating(false);
    }
  };

  const colorClass = STAGE_COLORS[stage.toLowerCase()] || 'bg-gray-100 text-gray-600';

  return (
    <div className="relative inline-flex items-center">
      <select
        value={stage}
        onChange={handleStageChange}
        disabled={isUpdating}
        className={`appearance-none outline-none cursor-pointer pr-7 pl-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider transition-all shadow-sm border border-transparent hover:border-black/10 focus:ring-2 focus:ring-[#133255]/20 ${colorClass} hover:brightness-95 disabled:opacity-50`}
      >
        {STAGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2.5 pointer-events-none text-current opacity-60">
        <ChevronDown size={12} strokeWidth={3} />
      </div>
    </div>
  );
}
