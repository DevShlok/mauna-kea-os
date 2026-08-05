import { requireRole } from "@/lib/auth";
import { getCandidateApplicationsAction } from "@/actions/candidate-applications";
import { ApplicationsClient } from "@/features/candidate-portal/components/ApplicationsClient";

export default async function CandidateApplicationsPage() {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;

  const { directApps = [], consultantFloats = [] } = await getCandidateApplicationsAction(candId);

  return <ApplicationsClient directApps={directApps} consultantFloats={consultantFloats} candId={candId} />;
}
