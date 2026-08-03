import { requireRole } from "@/lib/auth";
import { getCandidateFloatsAction } from "@/actions/candidate-portal";
import { ApplicationsClient } from "@/features/candidate-portal/components/ApplicationsClient";

export default async function ApplicationsPage() {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;

  const myFloats = await getCandidateFloatsAction(candId);

  return <ApplicationsClient floats={myFloats} candId={candId} />;
}
