"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Phone, Mail, User } from "lucide-react";
import CallLogModal from "@/components/shared/CallLogModal";

export default function CallsClient({ items, listType }: { items: any[], listType: "BD" | "Calling" }) {
  const [logModalCandId, setLogModalCandId] = useState<string | null>(null);

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

  return (
    <div className="bg-white border border-[#e4e8f0] rounded-[16px] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-[#e4e8f0]">
              <th className="px-5 py-3 text-left font-bold text-[#4a5568] w-[25%]">Candidate</th>
              <th className="px-5 py-3 text-left font-bold text-[#4a5568] w-[25%]">Current Role</th>
              <th className="px-5 py-3 text-left font-bold text-[#4a5568] w-[15%]">Status</th>
              {listType === "Calling" && <th className="px-5 py-3 text-left font-bold text-[#4a5568] w-[15%]">Next Follow Up</th>}
              <th className="px-5 py-3 text-left font-bold text-[#4a5568] w-[20%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-[#e4e8f0] hover:bg-gray-50/50">
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    <Link href={`/dashboard/candidates/${item.candId}`} className="font-bold text-[#133255] hover:underline text-[15px]">
                      {item.candName}
                    </Link>
                    <div className="text-gray-500 text-[13px] flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1"><Phone size={12} /> {item.candMobile || 'N/A'}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Mail size={12} /> {item.candEmail || 'N/A'}</span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-[#4a5568]">
                  <div className="font-semibold">{item.candRole || 'N/A'}</div>
                  <div className="text-gray-500 text-[13px]">{item.candCompany || 'N/A'}</div>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-[6px] text-[12px] font-bold tracking-wide uppercase ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                  {item.notes && (
                    <div className="text-[12px] text-gray-500 mt-2 italic truncate max-w-[200px]" title={item.notes}>
                      "{item.notes}"
                    </div>
                  )}
                </td>
                {listType === "Calling" && (
                  <td className="px-5 py-4 text-[#4a5568] font-semibold">
                    {item.nextFollowUp || '-'}
                  </td>
                )}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setLogModalCandId(item.candId)}
                      className="px-3 py-1.5 bg-[#133255] text-white rounded-md text-[13px] font-bold hover:bg-[#0e2150] transition-colors"
                    >
                      Log Call
                    </button>
                    <Link 
                      href={`/dashboard/candidates/${item.candId}`}
                      className="p-1.5 border border-[#D4E0F0] text-[#6b7a99] rounded-md hover:bg-gray-50"
                      title="View Profile"
                    >
                      <User size={16} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={listType === "Calling" ? 5 : 4} className="px-5 py-10 text-center text-gray-500">
                  No candidates in this list. Go to the Candidate Database to add some.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {logModalCandId && (
        <CallLogModal 
          candId={logModalCandId}
          listType={listType}
          onClose={() => setLogModalCandId(null)}
        />
      )}
    </div>
  );
}
