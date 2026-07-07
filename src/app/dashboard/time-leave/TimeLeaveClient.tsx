"use client";

import { useState, useEffect } from "react";
import { Clock, CalendarDays, History } from "lucide-react";

export default function TimeLeaveClient() {
  const [activeTab, setActiveTab] = useState<'history' | 'leave'>('history');
  
  const [logs, setLogs] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);

  // Leave Form
  const [leaveType, setLeaveType] = useState("Casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/time-logs?history=true')
      .then(res => res.json())
      .then(data => {
        if (data.success) setLogs(data.logs);
      });
      
    fetch('/api/leave-requests')
      .then(res => res.json())
      .then(data => {
        if (data.success) setLeaves(data.requests);
      });
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveType, startDate, endDate, reason })
      });
      const data = await res.json();
      if (data.success) {
        alert("Leave request submitted successfully!");
        // Refresh leaves
        const refreshRes = await fetch('/api/leave-requests');
        const refreshData = await refreshRes.json();
        if (refreshData.success) setLeaves(refreshData.requests);
        setStartDate("");
        setEndDate("");
        setReason("");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to submit leave");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto pb-10 p-6">
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
          <span className="text-[#133255]">Productivity Tools</span>
          <span>/</span>
          <span>Time & Leave</span>
        </div>
        <h1 className="text-[29px] font-serif font-bold text-[#111]">Time & Leave Tracker</h1>
      </div>

      <div className="flex items-center gap-4 border-b border-gray-200 mb-6">
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-[#D8B15B] text-[#133255]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <History className="w-4 h-4" /> My Clock History
        </button>
        <button 
          onClick={() => setActiveTab('leave')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'leave' ? 'border-[#D8B15B] text-[#133255]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <CalendarDays className="w-4 h-4" /> Apply for Leave
        </button>
      </div>

      {activeTab === 'history' && (
        <div className="bg-white border border-[#D4E0F0] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f9fafc] border-b-2 border-[#D4E0F0]">
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">No time logs found.</td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="border-b border-[#D4E0F0] hover:bg-[#f9fafc]">
                    <td className="px-4 py-3 font-medium text-gray-800">{new Date(log.timestamp).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider ${
                        log.action === 'clock_in' ? 'bg-emerald-100 text-emerald-800' :
                        log.action === 'clock_out' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'leave' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#D4E0F0] rounded-xl overflow-hidden shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#133255] mb-4">Apply for Leave</h2>
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6b7a99] uppercase tracking-wider mb-1">Leave Type</label>
                <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full px-3 py-2 border-[1.5px] border-[#D4E0F0] rounded-md text-sm outline-none focus:border-[#133255]">
                  <option value="Casual">Casual</option>
                  <option value="Sick">Sick</option>
                  <option value="Privilege">Privilege</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#6b7a99] uppercase tracking-wider mb-1">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border-[1.5px] border-[#D4E0F0] rounded-md text-sm outline-none focus:border-[#133255]" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6b7a99] uppercase tracking-wider mb-1">End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border-[1.5px] border-[#D4E0F0] rounded-md text-sm outline-none focus:border-[#133255]" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6b7a99] uppercase tracking-wider mb-1">Reason (Optional)</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full px-3 py-2 border-[1.5px] border-[#D4E0F0] rounded-md text-sm outline-none focus:border-[#133255] resize-none"></textarea>
              </div>
              <button disabled={isSubmitting} type="submit" className="w-full px-4 py-2.5 bg-[#133255] text-white rounded text-sm font-bold hover:bg-[#0e3178] disabled:opacity-50">
                {isSubmitting ? "Submitting..." : "Submit Leave Application"}
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#D4E0F0] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#D4E0F0] bg-gray-50">
              <h2 className="text-sm font-bold text-[#133255]">My Leave Requests</h2>
            </div>
            <div className="p-4 space-y-3">
              {leaves.length === 0 ? (
                <div className="text-center text-gray-400 py-6 text-sm">No leave requests yet.</div>
              ) : (
                leaves.map(leave => (
                  <div key={leave.id} className="border border-gray-100 rounded-lg p-3 bg-white shadow-sm flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#111]">{leave.leaveType} Leave</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        leave.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {leave.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
