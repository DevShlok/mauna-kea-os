import { requireRole } from "@/lib/auth";
import { getCandidateById } from "@/db/queries";
import { CandidateProfileView } from "@/features/candidate-portal/components/CandidateProfileView";

export default async function CandidateProfilePage() {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;
  const candidate = await getCandidateById(candId);

  return <CandidateProfileView candidate={candidate} />;
}
