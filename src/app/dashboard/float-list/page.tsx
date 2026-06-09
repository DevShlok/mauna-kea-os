"use client";
import Link from "next/link";
import { FunnelChart } from "@/components/ui/FunnelChart";
import { StatCard } from "@/components/ui/StatCard";
import { Users, UserPlus, CheckCircle, Send, Building2, Bell, TrendingUp, Trophy } from "lucide-react";

const FUNNEL_DATA = [
  {label:"Shared",count:24,color:"#4a7ab5"},
  {label:"Review",count:18,color:"#123D8D"},
  {label:"Shortlisted",count:12,color:"#D8B15B"},
  {label:"Interviewing",count:8,color:"#1a4fa8"},
  {label:"Final Round",count:5,color:"#6b21a8"},
  {label:"Offer",count:3,color:"#065f46"},
  {label:"Joined",count:2,color:"#1A7340"}
];

const BAR_DATA = {
  func:[{l:"Finance",n:18},{l:"HR",n:12},{l:"Technology",n:10},{l:"Operations",n:5},{l:"Sales",n:3}],
  exp:[{l:"10-15 yrs",n:20},{l:"15-20 yrs",n:16},{l:"20+ yrs",n:8},{l:"5-10 yrs",n:4}],
  roles:[{l:"CFO",n:14},{l:"CHRO",n:10},{l:"CTO",n:8},{l:"VP Finance",n:7},{l:"MD/CEO",n:4}]
};

function BarChart({ data, color }: { data:{l:string,n:number}[]; color: string }) {
  return (
    <div className="flex flex-col gap-2">
      {data.map((d) => (
        <div key={d.l} className="flex items-center gap-3">
          <div className="w-20 text-xs text-gray-400 text-right shrink-0">{d.l}</div>
          <div className="flex-1 bg-gray-100 rounded h-5 overflow-hidden">
            <div className="h-full rounded flex items-center px-2" style={{ width: ((d.n/20)*100) + "%", backgroundColor: color }}>
              <span className="text-white text-xs font-bold">{d.n}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FloatListDashPage() {
  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Float List Dashboard</h1>
        <div className="flex gap-2">
          <a href="/api/export-csv" className="px-4 py-2 bg-gray-100 text-gray-600 rounded text-xs font-bold hover:bg-gray-200 transition-colors inline-block text-center cursor-pointer">Export CSV</a>
          <Link href="/dashboard/float-list/database/new" className="px-4 py-2 bg-yellow-500 text-blue-900 rounded text-xs font-bold hover:bg-yellow-400 transition-colors inline-block">+ Add Candidate</Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Candidates" value="48" trend="YTD" icon={<Users size={18}/>}/>
        <StatCard label="Added This Month" value="7" trend="New" icon={<UserPlus size={18}/>}/>
        <StatCard label="Active" value="31" trend="Available" icon={<CheckCircle size={18}/>}/>
        <StatCard label="Submitted" value="24" trend="To clients" icon={<Send size={18}/>}/>
        <StatCard label="Clients Engaged" value="12" trend="This year" icon={<Building2 size={18}/>}/>
        <StatCard label="Follow-Ups Due" value="3" trend="Action needed" icon={<Bell size={18}/>} warn/>
        <StatCard label="Placement Ratio" value="18%" trend="YTD" icon={<TrendingUp size={18}/>}/>
        <StatCard label="Placed" value="8" trend="YTD" icon={<Trophy size={18}/>} gold/>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Function Distribution</h3>
          <BarChart data={BAR_DATA.func} color="#123D8D"/>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Experience Levels</h3>
          <BarChart data={BAR_DATA.exp} color="#D8B15B"/>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Top Dream Roles</h3>
          <BarChart data={BAR_DATA.roles} color="#4a7ab5"/>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 text-sm">Submission Pipeline</h3>
          <span className="text-xs text-gray-400">Click stage to view</span>
        </div>
        <FunnelChart data={FUNNEL_DATA} total={24}/>
      </div>
    </div>
  );
}