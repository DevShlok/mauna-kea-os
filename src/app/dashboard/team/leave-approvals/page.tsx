"use client";

import { useState, useEffect } from "react";
import { Coffee, CalendarDays } from "lucide-react";

export default function LeaveApprovalsPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [teamStatuses, setTeamStatuses] = useState<any>({});
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaves' | 'breaks'>('leaves');

  useEffect(() => {
    const fetchData = () => {
      Promise.all([
        fetch('/api/leave-requests?all=true').then(res => res.json()),
        fetch('/api/time-logs?all=true').then(res => res.json())
      ]).then(([leavesData, statusData]) => {
        if (leavesData.success) setLeaves(leavesData.requests);
        if (statusData.success) {
          setTeamStatuses(statusData.statuses);
          setTeamUsers(statusData.users);
        }
      }).catch(console.error).finally(() => setLoading(false));
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    window.addEventListener('break_status_changed', fetchData);

    return () => {
      clearInterval(interval);
      window.removeEventListener('break_status_changed', fetchData);
    };
  }, []);

  const onBreakUsers = teamUsers.filter(u => teamStatuses[u.id] === 'On Break');
  const displayLeaves = leaves.filter(l => l.status !== 'Withdrawn');

  return (
    <div className="max-w-screen-xl mx-auto pb-10 p-6">
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
          <span className="text-[#133255]">Team</span>
          <span>/</span>
          <span>Leave Approvals</span>
        </div>
        <h1 className="text-[29px] font-serif font-bold text-[#111]">Leaves & Breaks Overview</h1>
      </div>

      <div className="flex items-center gap-4 border-b border-gray-200 mb-6">
        <button 
          onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'leaves' ? 'border-[#D8B15B] text-[#133255]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <CalendarDays className="w-4 h-4" /> All Leave Requests
        </button>
        <button 
          onClick={() => setActiveTab('breaks')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'breaks' ? 'border-[#D8B15B] text-[#133255]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <Coffee className="w-4 h-4" /> Currently On Break
        </button>
      </div>

      <div className="bg-white border border-[#D4E0F0] rounded-xl overflow-hidden shadow-sm">
        {activeTab === 'leaves' ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f9fafc] border-b-2 border-[#D4E0F0]">
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Leave Type</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Loading leaves...</td></tr>
              ) : displayLeaves.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No leave requests found.</td></tr>
              ) : (
                displayLeaves.map(leave => (
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
                        leave.status === 'Withdrawn' ? 'bg-gray-100 text-gray-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f9fafc] border-b-2 border-[#D4E0F0]">
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Loading breaks...</td></tr>
              ) : onBreakUsers.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">No one is currently on break.</td></tr>
              ) : (
                onBreakUsers.map(u => (
                  <tr key={u.id} className="border-b border-[#D4E0F0] hover:bg-[#f9fafc]">
                    <td className="px-4 py-3 font-semibold text-[#111]">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{u.role}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                        On Break
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
