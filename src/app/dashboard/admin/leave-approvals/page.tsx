"use client";

import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

export default function LeaveApprovalsPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    try {
      const res = await fetch('/api/leave-requests?all=true');
      const data = await res.json();
      if (data.success) {
        setLeaves(data.requests);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch('/api/leave-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      if (data.success) {
        fetchLeaves();
      }
    } catch (error) {
      console.error("Error updating leave:", error);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto pb-10 p-6">
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
          <span className="text-[#133255]">Admin</span>
          <span>/</span>
          <span>Leave Approvals</span>
        </div>
        <h1 className="text-[29px] font-serif font-bold text-[#111]">Leave Approvals</h1>
      </div>

      <div className="bg-white border border-[#D4E0F0] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f9fafc] border-b-2 border-[#D4E0F0]">
              <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Consultant</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Leave Type</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Reason</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Loading leaves...</td></tr>
            ) : leaves.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No leave requests found.</td></tr>
            ) : (
              leaves.map(leave => (
                <tr key={leave.id} className="border-b border-[#D4E0F0] hover:bg-[#f9fafc]">
                  <td className="px-4 py-3 font-semibold text-[#111]">{leave.userName || leave.userId}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-[#133255]">{leave.leaveType}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={leave.reason}>
                    {leave.reason || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider ${
                      leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                      leave.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {leave.status === 'Pending' ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateStatus(leave.id, 'Approved')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded text-xs font-bold hover:bg-emerald-100 flex items-center gap-1"><Check className="w-3 h-3"/> Approve</button>
                        <button onClick={() => handleUpdateStatus(leave.id, 'Rejected')} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-bold hover:bg-red-100 flex items-center gap-1"><X className="w-3 h-3"/> Reject</button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Processed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
