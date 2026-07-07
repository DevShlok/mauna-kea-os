"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function TimesheetsClient({ users }: { users: any[] }) {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('userId') || "";

  const [selectedUser, setSelectedUser] = useState<string>(initialUserId);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Constants
  const EXPECTED_HOURS = 8; // 8 hours per day expected

  const formatHours = (hours: number) => {
    const isNegative = hours < 0;
    const absHours = Math.abs(hours);
    const h = Math.floor(absHours);
    const m = Math.floor((absHours - h) * 60);
    const s = Math.floor((((absHours - h) * 60) - m) * 60);
    return `${isNegative ? '-' : ''}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Fetch users (this would typically come from an admin users endpoint, we'll fetch from a generic endpoint or mock)
    // For now, we assume the admin knows the user ID, or we fetch the list.
    // Let's fetch the list of users from a server action if possible, or just let them enter the ID if the list isn't easily available here without an API.
    // Wait, we don't have a GET /api/users route. I'll just use a simple state for now and rely on the query param to drill down.
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    setLoading(true);
    // Let's fetch history for this specific user. We need an API endpoint for admin to get specific user history.
    // I'll reuse the `/api/time-logs?history=true&userId=${selectedUser}`. I need to update the API to accept `userId`.
    fetch(`/api/time-logs?history=true&userId=${selectedUser}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLogs(data.logs);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedUser]);

  // Group logs by date
  const timesheetByDate: Record<string, any> = {};
  logs.forEach(log => {
    const dateStr = log.dateString;
    if (!timesheetByDate[dateStr]) {
      timesheetByDate[dateStr] = {
        date: dateStr,
        firstIn: null,
        lastOut: null,
        totalActive: 0,
        totalBreak: 0,
        logs: []
      };
    }
    timesheetByDate[dateStr].logs.push(log);
  });

  // Calculate times
  Object.values(timesheetByDate).forEach(day => {
    // Sort chronologically
    day.logs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    let lastClockIn: number | null = null;
    let lastBreakStart: number | null = null;

    day.logs.forEach((log: any) => {
      const time = new Date(log.timestamp).getTime();
      
      if (log.action === 'clock_in') {
        if (!day.firstIn) day.firstIn = new Date(log.timestamp);
        lastClockIn = time;
      } else if (log.action === 'break_start') {
        if (lastClockIn) {
          day.totalActive += (time - lastClockIn);
          lastClockIn = null;
        }
        lastBreakStart = time;
      } else if (log.action === 'break_end') {
        if (lastBreakStart) {
          day.totalBreak += (time - lastBreakStart);
          lastBreakStart = null;
        }
        lastClockIn = time;
      } else if (log.action === 'clock_out') {
        day.lastOut = new Date(log.timestamp);
        if (lastClockIn) {
          day.totalActive += (time - lastClockIn);
          lastClockIn = null;
        }
      }
    });

    // Convert ms to hours
    day.activeHours = day.totalActive / (1000 * 60 * 60);
    day.breakHours = day.totalBreak / (1000 * 60 * 60);
    day.overtime = day.activeHours - EXPECTED_HOURS;
  });

  const handleExport = () => {
    // Generate CSV
    const headers = ["Date", "First In", "Last Out", "Active Hours", "Break Hours", "Expected Hours", "Overtime/Deficit"];
    const rows = Object.values(timesheetByDate).map(day => [
      day.date,
      day.firstIn ? day.firstIn.toLocaleTimeString() : "-",
      day.lastOut ? day.lastOut.toLocaleTimeString() : "-",
      formatHours(day.activeHours),
      formatHours(day.breakHours),
      formatHours(EXPECTED_HOURS),
      formatHours(day.overtime)
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `timesheet_${selectedUser}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-screen-xl mx-auto pb-10 p-6">
      <div className="mb-6 flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
            <span className="text-[#133255]">Admin</span>
            <span>/</span>
            <span>Timesheets & Reports</span>
          </div>
          <h1 className="text-[29px] font-serif font-bold text-[#111]">Timesheets</h1>
        </div>

        {selectedUser && Object.keys(timesheetByDate).length > 0 && (
          <button onClick={handleExport} className="px-4 py-2 bg-[#133255] text-white rounded text-sm font-bold hover:bg-[#0e3178] flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Payroll Data
          </button>
        )}
      </div>

      {!selectedUser ? (
        <div className="bg-white border border-[#D4E0F0] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f9fafc] border-b-2 border-[#D4E0F0]">
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-[#D4E0F0] hover:bg-[#f9fafc] cursor-pointer" onClick={() => setSelectedUser(u.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-[#133255] text-[#D8B15B] flex items-center justify-center text-xs font-bold font-serif">{u.initials}</div>
                      <span className="font-semibold text-[#111]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6b7a99] capitalize">{u.role}</td>
                  <td className="px-4 py-3">
                    <button className="text-[#133255] font-bold hover:underline">View Timesheet</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-3">
            <button 
              onClick={() => setSelectedUser("")}
              className="text-[#6b7a99] hover:text-[#111] font-bold text-sm flex items-center gap-1"
            >
              ← Back to Users
            </button>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-[#111]">Viewing: {users.find(u => u.id === selectedUser)?.name || selectedUser}</span>
          </div>

          <div className="bg-white border border-[#D4E0F0] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f9fafc] border-b-2 border-[#D4E0F0]">
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">First In</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Last Out</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Active Hours</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Break Hours</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#6b7a99] uppercase tracking-wider">Net (O/D)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Loading timesheet...</td></tr>
              ) : Object.keys(timesheetByDate).length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No time logs found for this user.</td></tr>
              ) : (
                Object.values(timesheetByDate).map((day: any) => (
                  <tr key={day.date} className="border-b border-[#D4E0F0] hover:bg-[#f9fafc]">
                    <td className="px-4 py-3 font-semibold text-[#111]">{day.date}</td>
                    <td className="px-4 py-3 text-gray-600">{day.firstIn ? day.firstIn.toLocaleTimeString() : '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{day.lastOut ? day.lastOut.toLocaleTimeString() : '-'}</td>
                    <td className="px-4 py-3 font-bold text-[#133255]">{formatHours(day.activeHours)}</td>
                    <td className="px-4 py-3 text-amber-600 font-semibold">{formatHours(day.breakHours)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-[12px] font-bold ${
                        day.overtime > 0 ? 'bg-emerald-100 text-emerald-800' : 
                        day.overtime < 0 ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {day.overtime > 0 ? '+' : ''}{formatHours(day.overtime).replace('-', '')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
