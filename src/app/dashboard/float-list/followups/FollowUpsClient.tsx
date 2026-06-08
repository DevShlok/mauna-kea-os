"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addFollowUpAction } from "@/app/actions";

const STATUS_STYLES: Record<string, string> = {
  today: "bg-orange-100 text-orange-800 border-orange-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
  upcoming: "bg-blue-100 text-blue-800 border-blue-200",
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
          <div className={"text-xs font-bold mt-1 " + (f.status === "overdue" ? "text-red-600" : f.status === "today" ? "text-orange-600" : "text-blue-700")}>Due: {f.dueDate}</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">{f.note}</div>
      <div className="flex gap-2 mt-3">
        <button className="px-3 py-1 bg-blue-900 text-white rounded text-xs font-bold hover:bg-blue-800" onClick={(e) => { e.stopPropagation(); }}>Mark Done</button>
        <button className="px-3 py-1 border border-gray-200 text-gray-500 rounded text-xs font-bold hover:bg-gray-50" onClick={(e) => { e.stopPropagation(); }}>Snooze</button>
        <button className="px-3 py-1 border border-gray-200 text-gray-500 rounded text-xs font-bold hover:bg-gray-50" onClick={(e) => { e.stopPropagation(); router.push("/dashboard/float-list/" + f.candId); }}>View Profile</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Follow-Ups</h1>
        <button onClick={() => setIsAdding(true)} className="px-4 py-2 bg-yellow-500 text-blue-900 rounded text-xs font-bold hover:bg-yellow-400">+ Add Follow-Up</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[{label:"Overdue",count:overdue.length,cls:"text-red-600"},{label:"Due Today",count:today.length,cls:"text-orange-600"},{label:"Upcoming",count:upcoming.length,cls:"text-blue-700"}].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm">
            <div className="text-xs font-bold text-gray-400 uppercase mb-1">{s.label}</div>
            <div className={"text-4xl font-bold " + s.cls}>{s.count}</div>
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
          <h2 className="text-sm font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"/>
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
                <input required value={form.candName} onChange={e => setForm({...form, candName: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Client</label>
                  <input value={form.client} onChange={e => setForm({...form, client: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Note</label>
                <textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none resize-none h-20" placeholder="Follow-up details..." />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-900 text-white rounded text-xs font-bold hover:bg-blue-800">Add Follow-Up</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
