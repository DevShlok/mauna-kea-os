import { Briefcase } from "lucide-react";

export default function CandidateJobsPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 flex flex-col items-center justify-center text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-[#D8B15B]"
        style={{
          background: "rgba(216,177,91,0.12)",
          border: "1px solid rgba(216,177,91,0.25)",
        }}
      >
        <Briefcase className="w-8 h-8" />
      </div>
      <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#D8B15B]/15 text-[#D8B15B] mb-3">
        Phase 3 Feature
      </span>
      <h1 className="text-white text-2xl font-bold mb-2">Curated Jobs Feed</h1>
      <p className="text-white/40 text-[14px] max-w-sm">
        Curated executive opportunities tailored to your profile will be available here soon.
      </p>
    </div>
  );
}
