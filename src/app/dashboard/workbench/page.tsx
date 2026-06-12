import { getMandateCandidateByExtId, getFrameworks, getCandidates, getAllMandateCandidates, getMandates } from "@/db/queries";
import WorkbenchClient from "@/app/dashboard/workbench/WorkbenchClient";

export default async function WorkbenchPage({ searchParams }: { searchParams: Promise<{ candId?: string, mandateId?: string }> }) {
  const resolvedParams = await searchParams;
  const { candId } = resolvedParams;
  
  let initialCandidate = null;
  if (candId) {
    initialCandidate = await getMandateCandidateByExtId(candId);
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
