import { requireRole } from "@/lib/auth";
import { getCandidateById } from "@/db/queries";
import { CandidateProfileView } from "@/features/candidate-portal/components/CandidateProfileView";
import { db } from "@/db";
import { candidateVerifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function CandidateProfilePage() {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;
  
  const [candidate, [verification]] = await Promise.all([
    getCandidateById(candId),
    db.select().from(candidateVerifications).where(eq(candidateVerifications.candId, candId)).limit(1)
  ]);

  return <CandidateProfileView candidate={candidate} isVerified={verification?.status === 'Verified'} />;
}
