import { requireRole } from "@/lib/auth";
import { getCandidateById, getMandates } from "@/db/queries";
import FlCandidateClient from "@/features/candidates/components/FlCandidateClient";
import { redirect } from "next/navigation";

export default async function CandidateProfilePage() {
  const { platformUser, userRole } = await requireRole(["candidate"]);
  
  if (!platformUser?.linkedCandidateId) {
    return <div className="p-10 text-center text-gray-400">No candidate profile linked to your account.</div>;
  }

  const candidate = await getCandidateById(platformUser.linkedCandidateId);
  const mandates = await getMandates();

  if (!candidate) {
    return <div className="p-10 text-center text-gray-400">Candidate not found.</div>;
  }

  // Pass readOnly as true since Candidates should not be able to edit their own internal pipeline status
  return <FlCandidateClient candidate={candidate} mandates={mandates} userRole={userRole} readOnly={true} />;
}
