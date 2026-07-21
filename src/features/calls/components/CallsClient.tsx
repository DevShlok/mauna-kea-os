"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Phone, Mail, User, Calendar, Loader2, Search } from "lucide-react";
import CallLogModal from "@/components/shared/CallLogModal";
import { useRouter } from "next/navigation";
import { saveInlineNoteAction, removeFromEngagementListAction } from "@/actions/calls";
import { EmptyState } from "@/components/ui/EmptyState";
import toast from "react-hot-toast";

export default function CallsClient({ items, currentDate }: { items: any[], currentDate?: string }) {
  const router = useRouter();
  const [logModalCandId, setLogModalCandId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"All" | "Calling" | "BD">("All");
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
      case "To Call":
        return "bg-gray-100 text-gray-700";
      case "In Progress":
      case "Connected - Follow Up":
        return "bg-blue-100 text-blue-700";
      case "Left Voicemail":
        return "bg-orange-100 text-orange-700";
      case "Connected - Not Interested":
      case "Do Not Contact":
        return "bg-red-100 text-red-700";
      case "Converted":
        return "bg-green-100 text-green-700";
      case "Archived":
        return "bg-gray-200 text-gray-500";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredItems = items.filter(item => {
    const matchesTab = activeTab === "All" || item.listType === activeTab;
    if (!matchesTab) return false;
    
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (item.candName || "").toLowerCase().includes(query) ||
      (item.candCompany || "").toLowerCase().includes(query) ||
      (item.candRole || "").toLowerCase().includes(query)
    );
  });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    router.push(`/dashboard/calls?date=${e.target.value}`);
  };

  const handleNoteBlur = async (candId: string, listType: "BD" | "Calling", newNote: string, oldNote: string) => {
    if (newNote.trim() === (oldNote || "").trim()) return;
    setSavingNoteId(candId);
    try {
      await saveInlineNoteAction({ candId, listType, note: newNote });
      toast.success("Note saved & synced!");
      router.refresh();
    } catch (e) {
      toast.error("Failed to save note");
    } finally {
      setSavingNoteId(null);
    }
  };

  const handleRemove = async (candId: string, listType: "BD" | "Calling") => {
    if (!confirm("Are you sure you want to remove this candidate from the list?")) return;
    try {
      await removeFromEngagementListAction(candId, listType);
      toast.success("Removed from list");
      router.refresh();
    } catch (e) {
      toast.error("Failed to remove from list");
    }
  };

  const totalPlanned = filteredItems.length;
  // If a note exists, or if the status is something other than Pending/To Call, we consider it "Called"
  const totalCalled = filteredItems.filter(i => (i.notes && i.notes.trim() !== "") || (i.status !== "Pending" && i.status !== "To Call" && i.status !== "")).length;
  const totalRemaining = totalPlanned - totalCalled;

  return (
    <div className="bg-white border border-[#e4e8f0] rounded-[16px] overflow-hidden shadow-sm flex flex-col min-h-[600px]">
      
      {/* ── Header: Filters & Progress ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-[#e4e8f0] bg-[#fdfdfd] gap-4">
        
        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="flex bg-[#f4f7fd] p-1 rounded-lg w-fit">
            <button 
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'All' ? 'bg-white text-[#133255] shadow-sm' : 'text-[#6b7a99]'}`}
              onClick={() => setActiveTab('All')}
            >
              All
            </button>
            <button 
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'Calling' ? 'bg-white text-[#133255] shadow-sm' : 'text-[#6b7a99]'}`}
              onClick={() => setActiveTab('Calling')}
            >
              Calling List
            </button>
            <button 
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'BD' ? 'bg-white text-[#133255] shadow-sm' : 'text-[#6b7a99]'}`}
              onClick={() => setActiveTab('BD')}
            >
              BD List
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Search by name, role, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 shadow-sm"
            />
          </div>
        </div>

        {/* Date Filter & Progress */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Progress Tracker */}
          <div className="flex gap-4 text-sm font-medium">
            <div className="flex flex-col">
              <span className="text-gray-400 text-[11px] uppercase tracking-wider font-bold">Planned</span>
              <span className="text-[#133255] text-lg font-bold leading-tight">{totalPlanned}</span>
            </div>
            <div className="w-[1px] bg-gray-200 h-8"></div>
            <div className="flex flex-col">
              <span className="text-gray-400 text-[11px] uppercase tracking-wider font-bold">Called</span>
              <span className="text-green-600 text-lg font-bold leading-tight">{totalCalled}</span>
            </div>
            <div className="w-[1px] bg-gray-200 h-8"></div>
            <div className="flex flex-col">
              <span className="text-gray-400 text-[11px] uppercase tracking-wider font-bold">Remaining</span>
              <span className="text-orange-500 text-lg font-bold leading-tight">{totalRemaining}</span>
            </div>
          </div>

          {/* Date Picker */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button 
              onClick={() => router.push(`/dashboard/calls?date=all`)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${currentDate === 'all' ? 'bg-[#133255] text-white border-[#133255]' : 'bg-white text-[#6b7a99] border-gray-200 hover:bg-gray-50'}`}
            >
              All Time
            </button>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
              <Calendar size={16} className="text-gray-400" />
              <input 
                type="date" 
                value={currentDate === 'all' ? "" : (currentDate || "")}
                onChange={handleDateChange}
                className="text-sm font-semibold text-[#133255] outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

      </div>

      {/* ── Excel-Style Table ── */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-[#e4e8f0]">
              <th className="px-4 py-3 text-left font-bold text-[#4a5568] w-[20%]">Candidate</th>
              <th className="px-4 py-3 text-left font-bold text-[#4a5568] w-[18%]">Current Role</th>
              <th className="px-4 py-3 text-left font-bold text-[#4a5568] w-[10%]">Status</th>
              <th className="px-4 py-3 text-left font-bold text-[#4a5568] w-[42%]">Inline Call Notes</th>
              <th className="px-4 py-3 text-right font-bold text-[#4a5568] w-[10%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.candId + item.listType} className="border-b border-[#e4e8f0] hover:bg-gray-50/50 group">
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-col">
                    <Link href={`/dashboard/candidates/${item.candId}`} className="font-bold text-[#133255] hover:underline text-[15px]">
                      {item.candName}
                    </Link>
                    <div className="text-gray-500 text-[12px] flex flex-col gap-0.5 mt-1">
                      <span className="flex items-center gap-1"><Phone size={10} /> {item.candMobile || 'N/A'}</span>
                      <span className="flex items-center gap-1"><Mail size={10} /> {item.candEmail || 'N/A'}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 align-top text-[#4a5568]">
                  <div className="font-semibold">{item.candRole || 'N/A'}</div>
                  <div className="text-gray-500 text-[13px]">{item.candCompany || 'N/A'}</div>
                  <div className="mt-2">
                    <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase bg-[#eef2fb] text-[#133255]">
                      {item.listType}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 align-top">
                  <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold tracking-wide uppercase whitespace-nowrap inline-block ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-4 align-top relative">
                  <div className="relative">
                    <textarea 
                      defaultValue={item.notes || ""}
                      placeholder="Type call notes here... (Saves automatically)"
                      onBlur={(e) => handleNoteBlur(item.candId, item.listType as any, e.target.value, item.notes)}
                      className="w-full min-h-[80px] p-2.5 bg-[#f8fafc] group-hover:bg-white border border-transparent group-hover:border-gray-200 rounded-md outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-[13px] resize-y"
                    />
                    {savingNoteId === item.candId && (
                      <div className="absolute right-2 bottom-2 text-blue-500">
                        <Loader2 size={14} className="animate-spin" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 align-top text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => setLogModalCandId(item.candId)}
                      className="text-[#6b7a99] hover:text-[#133255] text-[12px] font-semibold underline"
                    >
                      Change Status
                    </button>
                    <Link 
                      href={`/dashboard/candidates/${item.candId}`}
                      className="p-1.5 border border-[#D4E0F0] text-[#6b7a99] rounded-md hover:bg-gray-50 bg-white"
                      title="View Profile"
                    >
                      <User size={16} />
                    </Link>
                    <button 
                      onClick={() => handleRemove(item.candId, item.listType as any)}
                      className="text-red-500 hover:text-red-700 text-[12px] font-semibold underline ml-1"
                      title="Remove from list"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={5} className="p-0 border-none">
                  <EmptyState 
                    title="No calls planned" 
                    description={searchQuery ? "No candidates match your search." : "You have no calls planned for this date. Select a different date or add candidates to your plan."} 
                    actionLabel={searchQuery ? "Clear Search" : undefined}
                    onAction={searchQuery ? () => setSearchQuery("") : undefined}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {logModalCandId && (
        <CallLogModal 
          candId={logModalCandId}
          listType={items.find(i => i.candId === logModalCandId)?.listType || "Calling"}
          onClose={() => setLogModalCandId(null)}
        />
      )}
    </div>
  );
}
