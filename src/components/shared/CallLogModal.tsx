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
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(11,31,54,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="neo-card w-[500px] overflow-hidden p-0" style={{ borderTop: '4px solid #D8B15B' }}>
        {/* Header */}
        <div className="px-7 py-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-serif text-[19px] font-bold text-[#133255]">Log Conversation & Activity</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 neo-card-sm flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-7 flex flex-col gap-5">
          <div>
            <label className="block text-[12px] font-bold tracking-widest uppercase text-[#6b7a99] mb-2">
              Call Status <span className="text-red-500">*</span>
            </label>
            <select 
              value={form.status} 
              onChange={e => setForm({...form, status: e.target.value})} 
              className="w-full h-11 neo-inset px-4 text-[14px] text-slate-800 font-medium outline-none"
            >
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {(form.status === "Connected - Follow Up" || form.status === "In Progress") && (
            <div>
              <label className="block text-[12px] font-bold tracking-widest uppercase text-[#6b7a99] mb-2">
                Next Follow-Up Date <span className="text-red-500">*</span>
              </label>
              <input 
                required
                type="date" 
                value={form.nextFollowUp} 
                onChange={e => setForm({...form, nextFollowUp: e.target.value})} 
                className="w-full h-11 neo-inset px-4 text-[14px] text-slate-800 outline-none" 
              />
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[12px] font-bold tracking-widest uppercase text-[#6b7a99]">
                Notes / Description <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 tabular-nums">{form.note.length}/500</span>
            </div>
            <textarea 
              required 
              rows={4} 
              maxLength={500}
              value={form.note} 
              onChange={e => setForm({...form, note: e.target.value})} 
              className="w-full neo-inset px-4 py-3 text-[14px] text-slate-800 outline-none resize-none" 
              placeholder="Detailed conversation log..."
            ></textarea>
          </div>

          <div className="flex gap-3 justify-end mt-1">
            <button type="button" onClick={onClose} className="neo-btn px-5 py-2.5 text-[14px] font-semibold text-gray-600">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="neo-btn-primary px-5 py-2.5 text-[14px] font-bold disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Log Activity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
