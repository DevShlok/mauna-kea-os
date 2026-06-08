"use client";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { DATA } from "@/db/mockData";

export default function FlCandidateProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const candidate = DATA.flCandidates.find((c) => c.id === id);

  if (!candidate) {
    return <div className="p-10 text-center text-gray-400">Candidate not found.</div>;
  }

  const activities = (DATA.flActivities as Record<string, {date:string,time:string,consultant:string,note:string,type:string}[]>)[candidate.id] || [];
  const submissions = DATA.flSubmissions.filter((s) => s.candId === candidate.id);
  const followUps = DATA.flFollowUps.filter((f) => f.candId === candidate.id);

  const statusColor = candidate.status === "Active" ? "bg-green-100 text-green-800" : candidate.status === "Passive" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-700";

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex items-center gap-2 text-sm text-gray-400 font-semibold mb-6">
        <Link href="/dashboard/float-list/database" className="hover:text-blue-900">Float List</Link>
        <span>/</span>
        <span className="text-gray-800">{candidate.name}</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-start gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-blue-900 text-white flex items-center justify-center text-2xl font-bold shrink-0">{candidate.initials}</div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
              <p className="text-gray-500 text-sm mt-0.5">{candidate.designation} · {candidate.company}</p>
              <p className="text-gray-400 text-xs mt-0.5">{candidate.location}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={"px-2 py-0.5 rounded-full text-xs font-bold " + statusColor}>{candidate.status}</span>
                {candidate.score && <span className={"px-2 py-0.5 rounded-full text-xs font-bold " + (candidate.score >= 8 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800")}>{candidate.score}/10</span>}
                {candidate.qual.map((q) => (<span key={q} className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded text-xs font-bold">{q}</span>))}
              </div>
            </div>
            <div className="flex gap-2">
              <a href={candidate.linkedin} target="_blank" rel="noreferrer" className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">LinkedIn</a>
              <button className="px-3 py-1.5 bg-blue-900 text-white rounded text-xs font-bold hover:bg-blue-800">Submit to Client</button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{l:"Experience",v:candidate.exp + " yrs"},{l:"Current CTC",v:"Rs " + candidate.ctc + "L"},{l:"Expected CTC",v:"Rs " + candidate.expected + "L"},{l:"Notice Period",v:candidate.notice + " days"},{l:"Mobile",v:candidate.mobile},{l:"Email",v:candidate.email}].map((item) => (
          <div key={item.l} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-gray-400 font-bold uppercase mb-1">{item.l}</div>
            <div className="text-sm font-bold text-gray-800">{item.v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Dream Roles</h3>
          <div className="flex flex-wrap gap-2">
            {candidate.dreamRoles.map((r) => (<span key={r} className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-bold">{r}</span>))}
          </div>
          <h3 className="font-bold text-gray-900 text-sm mt-5 mb-3">Dream Companies</h3>
          <div className="flex flex-wrap gap-2">
            {candidate.dreamCos.map((co) => (<span key={co} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{co}</span>))}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Experience Tags</h3>
          <div className="flex flex-col gap-2">
            {candidate.expTags.map((t) => (<div key={t} className="flex items-center gap-2 text-sm text-gray-600"><span className="w-1.5 h-1.5 rounded-full bg-blue-900 shrink-0"/>{t}</div>))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Submissions ({submissions.length})</h3>
          {submissions.length === 0 ? (
            <div className="text-center text-gray-300 text-sm py-4">No submissions yet</div>
          ) : submissions.map((s) => (
            <div key={s.id} className="border border-gray-100 rounded-lg p-3 mb-2">
              <div className="flex justify-between items-start">
                <div className="font-semibold text-sm text-gray-800">{s.role} @ {s.client}</div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">{s.status}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{s.dateShared} · {s.consultant}</div>
              <div className="text-xs text-gray-600 mt-1 italic">{s.response}</div>
            </div>
          ))}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Activity Log</h3>
          {activities.length === 0 ? (
            <div className="text-center text-gray-300 text-sm py-4">No activity recorded</div>
          ) : activities.map((a, i) => (
            <div key={i} className="flex gap-3 mb-4">
              <div className="w-1 bg-blue-900 rounded-full shrink-0 mt-1"/>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-bold">{a.type}</span>
                  <span className="text-xs text-gray-400">{a.date} {a.time}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">{a.note}</div>
                <div className="text-xs text-gray-400 mt-0.5">by {a.consultant}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}