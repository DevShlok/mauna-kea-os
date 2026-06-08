import { getMandateCandidateByExtId } from "@/db/queries";
import WorkbenchClient from "@/app/dashboard/workbench/WorkbenchClient";

export default async function WorkbenchPage({ searchParams }: { searchParams: Promise<{ candId?: string, mandateId?: string }> }) {
  const resolvedParams = await searchParams;
  const { candId } = resolvedParams;
  let candidate = null;
  if (candId) {
    candidate = await getMandateCandidateByExtId(candId);
  }
  return <WorkbenchClient candidate={candidate} />;
}
