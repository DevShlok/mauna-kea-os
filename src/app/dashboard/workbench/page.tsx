import { getMandateCandidateByExtId, getFrameworks, getFlCandidates, getAllMandateCandidates, getMandates } from "@/db/queries";
import WorkbenchClient from "@/app/dashboard/workbench/WorkbenchClient";

export default async function WorkbenchPage({ searchParams }: { searchParams: Promise<{ candId?: string, mandateId?: string }> }) {
  const resolvedParams = await searchParams;
  const { candId } = resolvedParams;
  
  let initialCandidate = null;
  if (candId) {
    initialCandidate = await getMandateCandidateByExtId(candId);
  }

  const [frameworksList, flCandidates, mandateCandidates, mandatesList] = await Promise.all([
    getFrameworks(),
    getFlCandidates(),
    getAllMandateCandidates(),
    getMandates()
  ]);
  
  return (
    <WorkbenchClient 
      initialCandidate={initialCandidate} 
      frameworks={frameworksList}
      flCandidates={flCandidates}
      mandateCandidates={mandateCandidates}
      mandates={mandatesList}
    />
  );
}
