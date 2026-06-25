import { getMandateCandidateByExtId, getFrameworks, getCandidates, getAllMandateCandidates, getMandates, getCandidateById, getUserByEmail } from "@/db/queries";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
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

  let [frameworksList, candidates, mandateCandidates, mandatesList] = await Promise.all([
    getFrameworks(),
    getCandidates(),
    getAllMandateCandidates(),
    getMandates()
  ]);
  
  let readOnly = false;
  const user = await currentUser();
  if (user?.primaryEmailAddress?.emailAddress) {
    const pUser = await getUserByEmail(user.primaryEmailAddress.emailAddress);
    if (pUser?.role === "client" && pUser.linkedClientId) {
      readOnly = true;
      const [client] = await db.select().from(clients).where(eq(clients.id, pUser.linkedClientId));
      if (client) {
        mandatesList = mandatesList.filter(m => m.company === client.name);
        const allowedMandateIds = mandatesList.map(m => m.id);
        mandateCandidates = mandateCandidates.filter(mc => allowedMandateIds.includes(mc.mandateId));
        // Client shouldn't see candidates from the general float list (unless submitted to their mandates)
        // so we filter out all `candidates` (master DB) to force them to select from `mandateCandidates`
        candidates = [];
      } else {
        mandatesList = [];
        mandateCandidates = [];
        candidates = [];
      }
    } else if (pUser?.role === "candidate" && pUser.linkedCandidateId) {
      readOnly = true;
      mandatesList = [];
      mandateCandidates = [];
      candidates = candidates.filter(c => c.id.toString() === pUser.linkedCandidateId);
    }
  }

  return (
    <WorkbenchClient 
      initialCandidate={initialCandidate} 
      frameworks={frameworksList}
      candidates={candidates}
      mandateCandidates={mandateCandidates}
      mandates={mandatesList}
      readOnly={readOnly}
    />
  );
}
