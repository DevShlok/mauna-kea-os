"use client";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getDaysOpen } from "@/lib/helpers";

const STAGE_DATA = [
  {l:"Universe",n:4},{l:"Mapping",n:3},{l:"Long List",n:8},{l:"Call List",n:12},
  {l:"Shortlist",n:11},{l:"Interview",n:7},{l:"Offer",n:4},{l:"Closed",n:9}
];
const CONSULTANT_DATA = [
  {name:"Priya Menon",mandates:2,placed:3,avgScore:8.5,avgDays:62},
  {name:"Amit Sharma",mandates:1,placed:2,avgScore:7.9,avgDays:78},
  {name:"Sanya Rao",mandates:1,placed:1,avgScore:8.1,avgDays:70},
  {name:"Rahul Kumar",mandates:1,placed:2,avgScore:8.4,avgDays:55}
];
const AUDIT_LOG = [
  {ts:"2026-06-04 09:15",user:"Rahul Kumar",action:"Logged in"},
  {ts:"2026-06-04 09:20",user:"Rahul Kumar",action:"Viewed Mandate - ABC CFO"},
  {ts:"2026-06-04 08:45",user:"Priya Menon",action:"Updated candidate stage: Nidhi Kapoor to Interview"},
  {ts:"2026-06-03 17:30",user:"Amit Sharma",action:"Generated AI Report: Kavitha Rajan"},
  {ts:"2026-06-03 16:00",user:"Sanya Rao",action:"Created new mandate: Finova Tech CTO"},
  {ts:"2026-06-03 14:15",user:"Priya Menon",action:"Submitted Ayush Shroff to ABC Limited"},
  {ts:"2026-06-02 11:00",user:"Rahul Kumar",action:"Added user: Sanya Rao"}
];

const TABS = ["Mandate Status","Consultant Productivity","Search Ageing","Custom Report","Audit Trail"];

