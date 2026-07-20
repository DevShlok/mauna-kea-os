"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { logCallActivityAction } from "@/actions/calls";
import { useRouter } from "next/navigation";

interface CallLogModalProps {
  candId: string;
  listType: "BD" | "Calling";
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CallLogModal({ candId, listType, onClose, onSuccess }: CallLogModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    status: "Connected - Follow Up",
    nextFollowUp: "",
    note: "",
  });

  const statuses = listType === "Calling" 
    ? ["To Call", "Left Voicemail", "Connected - Follow Up", "Connected - Not Interested", "Do Not Contact", "Converted"]
    : ["Pending", "In Progress", "Converted", "Archived", "Left Voicemail", "Connected - Follow Up", "Connected - Not Interested"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.note) {
      toast.error("Please enter call notes");
      return;
    }

    setIsSubmitting(true);
    try {
      await logCallActivityAction({
        candId,
        listType,
        status: form.status,
        nextFollowUp: form.nextFollowUp,
        note: form.note,
      });
      toast.success("Call logged successfully!");
      if (onSuccess) onSuccess();
      onClose();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to log call");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#111]/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-[10px] shadow-lg w-[500px] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D4E0F0] font-serif text-[19px] font-bold text-[#111] flex justify-between items-center">
          Log Conversation & Activity
          <button onClick={onClose} className="text-[#6b7a99] hover:text-[#111]">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Call Status <span className="text-red-500">*</span></label>
            <select 
              value={form.status} 
              onChange={e => setForm({...form, status: e.target.value})} 
              className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[15px] outline-none bg-white focus:border-[#133255]"
            >
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {(form.status === "Connected - Follow Up" || form.status === "In Progress") && (
            <div>
              <label className="block text-[13px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Next Follow-Up Date <span className="text-red-500">*</span></label>
              <input 
                required
                type="date" 
                value={form.nextFollowUp} 
                onChange={e => setForm({...form, nextFollowUp: e.target.value})} 
                className="w-full h-10 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[15px] outline-none bg-white focus:border-[#133255]" 
              />
            </div>
          )}

          <div>
            <label className="block text-[13px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Notes / Description <span className="text-red-500">*</span></label>
            <textarea 
              required 
              rows={4} 
              value={form.note} 
              onChange={e => setForm({...form, note: e.target.value})} 
              className="w-full border-[1.5px] border-[#D4E0F0] rounded-md p-3 text-[15px] outline-none bg-white focus:border-[#133255] resize-none" 
              placeholder="Detailed conversation log..."
            ></textarea>
          </div>

          <div className="flex gap-2.5 justify-end mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-[15px] font-semibold text-[#6b7a99] hover:bg-[#f4f7fd] transition-all">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-md text-[15px] font-semibold bg-[#133255] text-white hover:bg-[#0e2150] transition-all">
              {isSubmitting ? "Saving..." : "Log Activity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
