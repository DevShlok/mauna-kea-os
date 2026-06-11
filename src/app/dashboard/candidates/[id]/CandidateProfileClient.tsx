"use client";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function CandidateProfileClient({ mandates }: { mandates: any[] }) {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const mandateId = Number(searchParams.get("mandateId"));

  const mandate = mandates.find((m) => m.id === mandateId) || mandates[0];
  const candidate = mandate?.candidates.find((c: any) => c.id == id || c.externalId == id) || mandate?.candidates[0];

  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to remove this candidate from the pipeline? This will also remove their submission record.")) return;
    setIsDeleting(true);
    await import("@/app/actions").then(m => m.removeCandidateFromMandateAction({
      id: candidate.id,
      externalId: candidate.externalId,
      company: mandate.company,
      role: mandate.role,
      mandateId: mandate.id
    }));
    router.push("/dashboard/candidates");
  }

  if (!candidate || !mandate) {
    return <div className="p-10 text-center text-gray-400">Candidate not found.</div>;
  }

  const criteria = [
    { name: "P&L Management", score: candidate.score ? Math.min(100, Math.round(candidate.score * 9 + 5)) : null },
    { name: "Financial Controls", score: candidate.score ? Math.min(100, Math.round(candidate.score * 8 + 10)) : null },
    { name: "Strategic Acumen", score: candidate.score ? Math.min(100, Math.round(candidate.score * 9)) : null },
    { name: "Stakeholder Management", score: candidate.score ? Math.min(100, Math.round(candidate.score * 8 + 5)) : null },
    { name: "Team Leadership", score: candidate.score ? Math.min(100, Math.round(candidate.score * 9 + 3)) : null },
  ];

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex items-center gap-2 text-sm text-gray-400 font-semibold mb-6">
        <Link href="/dashboard" className="hover:text-blue-900">Home</Link>
        <span>/</span>
        <Link href="/dashboard/mandates" className="hover:text-blue-900">Mandates</Link>
        <span>/</span>
        <Link href={"/dashboard/mandates/" + mandate.id} className="hover:text-blue-900">{mandate.role}</Link>
        <span>/</span>
        <span className="text-gray-800">{candidate.name}</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-start gap-5 mb-6">
        <div className="w-16 h-16 rounded-full bg-yellow-500 text-blue-900 flex items-center justify-center text-2xl font-bold shrink-0">
          {candidate.initials}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{candidate.role} · {candidate.company}</p>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={candidate.stage} />
            {candidate.score && (
              <span className={"px-2 py-0.5 rounded-full text-xs font-bold " + (candidate.score >= 8 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800")}>{candidate.score}/10</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.back()} className="px-4 py-2 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">← Back</button>
          <button onClick={() => alert("Edit candidate details (Coming Soon)")} className="px-4 py-2 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">Edit</button>
          <button onClick={() => router.push("/dashboard/workbench?candId=" + candidate.id + "&mandateId=" + mandate.id)} className="px-4 py-2 bg-blue-900 text-white rounded text-xs font-bold hover:bg-blue-800">Open in Workbench</button>
          <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded text-xs font-bold hover:bg-red-100">{isDeleting ? 'Deleting...' : 'Delete'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-base mb-4">Competency Assessment</h3>
          {candidate.score ? (
            <>
              {criteria.map((cr) => (
                <div key={cr.name} className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{cr.name}</span>
                    <span className="font-bold text-blue-900">{cr.score}%</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-900 h-full rounded-full transition-all" style={{ width: (cr.score || 0) + "%" }}/>
                  </div>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm text-gray-500">Overall Score</span>
                <span className={"px-3 py-1 rounded-full text-sm font-bold " + (candidate.score >= 8 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800")}>{candidate.score}/10</span>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400 py-10">No assessment completed yet</div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-base mb-4">Career Timeline</h3>
          <div className="flex flex-col gap-4">
            {[["2022-Present", "HDFC Bank", "Deputy CFO"], ["2018-2022", "Axis Bank", "VP Finance"], ["2014-2018", "Deloitte", "Senior Manager"]].map(([yr, co, rol]) => (
              <div key={yr} className="flex gap-3">
                <div className="w-1 bg-blue-900 rounded-full shrink-0 mt-1"/>
                <div>
                  <div className="font-bold text-sm text-gray-900">{co}</div>
                  <div className="text-xs text-gray-400">{rol} · {yr}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="text-sm font-bold text-blue-900 mb-2">MK Recommendation</div>
            <div className="text-sm text-gray-600 leading-relaxed">
              {candidate.score && candidate.score >= 8
                ? <><strong className="text-green-700">Strong Hire.</strong> Candidate demonstrates exceptional leadership and strategic acumen aligned with the mandate requirements.</>
                : candidate.score
                ? <><strong className="text-yellow-700">Consider.</strong> Solid profile with a few gaps — worth a detailed conversation.</>
                : "Assessment not yet completed. Open in Workbench to generate a report."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
