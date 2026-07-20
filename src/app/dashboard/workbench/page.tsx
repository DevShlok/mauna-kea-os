import { requireRole } from "@/lib/auth";
import { getMandateCandidateByExtId, getFrameworks, getCandidates, getAllMandateCandidates, getMandates, getMandatesLight, getCandidateById, getUserByEmail } from "@/db/queries";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import WorkbenchClient from "@/features/workbench/components/WorkbenchClient";

export default async function WorkbenchPage({ searchParams  }: { searchParams: Promise<{ candId?: string, mandateId?: string, flCandId?: string }> }) {
  const { platformUser: pUser, email } = await requireRole(["admin", "consultant"]);
  const resolvedParams = await searchParams;
  const { candId, flCandId } = resolvedParams;
  
  let initialCandidate = null;

  if (candId) {
    initialCandidate = await getMandateCandidateByExtId(candId);
  } else if (flCandId) {
    initialCandidate = await getCandidateById(flCandId);
  }

  let frameworksList = await getFrameworks();
  
  let candidates: any[] = [];
  let mandatesList = await getMandatesLight();
  let readOnly = false;
  
  if (email) {
    if (pUser?.role === "client" && pUser.linkedClientId) {
      readOnly = true;
      const [client] = await db.select().from(clients).where(eq(clients.id, pUser.linkedClientId));
      if (client) {
        mandatesList = mandatesList.filter(m => m.company === client.name);
      } else {
        mandatesList = [];
      }
    } else if (pUser?.role === "candidate" && pUser.linkedCandidateId) {
      readOnly = true;
      mandatesList = [];
    }
  }

  return (
    <WorkbenchClient 
      initialCandidate={initialCandidate} 
      frameworks={frameworksList}
      candidates={candidates}
      mandates={mandatesList}
      readOnly={readOnly}
    />
  );
}
