import { requireRole } from "@/lib/auth";
import { getCandidateById } from "@/db/queries";
import { db } from "@/db";
import { candidateBadges } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getGuidanceForCandidateAction } from "@/actions/guidance";
import { GuidanceClient } from "@/features/candidate-portal/components/GuidanceClient";

export default async function CandidateGuidancePage() {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;

  const [candidate, badgeRows] = await Promise.all([
    getCandidateById(candId),
    db
      .select()
      .from(candidateBadges)
      .where(and(eq(candidateBadges.candId, candId), eq(candidateBadges.badgeType, "assessment_complete")))
      .limit(1),
  ]);

  const tier = (badgeRows[0]?.metadata as { tier?: "A" | "B" | "C" })?.tier ?? null;
  const dreamRoles = (candidate?.dreamRoles as string[]) ?? [];
  const targetRole = dreamRoles[0] ?? "*";

  const blocks = tier ? await getGuidanceForCandidateAction(tier, targetRole) : [];

  return (
    <GuidanceClient 
      blocks={blocks} 
      tier={tier} 
      candidateDesignation={candidate?.designation ?? undefined}
      candidateDreamRoles={dreamRoles}
    />
  );
}
