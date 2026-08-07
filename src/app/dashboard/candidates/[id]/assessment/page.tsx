import { requireRole } from "@/lib/auth";
import { getCandidateById } from "@/db/queries";
import { getAssessmentAction } from "@/actions/assessment";
import { AssessmentRubricPanel } from "@/features/candidates/components/AssessmentRubricPanel";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { redirect } from "next/navigation";

export default async function CandidateAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "consultant"]);
  const { id } = await params;
  const [candidate, existingReport] = await Promise.all([getCandidateById(id), getAssessmentAction(id)]);
  if (!candidate) redirect("/dashboard/candidates");
  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <Link href={`/dashboard/candidates/${id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#133255] mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to {candidate.name || "Candidate"}
      </Link>
      <h1 className="text-2xl font-bold text-[#133255] mb-2">Assessment</h1>
      <p className="text-sm text-slate-500 font-medium mb-8">Complete the MK rubric to compute a Tier A/B/C rating.</p>
      <AssessmentRubricPanel candId={id} existingReport={existingReport} />
    </div>
  );
}