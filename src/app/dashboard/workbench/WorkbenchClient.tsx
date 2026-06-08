"use client";

export default function WorkbenchClient({ candidate }: { candidate: any }) {
  if (!candidate) {
    return (
      <div className="max-w-screen-xl mx-auto pb-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">AI Workbench</h1>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-gray-500 text-sm">Please select a candidate to generate or review their assessment report.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Report: {candidate.name}</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">Edit Score</button>
          <button className="px-4 py-2 bg-blue-900 text-white rounded text-xs font-bold hover:bg-blue-800">Export PDF</button>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 rounded bg-blue-900 text-white flex items-center justify-center text-lg font-bold shrink-0">{candidate.initials}</div>
          <div>
            <div className="font-bold text-lg text-gray-900">{candidate.name}</div>
            <div className="text-sm text-gray-500">{candidate.role} · {candidate.company}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-gray-400 font-bold uppercase mb-1">Overall Score</div>
            <div className={"text-3xl font-bold " + ((candidate.score || 0) >= 8 ? "text-green-600" : (candidate.score || 0) >= 6.5 ? "text-yellow-600" : "text-red-600")}>
              {candidate.score || "-"}/10
            </div>
          </div>
        </div>
        <hr className="border-gray-100" />
        <div>
          <h3 className="font-bold text-gray-900 mb-2">Executive Summary</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {candidate.name} is a strong candidate for the {candidate.mandateRole} position at {candidate.mandateCompany}. 
            Their background aligns well with the core requirements. This is an automatically generated placeholder report.
          </p>
        </div>
      </div>
    </div>
  );
}
