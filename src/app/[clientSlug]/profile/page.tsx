import { requireRole } from "@/lib/auth";
import { getCandidateById } from "@/db/queries";
import { CandidateProfileView } from "@/features/candidate-portal/components/CandidateProfileView";
import { getPendingProfileChangeRequestAction } from "@/actions/candidate-portal";
import { db } from "@/db";
import { candidateVerifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function CandidateProfilePage() {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;
  
  const [candidate, [verification], pendingRequest] = await Promise.all([
    getCandidateById(candId),
    db.select().from(candidateVerifications).where(eq(candidateVerifications.candId, candId)).limit(1),
    getPendingProfileChangeRequestAction(candId),
  ]);

  return (
    <CandidateProfileView 
      candidate={candidate} 
      isVerified={verification?.status === 'Verified'} 
      pendingRequest={pendingRequest} 
    />
  );
}

