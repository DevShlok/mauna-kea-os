"use client";

import { useState, useEffect } from "react";
import { Clock, CalendarDays, History } from "lucide-react";

export default function TimeLeaveClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [clockStatus, setClockStatus] = useState<string>("Loading");

  // Leave Form
  const [leaveType, setLeaveType] = useState("Casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveToWithdraw, setLeaveToWithdraw] = useState<number | null>(null);

  const getWorkingDays = (startStr: string, endStr: string) => {
    let count = 0;
    const cur = new Date(startStr);
    const end = new Date(endStr);
    while (cur <= end) {
      const day = cur.getDay(); // 0 is Sunday, 6 is Saturday
      if (day !== 0 && day !== 6) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  useEffect(() => {
    const fetchStatus = () => {
      fetch('/api/time-logs')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.status) {
            setClockStatus(data.status === 'On Break' ? 'On Break' : 'Active');
          } else {
            setClockStatus("Active");
          }
        })
        .catch(() => setClockStatus("Active"));
    };

    fetchStatus();

    window.addEventListener('break_status_changed', fetchStatus);
    return () => window.removeEventListener('break_status_changed', fetchStatus);
  }, []);

  useEffect(() => {
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

  const confirmWithdraw = async () => {
    if (!leaveToWithdraw) return;
    try {
      const res = await fetch('/api/leave-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leaveToWithdraw, status: 'Withdrawn' })
      });
      const data = await res.json();
      if (data.success) {
        const refreshRes = await fetch('/api/leave-requests');
        const refreshData = await refreshRes.json();
        if (refreshData.success) setLeaves(refreshData.requests);
      } else {
        alert(data.error || "Failed to withdraw");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to withdraw leave");
    } finally {
      setLeaveToWithdraw(null);
    }
  };

  const handleBreakToggle = async () => {
    const action = clockStatus === 'On Break' ? 'break_end' : 'break_start';
    try {
      setClockStatus("Loading");
      const res = await fetch('/api/time-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        setClockStatus(action === 'break_start' ? "On Break" : "Active");
        window.dispatchEvent(new Event('break_status_changed'));
      }
    } catch (error) {
      console.error(error);
      setClockStatus("Active");
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto pb-10 p-6">
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
          <span className="text-[#133255]">Team</span>
          <span>/</span>
          <span>Time & Leave</span>
        </div>
        <h1 className="text-[29px] font-serif font-bold text-[#111]">Time & Leave Tracker</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white border border-[#D4E0F0] rounded-xl overflow-hidden shadow-sm p-6 flex flex-col justify-center items-center text-center">
            <h2 className="text-lg font-bold text-[#133255] mb-2">My Break Status</h2>
            <p className="text-sm text-gray-500 mb-6">Let the team know if you are stepping away.</p>
            {clockStatus === 'Loading' ? (
              <div className="w-full h-[45px] bg-gray-100 animate-pulse rounded-full" />
            ) : clockStatus === 'On Break' ? (
              <button onClick={handleBreakToggle} className="w-full px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full transition-colors flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" /> Return to Work
              </button>
            ) : (
              <button onClick={handleBreakToggle} className="w-full px-6 py-3 bg-[#133255] hover:bg-[#0e2440] text-white font-bold rounded-full transition-colors">
                Take a Break
              </button>
            )}
          </div>

          <div className="bg-white border border-[#D4E0F0] rounded-xl overflow-hidden shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#133255] mb-4">Apply for Leave</h2>
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6b7a99] uppercase tracking-wider mb-1">Leave Type</label>
                <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full px-3 py-2 border-[1.5px] border-[#D4E0F0] rounded-md text-sm outline-none focus:border-[#133255]">
                  <option value="Casual">Casual</option>
                  <option value="Sick">Sick</option>
                  <option value="Earned Leave">Earned Leave</option>
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
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                      <span className="mx-2">•</span>
                      {getWorkingDays(leave.startDate, leave.endDate)} working days
                    </div>
                    {leave.status !== 'Withdrawn' && (
                      <button 
                        onClick={() => setLeaveToWithdraw(leave.id)}
                        className="mt-2 w-max px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs font-bold transition-colors"
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
      </div>

      {leaveToWithdraw && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-serif font-bold text-[#111] mb-2">Withdraw Leave</h3>
              <p className="text-sm text-gray-500">Are you sure you want to withdraw this leave request? This action cannot be undone.</p>
              
              <div className="mt-8 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setLeaveToWithdraw(null)}
                  className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmWithdraw}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
                >
                  Confirm Withdraw
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
