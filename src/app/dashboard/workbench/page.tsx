import { getMandateCandidateByExtId, getFrameworks, getCandidates, getAllMandateCandidates, getMandates, getCandidateById } from "@/db/queries";
import WorkbenchClient from "@/app/dashboard/workbench/WorkbenchClient";

export default async function WorkbenchPage({ searchParams }: { searchParams: Promise<{ candId?: string, mandateId?: string, flCandId?: string }> }) {
  const resolvedParams = await searchParams;
  const { candId, flCandId } = resolvedParams;
  
  let initialCandidate = null;
  if (candId) {
    initialCandidate = await getMandateCandidateByExtId(candId);
  } else if (flCandId) {
    initialCandidate = await getCandidateById(flCandId);
  }

  const [frameworksList, candidates, mandateCandidates, mandatesList] = await Promise.all([
    getFrameworks(),
    getCandidates(),
    getAllMandateCandidates(),
    getMandates()
  ]);
  
  return (
    <WorkbenchClient 
      initialCandidate={initialCandidate} 
      frameworks={frameworksList}
      candidates={candidates}
      mandateCandidates={mandateCandidates}
      mandates={mandatesList}
    />
  );
}
