import { requireRole } from "@/lib/auth";
import { VerificationStatusClient } from "@/features/candidate-portal/components/VerificationStatusClient";
import { VerificationBadgesPanel } from "@/features/candidate-portal/components/VerificationBadgesPanel";
import { db } from "@/db";
import { referenceChecks, candidateVerifications, candidateBadges } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export default async function CandidateVerificationPage() {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;

  const [checks, [verification], badges] = candId 
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
          eq(referenceChecks.isSharedWithClient, true)
        )),
        db.select().from(candidateVerifications).where(eq(candidateVerifications.candId, candId)).limit(1),
        db.select().from(candidateBadges).where(eq(candidateBadges.candId, candId))
      ])
    : [[], [], []];

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Verification & Badges</h1>
      <VerificationBadgesPanel badges={badges} />
      
      <div className="mt-12">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Network Feedback</h2>
        <VerificationStatusClient candId={candId} checks={checks} verificationStatus={verification || null} />
      </div>
    </div>
  );
}
