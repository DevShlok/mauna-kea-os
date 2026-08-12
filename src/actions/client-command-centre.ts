"use server";

import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { mandateCandidates, downloadLogs, departments, mandatePositions, mandates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── 1. RECRUITER CANDIDATE VISIBILITY SETTINGS ───────────
export async function updateCandidateVisibilityAction(data: {
  mandateCandidateId: number;
  visibleToClient?: boolean;
  showContactDetails?: boolean;
  showCompensation?: boolean;
  showAssessment?: boolean;
  showComments?: boolean;
}) {
  await requireRole(["admin", "consultant"]);

  const updates: Record<string, any> = {};
  if (data.visibleToClient !== undefined) updates.visibleToClient = data.visibleToClient;
  if (data.showContactDetails !== undefined) updates.showContactDetails = data.showContactDetails;
  if (data.showCompensation !== undefined) updates.showCompensation = data.showCompensation;
  if (data.showAssessment !== undefined) updates.showAssessment = data.showAssessment;
  if (data.showComments !== undefined) updates.showComments = data.showComments;

  await db
    .update(mandateCandidates)
    .set(updates)
    .where(eq(mandateCandidates.id, data.mandateCandidateId));

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

// ─── 2. DUAL RANKING ACTIONS ──────────────────────────────
export async function updateConsultantRankingAction(mandateCandidateId: number, ranking: "P1" | "P2" | "P3" | null) {
  const { platformUser } = await requireRole(["admin", "consultant"]);

  const [existing] = await db.select().from(mandateCandidates).where(eq(mandateCandidates.id, mandateCandidateId));
  if (!existing) throw new Error("Mandate candidate not found");

  await db
    .update(mandateCandidates)
    .set({ consultantRanking: ranking })
    .where(eq(mandateCandidates.id, mandateCandidateId));

  // Audit log entry on mandate
  const [mandate] = await db.select().from(mandates).where(eq(mandates.id, existing.mandateId));
  if (mandate) {
    const auditLog = mandate.auditLog || {};
    auditLog[`ranking_consultant_${mandateCandidateId}_${Date.now()}`] = {
      updatedBy: platformUser?.name || "Consultant",
      updatedAt: new Date().toISOString(),
    };
    await db.update(mandates).set({ auditLog }).where(eq(mandates.id, existing.mandateId));
  }

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

export async function updateClientRankingAction(mandateCandidateId: number, ranking: "P1" | "P2" | "P3" | null) {
  const { platformUser } = await requireRole(["admin", "consultant", "client"]);

  const [existing] = await db.select().from(mandateCandidates).where(eq(mandateCandidates.id, mandateCandidateId));
  if (!existing) throw new Error("Mandate candidate not found");

  await db
    .update(mandateCandidates)
    .set({ clientRanking: ranking })
    .where(eq(mandateCandidates.id, mandateCandidateId));

  // Audit log entry on mandate
  const [mandate] = await db.select().from(mandates).where(eq(mandates.id, existing.mandateId));
  if (mandate) {
    const auditLog = mandate.auditLog || {};
    auditLog[`ranking_client_${mandateCandidateId}_${Date.now()}`] = {
      updatedBy: platformUser?.name || "Client User",
      updatedAt: new Date().toISOString(),
    };
    await db.update(mandates).set({ auditLog }).where(eq(mandates.id, existing.mandateId));
  }

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

// ─── 3. DOCUMENT DOWNLOAD LOGGING ─────────────────────────
export async function logDocumentDownloadAction(data: {
  mandateId?: number;
  candidateId?: string;
  documentType: string;
}) {
  const { platformUser } = await requireRole(["admin", "consultant", "client"]);

  await db.insert(downloadLogs).values({
    tenantId: platformUser?.linkedClientId || "GLOBAL",
    userId: platformUser?.id || "anon",
    userName: platformUser?.name || "User",
    userRole: platformUser?.role || "client",
    mandateId: data.mandateId,
    candidateId: data.candidateId,
    documentType: data.documentType,
    downloadedAt: new Date(),
  });

  return { success: true };
}

// ─── 4. DEPARTMENTS & POSITIONS MANAGEMENT ────────────────
export async function getDepartmentsAction(clientId: string) {
  await requireRole(["admin", "consultant", "client"]);
  return await db.select().from(departments).where(eq(departments.clientId, clientId));
}

export async function createDepartmentAction(clientId: string, name: string) {
  await requireRole(["admin", "consultant", "client"]);
  const [created] = await db.insert(departments).values({ clientId, name }).returning();
  revalidatePath("/dashboard", "layout");
  return created;
}

export async function getMandatePositionsAction(mandateId: number) {
  await requireRole(["admin", "consultant", "client"]);
  return await db.select().from(mandatePositions).where(eq(mandatePositions.mandateId, mandateId));
}

export async function createMandatePositionAction(data: {
  mandateId: number;
  title: string;
  jobDescription?: string;
  location?: string;
  minCompensation?: number;
  maxCompensation?: number;
}) {
  await requireRole(["admin", "consultant"]);
  const [created] = await db.insert(mandatePositions).values(data).returning();
  revalidatePath("/dashboard", "layout");
  return created;
}
