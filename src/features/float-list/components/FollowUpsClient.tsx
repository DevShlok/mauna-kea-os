"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addFollowUpAction } from "@/actions";

const STATUS_STYLES: Record<string, string> = {
  today: "bg-orange-100 text-orange-800 border-orange-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
  upcoming: "bg-blue-100 text-[#133255] border-blue-200",
};

export default function FollowUpsClient({ initialFollowUps }: { initialFollowUps: any[] }) {
  const router = useRouter();
  const [followUps, setFollowUps] = useState(initialFollowUps);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ candName: "", candId: "", client: "", role: "", dueDate: "", note: "" });

  const overdue = followUps.filter((f) => f.status === "overdue");
  const today = followUps.filter((f) => f.status === "today");
  const upcoming = followUps.filter((f) => f.status === "upcoming");

  const Card = ({ f }: { f: typeof followUps[0] }) => (
    <div className={"bg-white border-l-4 rounded-xl p-4 shadow-sm mb-3 cursor-pointer hover:shadow-md transition-shadow " + (STATUS_STYLES[f.status || ""] || "border-gray-200")} onClick={() => router.push("/dashboard/float-list/" + f.candId)}>
      <div className="flex justify-between items-start">
        <div>
          <div className="font-bold text-gray-900 text-sm">{f.candName}</div>
          <div className="text-xs text-gray-400 mt-0.5">{f.role} @ {f.client}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">{f.consultant}</div>
          <div className={"text-xs font-bold mt-1 " + (f.status === "overdue" ? "text-red-600" : f.status === "today" ? "text-orange-600" : "text-[#133255]")}>Due: {f.dueDate}</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">{f.note}</div>
      <div className="flex gap-2 mt-3">
        <button className="px-3 py-1 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255]" onClick={(e) => { e.stopPropagation(); }}>Mark Done</button>
        <button className="px-3 py-1 neo-btn text-gray-500 text-xs font-bold" onClick={(e) => { e.stopPropagation(); }}>Snooze</button>
        <button className="px-3 py-1 neo-btn text-gray-500 text-xs font-bold" onClick={(e) => { e.stopPropagation(); router.push("/dashboard/float-list/" + f.candId); }}>View Profile</button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 pb-10 pt-6">
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[26px] font-serif font-bold text-[#133255] tracking-tight">
            Follow-Ups Tracker
          </h1>
          <p className="text-[13.5px] text-[#6b7a99] mt-1">
            {followUps.length.toLocaleString()} active follow-up tasks
          </p>
        </div>

        <button 
          onClick={() => setIsAdding(true)} 
          className="h-10 px-5 neo-btn text-[#133255] text-[13.5px] font-bold transition-all flex items-center gap-2"
        >
          + Add Follow-Up
        </button>
      </div>

      {/* ── KPI Stat Cards ─────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { label: "Overdue", value: overdue.length, color: "text-[#c53030]" },
          { label: "Due Today", value: today.length, color: "text-[#b7791f]" },
          { label: "Upcoming", value: upcoming.length, color: "text-[#2a44a0]" },
          { label: "Total Follow-Ups", value: followUps.length, color: "text-[#133255]" },
        ].map((kpi, i) => (
          <div
            key={i}
            className="flex-1 min-w-[150px] neo-card-sm px-6 py-4 transition-transform hover:-translate-y-0.5"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {kpi.label}
            </div>
            <div className={`text-[24px] font-serif font-bold ${kpi.color}`}>
              {kpi.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <h2 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"/>
            Overdue ({overdue.length})
          </h2>
          {overdue.map((f) => <Card key={f.id} f={f}/>)}
        </div>
        <div>
          <h2 className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"/>
            Due Today ({today.length})
          </h2>
          {today.map((f) => <Card key={f.id} f={f}/>)}
          {today.length === 0 && <div className="text-center text-gray-300 text-sm py-8">All clear!</div>}
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#133255] uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#133255] inline-block"/>
            Upcoming ({upcoming.length})
          </h2>
          {upcoming.map((f) => <Card key={f.id} f={f}/>)}
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[400px] overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900">Add New Follow-Up</div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!form.candName) return;
              const { id: newId, candId } = await addFollowUpAction(form);
              
              setFollowUps([{
                id: newId,
                candName: form.candName,
                candId: candId,
                client: form.client,
                role: form.role,
                dueDate: form.dueDate,
                note: form.note,
                consultant: "System",
                status: "upcoming" // Simple optimistic status
              }, ...followUps]);

              setIsAdding(false);
              setForm({ candName: "", candId: "", client: "", role: "", dueDate: "", note: "" });
              router.refresh();
            }} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Candidate Name *</label>
                <input required value={form.candName} onChange={e => setForm({...form, candName: e.target.value})} className="w-full px-3 py-2 neo-inset text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="w-full px-3 py-2 neo-inset text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Client</label>
                  <input value={form.client} onChange={e => setForm({...form, client: e.target.value})} className="w-full px-3 py-2 neo-inset text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Note</label>
                <textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})} className="w-full px-3 py-2 neo-inset text-sm outline-none resize-none h-20" placeholder="Follow-up details..." />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 neo-btn text-gray-600 text-xs font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255]">Add Follow-Up</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