export default function AnalyticsClient({ initialMandates, analyticsData }: { initialMandates: any[], analyticsData: any }) {
  const [tab, setTab] = useState("Mandate Status");
  const mandates = initialMandates;

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">Export CSV</button>
          <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">Export PDF</button>
        </div>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <select defaultValue="Year to Date" className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none">
          <option>Month to Date</option>
          <option>Year to Date</option>
          <option>Custom Range</option>
        </select>
        <select className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none">
          <option>All Consultants</option>
          <option>Priya Menon</option>
          <option>Amit Sharma</option>
          <option>Sanya Rao</option>
          <option>Rahul Kumar</option>
        </select>
        <select className="px-3 py-2 border border-gray-200 rounded text-sm bg-white outline-none">
          <option>All Clients</option>
          <option>ABC Limited</option>
          <option>XYZ Corporation</option>
          <option>Finova Tech</option>
          <option>Capital Group</option>
        </select>
        <button className="px-4 py-2 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255]">Apply</button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={"px-4 py-2.5 text-sm font-bold border-b-2 transition-colors " + (tab === t ? "border-[#133255] text-[#133255]" : "border-transparent text-gray-400 hover:text-gray-700")}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Mandate Status" && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 text-sm mb-4">Candidates by Stage</h3>
              {STAGE_DATA.map((d) => (
                <div key={d.l} className="flex items-center gap-3 mb-2">
                  <div className="w-20 text-xs text-gray-400 text-right shrink-0">{d.l}</div>
                  <div className="flex-1 bg-gray-100 rounded h-6 overflow-hidden">
                    <div className="bg-[#133255] h-full rounded flex items-center px-2" style={{ width: ((d.n / 12) * 100) + "%" }}>
                      <span className="text-white text-xs font-bold">{d.n}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                {[{l:"Active Mandates",v:analyticsData.activeMandates},{l:"Placed YTD",v:"8",green:true},{l:"Avg. Days to Offer",v:"67"},{l:"Revenue YTD",v:"1.8Cr",gold:true}].map((s) => (
                  <div key={s.l} className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-400 font-bold uppercase mb-1">{s.l}</div>
                    <div className={"text-2xl font-bold " + (s.green ? "text-green-700" : s.gold ? "text-yellow-600" : "text-[#133255]")}>
                      {s.gold ? "₹" : ""}{s.v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Company</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Consultant</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Days Open</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Candidates</th>
              </tr></thead>
              <tbody>
                {mandates.map((m: any) => (
                  <tr key={m.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-semibold text-[#133255]">{m.company}</td>
                    <td className="px-4 py-3 text-gray-600">{m.role}</td>
                    <td className="px-4 py-3 text-gray-500">{m.consultant}</td>
                    <td className="px-4 py-3"><StatusBadge status={m.status || ""} /></td>
                    <td className="px-4 py-3 text-gray-500">{getDaysOpen(m.opened || "")} days</td>
                    <td className="px-4 py-3 text-gray-500">{m.candidates?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Consultant Productivity" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Placements by Consultant</h3>
            {CONSULTANT_DATA.map((d) => (
              <div key={d.name} className="flex items-center gap-3 mb-2">
                <div className="w-16 text-xs text-gray-400 text-right shrink-0">{d.name.split(" ")[0]}</div>
                <div className="flex-1 bg-gray-100 rounded h-6 overflow-hidden">
                  <div className="bg-yellow-500 h-full rounded flex items-center px-2" style={{ width: (d.placed * 25) + "%" }}>
                    <span className="text-[#133255] text-xs font-bold">{d.placed}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-100"><h3 className="font-bold text-gray-900 text-sm">Performance Snapshot</h3></div>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Consultant</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Mandates</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Placed</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Avg Score</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Avg Days</th>
              </tr></thead>
              <tbody>
                {CONSULTANT_DATA.map((d) => (
                  <tr key={d.name} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-800">{d.name}</td>
                    <td className="px-4 py-3 text-gray-500">{d.mandates}</td>
                    <td className="px-4 py-3 text-gray-500">{d.placed}</td>
                    <td className="px-4 py-3"><span className={"px-2 py-0.5 rounded-full text-xs font-bold " + (d.avgScore >= 8 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800")}>{d.avgScore}</span></td>
                    <td className="px-4 py-3 text-gray-500">{d.avgDays} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Search Ageing" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Company</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Days Open</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Stage</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Consultant</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Target Close</th>
            </tr></thead>
            <tbody>
              {mandates.map((m: any) => {
                const d = getDaysOpen(m.opened || "");
                const cls = d > 90 ? "text-red-600 font-bold" : d > 60 ? "text-orange-500 font-bold" : "text-green-700 font-bold";
                return (
                  <tr key={m.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-semibold text-[#133255]">{m.company}</td>
                    <td className="px-4 py-3 text-gray-600">{m.role}</td>
                    <td className={"px-4 py-3 " + cls}>{d} days</td>
                    <td className="px-4 py-3"><StatusBadge status={m.status || ""} /></td>
                    <td className="px-4 py-3 text-gray-500">{m.consultant}</td>
                    <td className="px-4 py-3 text-gray-500">{m.target}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Custom Report" && (
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Select Report Fields</h3>
            <div className="flex flex-wrap gap-4">
              {["Company","Role","CTC Range","Geography","Consultant","Status","Days Open","Candidates Count","Placed"].map((f) => (
                <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-blue-900"/> {f}
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button className="px-4 py-2 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255]">Save Report</button>
              <button className="px-4 py-2 bg-yellow-500 text-[#133255] rounded text-xs font-bold hover:bg-yellow-400">Export</button>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Company</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">CTC Range</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Geography</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Consultant</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
              </tr></thead>
              <tbody>
                {mandates.map((m: any) => (
                  <tr key={m.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 text-[#133255] font-semibold">{m.company}</td>
                    <td className="px-4 py-3 text-gray-600">{m.role}</td>
                    <td className="px-4 py-3 text-gray-500">{m.ctc}</td>
                    <td className="px-4 py-3 text-gray-500">{m.geography}</td>
                    <td className="px-4 py-3 text-gray-500">{m.consultant}</td>
                    <td className="px-4 py-3"><StatusBadge status={m.status || ""} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Audit Trail" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Timestamp</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Action</th>
            </tr></thead>
            <tbody>
              {AUDIT_LOG.map((e, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">{e.ts}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{e.user}</td>
                  <td className="px-4 py-3 text-gray-600">{e.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
