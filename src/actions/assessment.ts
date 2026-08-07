"use server";

import { db } from "@/db";
import { candidateReports, candidateBadges, candidates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { computeTier, type RubricScores } from "@/lib/rubric";

export type { RubricScores } from "@/lib/rubric";

export async function saveAssessmentAction(
  candId: string,
  scores: RubricScores,
  status: "Draft" | "Completed" = "Completed"
) {
  const { platformUser } = await requireRole(["admin", "consultant"]);
  const { total, tier } = computeTier(scores);
  const reportData = {
    scores,
    total,
    tier,
    assessedBy: platformUser?.name ?? "Consultant",
    assessedAt: new Date().toISOString(),
  };

  const existingReports = await db
    .select()
    .from(candidateReports)
    .where(eq(candidateReports.candidateId, candId));

  const rubricReport = existingReports.find(
    (r) => r.frameworkId === "rubric-assessment"
  );

  if (rubricReport) {
    await db
      .update(candidateReports)
      .set({ reportData, status, sharedWithClient: false })
      .where(eq(candidateReports.id, rubricReport.id));
  } else {
    await db.insert(candidateReports).values({
      id: "RUBRIC-" + Date.now(),
      candidateId: candId,
      frameworkId: "rubric-assessment",
      status,
      reportData,
      sharedWithClient: false,
    });
  }

  if (status === "Completed") {
    await db
      .insert(candidateBadges)
      .values({
        candId,
        badgeType: "assessment_complete",
        earnedAt: new Date(),
        metadata: { tier, total },
      })
      .onConflictDoUpdate({
        target: [candidateBadges.candId, candidateBadges.badgeType],
        set: {
          earnedAt: new Date(),
          metadata: { tier, total },
        },
      });

    await db
      .update(candidates)
      .set({ score: total, assessDate: new Date().toISOString().split("T")[0] })
      .where(eq(candidates.id, candId));
  }

  revalidatePath(`/dashboard/candidates/${candId}`);
  revalidatePath(`/dashboard/candidates/${candId}/assessment`);
  return { success: true, tier, total };
}

export async function getAssessmentAction(candId: string) {
  const reports = await db
    .select()
    .from(candidateReports)
    .where(eq(candidateReports.candidateId, candId));
  return reports.find((r) => r.frameworkId === "rubric-assessment") ?? null;
}