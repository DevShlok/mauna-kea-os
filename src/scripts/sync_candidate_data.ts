import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { db } from "@/db";
import { candidates, candidateReports, candidateBadges, candidateVerifications, referenceChecks } from "@/db/schema";
import { eq, and } from "drizzle-orm";

async function main() {
  console.log("=== Starting Data Synchronization Script ===");

  // 1. Fetch all candidates
  const allCandidates = await db.select().from(candidates).where(eq(candidates.isDeleted, false));
  console.log(`Found ${allCandidates.length} total candidates.`);

  let syncedAssessments = 0;
  let syncedVerifications = 0;
  let syncedProfileBadges = 0;

  for (const cand of allCandidates) {
    const candId = cand.id;

    // A. Assessment Sync
    const reports = await db
      .select()
      .from(candidateReports)
      .where(and(eq(candidateReports.candidateId, candId), eq(candidateReports.frameworkId, "rubric-assessment")));
    
    const rubricReport = reports[0];
    if (rubricReport && rubricReport.status === "Completed") {
      const data = rubricReport.reportData as any;
      const tier = data?.tier || (data?.total >= 70 ? "A" : data?.total >= 50 ? "B" : "C");
      const total = data?.total || cand.score || 0;

      // Ensure candidate.score is updated
      if (cand.score !== total) {
        await db.update(candidates).set({ score: total }).where(eq(candidates.id, candId));
      }

      // Ensure assessment_complete badge exists
      await db
        .insert(candidateBadges)
        .values({
          candId,
          badgeType: "assessment_complete",
          earnedAt: rubricReport.createdAt || new Date(),
          metadata: { tier, total },
        })
        .onConflictDoUpdate({
          target: [candidateBadges.candId, candidateBadges.badgeType],
          set: { metadata: { tier, total } },
        });

      syncedAssessments++;
    }

    // B. Verification & Reference Check Badge Sync
    const verif = await db.select().from(candidateVerifications).where(eq(candidateVerifications.candId, candId)).limit(1);
    const refCheckRows = await db.select().from(referenceChecks).where(eq(referenceChecks.candId, candId));

    if ((verif[0]?.status === "Verified" || refCheckRows.some(r => r.status === "Completed" || r.isVerified)) && candId) {
      await db
        .insert(candidateBadges)
        .values({
          candId,
          badgeType: "reference_check_complete",
          earnedAt: verif[0]?.verifiedAt || new Date(),
          metadata: { verifiedBy: verif[0]?.verifiedBy || "Consultant" },
        })
        .onConflictDoUpdate({
          target: [candidateBadges.candId, candidateBadges.badgeType],
          set: { earnedAt: verif[0]?.verifiedAt || new Date() },
        });

      syncedVerifications++;
    }

    // C. Profile Completed Badge Sync
    if (cand.profileCompletedAt) {
      await db
        .insert(candidateBadges)
        .values({
          candId,
          badgeType: "profile_complete",
          earnedAt: cand.profileCompletedAt,
        })
        .onConflictDoUpdate({
          target: [candidateBadges.candId, candidateBadges.badgeType],
          set: { earnedAt: cand.profileCompletedAt },
        });

      syncedProfileBadges++;
    }
  }

  console.log(`Synchronization Complete:`);
  console.log(`- Assessment Badges & Scores Synced: ${syncedAssessments}`);
  console.log(`- Verification Badges Synced: ${syncedVerifications}`);
  console.log(`- Profile Complete Badges Synced: ${syncedProfileBadges}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Error during sync:", err);
  process.exit(1);
});
