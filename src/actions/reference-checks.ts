"use server";

import { db } from "@/db";
import { referenceChecks, candidateVerifications, candidateNotifications, candidates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createReferenceCheckAction(data: {
  candId: string;
  conductedBy?: string;
  refereeName?: string;
  refereeRelationship?: string;
  refereeCompany?: string;
  status?: string;
  responses?: Record<string, string>;
  summaryPositives?: string;
  summaryImprovements?: string;
  summaryNeutral?: string;
  isSharedWithClient?: boolean;
}) {
  const [newCheck] = await db.insert(referenceChecks).values({
    candId: data.candId,
    conductedBy: data.conductedBy || "Consultant",
    refereeName: data.refereeName || "",
    refereeRelationship: data.refereeRelationship || "Peer",
    refereeCompany: data.refereeCompany || "",
    status: data.status || "In Progress",
    responses: data.responses || {},
    summaryPositives: data.summaryPositives || "",
    summaryImprovements: data.summaryImprovements || "",
    summaryNeutral: data.summaryNeutral || "",
    isSharedWithClient: data.isSharedWithClient || false,
  }).returning();

  revalidatePath(`/dashboard/candidates/${data.candId}`);
  revalidatePath(`/candidate/verification`);
  return newCheck;
}

export async function updateReferenceCheckAction(id: number, data: {
  conductedBy?: string;
  refereeName?: string;
  refereeRelationship?: string;
  refereeCompany?: string;
  status?: string;
  responses?: Record<string, string>;
  summaryPositives?: string;
  summaryImprovements?: string;
  summaryNeutral?: string;
  isSharedWithClient?: boolean;
  isVerified?: boolean;
}) {
  const [updated] = await db.update(referenceChecks)
    .set(data)
    .where(eq(referenceChecks.id, id))
    .returning();

  if (updated) {
    revalidatePath(`/dashboard/candidates/${updated.candId}`);
    revalidatePath(`/candidate/verification`);
  }
  return updated;
}

export async function deleteReferenceCheckAction(id: number, candId: string) {
  await db.delete(referenceChecks).where(eq(referenceChecks.id, id));
  revalidatePath(`/dashboard/candidates/${candId}`);
  revalidatePath(`/candidate/verification`);
  return { success: true };
}

export async function toggleClientShareAction(id: number, isSharedWithClient: boolean, candId: string) {
  await db.update(referenceChecks)
    .set({ isSharedWithClient })
    .where(eq(referenceChecks.id, id));

  revalidatePath(`/dashboard/candidates/${candId}`);
  revalidatePath(`/candidate/verification`);
  return { success: true };
}

export async function markCandidateVerifiedAction(candId: string, verifiedBy: string) {
  const now = new Date();
  
  // Upsert candidateVerifications
  const existing = await db.select().from(candidateVerifications).where(eq(candidateVerifications.candId, candId)).limit(1);
  
  if (existing.length > 0) {
    await db.update(candidateVerifications)
      .set({
        status: 'Verified',
        badgeLevel: 'full',
        verifiedAt: now,
        verifiedBy,
        updatedAt: now
      })
      .where(eq(candidateVerifications.candId, candId));
  } else {
    await db.insert(candidateVerifications).values({
      candId,
      status: 'Verified',
      badgeLevel: 'full',
      verifiedAt: now,
      verifiedBy
    });
  }

  // Create Candidate Notification
  await db.insert(candidateNotifications).values({
    candId,
    type: 'status_update',
    message: 'Your profile reference checks have been verified! A Verified Badge is now visible on your profile.',
    link: '/candidate/verification'
  });

  revalidatePath(`/dashboard/candidates/${candId}`);
  revalidatePath(`/candidate/verification`);
  revalidatePath(`/candidate/profile`);
  return { success: true };
}
