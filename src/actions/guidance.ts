"use server";

import { db } from "@/db";
import { guidanceBlocks } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getGuidanceForCandidateAction(tier: string, targetRole: string) {
  if (!tier) return [];

  // Fetch all active blocks that match tier or wildcard
  const blocks = await db
    .select()
    .from(guidanceBlocks)
    .where(
      and(
        eq(guidanceBlocks.isActive, true),
        or(eq(guidanceBlocks.tier, tier), eq(guidanceBlocks.tier, "*")),
        or(eq(guidanceBlocks.targetRole, targetRole), eq(guidanceBlocks.targetRole, "*"))
      )
    );

  // Sort by specificity: exact match > tier-only > role-only > wildcard
  return blocks.sort((a, b) => {
    const scoreA = (a.tier !== "*" ? 2 : 0) + (a.targetRole !== "*" ? 1 : 0);
    const scoreB = (b.tier !== "*" ? 2 : 0) + (b.targetRole !== "*" ? 1 : 0);
    return scoreB - scoreA;
  });
}

export async function upsertGuidanceBlockAction(data: {
  id?: number;
  tier: string;
  targetRole: string;
  title: string;
  body: string;
}) {
  await requireRole(["admin", "consultant"]);
  if (data.id) {
    await db
      .update(guidanceBlocks)
      .set({
        tier: data.tier,
        targetRole: data.targetRole,
        title: data.title,
        body: data.body,
      })
      .where(eq(guidanceBlocks.id, data.id));
  } else {
    await db.insert(guidanceBlocks).values({
      tier: data.tier,
      targetRole: data.targetRole,
      title: data.title,
      body: data.body,
      isActive: true,
    });
  }
  revalidatePath("/dashboard/guidance");
  return { success: true };
}

export async function deleteGuidanceBlockAction(id: number) {
  await requireRole(["admin", "consultant"]);
  await db.update(guidanceBlocks).set({ isActive: false }).where(eq(guidanceBlocks.id, id));
  revalidatePath("/dashboard/guidance");
  return { success: true };
}
