"use client";

import Link from "next/link";
import FormatOne from "@/components/reports/FormatOne";
import FormatTwo from "@/components/reports/FormatTwo";

export default function ReportViewerClient({ mandate, candidates, format }: { mandate: any, candidates: any[], format: string }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/mandates/${mandate.id}`} className="text-sm font-bold text-gray-500 hover:text-blue-900">
              ← Back to Mandate
            </Link>
            <div className="h-4 w-px bg-gray-300"></div>
            <h1 className="text-lg font-bold text-gray-900 font-serif">Report Viewer</h1>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold uppercase tracking-wider">
              Format {format}
            </span>
          </div>
          <button onClick={handlePrint} className="px-4 py-2 bg-blue-900 text-white rounded text-sm font-bold hover:bg-blue-800">
            Print / Save PDF
          </button>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 mt-10 print:mt-0 print:px-0">
        {format === "1" && <FormatTwo mandate={mandate} candidates={candidates} />}
        {format === "2" && <FormatOne mandate={mandate} candidates={candidates} />}
      </div>
    </div>
  );
}
