import { requireRole } from "@/lib/auth";
import { VerificationStatusClient } from "@/features/candidate-portal/components/VerificationStatusClient";
import { db } from "@/db";
import { referenceChecks, candidateVerifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export default async function CandidateVerificationPage() {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;

  const [checks, [verification]] = candId 
    ? await Promise.all([
        db.select({
          id: referenceChecks.id,
          refereeRelationship: referenceChecks.refereeRelationship,
          summaryPositives: referenceChecks.summaryPositives,
          summaryImprovements: referenceChecks.summaryImprovements,
          summaryNeutral: referenceChecks.summaryNeutral,
          status: referenceChecks.status,
        }).from(referenceChecks)
        .where(and(
          eq(referenceChecks.candId, candId),
          eq(referenceChecks.status, 'Completed')
        )),
        db.select().from(candidateVerifications).where(eq(candidateVerifications.candId, candId)).limit(1)
      ])
    : [[], []];

  return <VerificationStatusClient candId={candId} checks={checks} verificationStatus={verification || null} />;
}
