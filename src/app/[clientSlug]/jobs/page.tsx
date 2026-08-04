import { requireRole } from "@/lib/auth";

export default async function CandidateJobsPage() {
  await requireRole(["candidate"]);
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center py-16">
      <h2 className="text-xl font-serif font-bold text-[#133255] mb-2">Curated Opportunities</h2>
      <p className="text-gray-500 text-sm">Targeted job listings for your profile are coming soon.</p>
    </div>
  );
}
