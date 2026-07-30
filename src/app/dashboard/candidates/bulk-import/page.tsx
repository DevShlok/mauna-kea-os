import BulkCVImportClient from "@/components/candidates/BulkCVImportClient";
import { Upload, FileText, Zap } from "lucide-react";
import Link from "next/link";

export default function BulkImportPage() {
  return (
    <div className="min-h-screen bg-[#f4f7fd]">
      {/* Header */}
      <div className="bg-white border-b border-[#e4e8f0] px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#DCE5F4] flex items-center justify-center">
              <Upload size={18} className="text-[#133255]" />
            </div>
            <div>
              <h1 className="text-[22px] font-serif font-bold text-[#133255] tracking-tight">
                Bulk CV Import
              </h1>
              <p className="text-[13px] text-[#6b7a99] mt-0.5">
                Upload multiple CVs at once — they&apos;ll be parsed and added to the database automatically.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/candidates"
            className="h-9 px-4 bg-white border border-[#e4e8f0] text-[#475569] rounded-xl text-[13px] font-semibold hover:bg-[#f8fafc] transition-all flex items-center gap-2 shadow-sm"
          >
            ← Back to Candidates
          </Link>
        </div>
      </div>

      {/* How it works banner */}
      <div className="max-w-4xl mx-auto px-8 pt-6">
        <div className="bg-[#DCE5F4] border border-[#bacce6] rounded-xl p-4 flex items-start gap-4">
          <Zap size={18} className="text-[#133255] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[13.5px] font-bold text-[#133255]">How it works</p>
            <p className="text-[13px] text-[#3a4f70] mt-0.5">
              Drop one or more files below. Each is uploaded, text is extracted automatically, and a candidate profile is created or updated in the database.
              Supports <strong>PDFs</strong>, <strong>Word documents</strong> (.docx / .doc), and <strong>images</strong> (.jpg, .png, .webp) — images are processed with Gemini Vision OCR.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-8 py-6">
        <BulkCVImportClient />
      </div>
    </div>
  );
}
