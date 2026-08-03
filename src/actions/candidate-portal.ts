"use server";

import { db } from "@/db";
import {
  floats,
  candidates,
  candidateNotifications,
  consultantNotifications,
  platformUsers,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ─── Nudge Consultant ────────────────────────────────────────────────────────
export async function nudgeConsultantAction(floatId: string) {
  await requireRole(["candidate"]);

  const [floatData] = await db
    .select({
      id: floats.id,
      candId: floats.candId,
      client: floats.client,
      role: floats.role,
      consultant: floats.consultant,
      candCompany: candidates.company,
      candRole: candidates.designation,
      targetCompany: candidates.targetCompany,
    })
    .from(floats)
    .leftJoin(candidates, eq(floats.candId, candidates.id))
    .where(eq(floats.id, floatId));

  if (!floatData) return { success: false, error: "Float not found" };

  const clientName =
    floatData.client ||
    floatData.targetCompany ||
    floatData.candCompany ||
    "Client Opportunity";
  const roleName =
    floatData.role || floatData.candRole || "Executive Role";

  // Stamp nudgeSentAt
  await db
    .update(floats)
    .set({ nudgeSentAt: new Date() })
    .where(eq(floats.id, floatId));

  // Try to route to specific consultant by name match
  const [consultantUser] = await db
    .select({ id: platformUsers.id })
    .from(platformUsers)
    .where(eq(platformUsers.name, floatData.consultant ?? ""))
    .limit(1);

  // Omit id so PostgreSQL serial auto-increments correctly
  await db.insert(consultantNotifications).values({
    userId: consultantUser?.id ?? null,
    targetRole: consultantUser ? null : "consultant",
    message: `A candidate is requesting a status update on their application to ${clientName} – ${roleName}. Please follow up with the client.`,
    link: `/dashboard/float-list/${floatData.candId}`,
    isRead: false,
  });

  return { success: true };
}

// ─── Save Structured Float Feedback (Consultant Action) ─────────────────────
export async function saveFloatFeedbackAction(
  floatId: string,
  feedback: {
    feedbackPositives: string;
    feedbackImprovements: string;
    feedbackNextSteps: string;
    interviewDate?: string;
  }
) {
  await requireRole(["admin", "consultant"]);

  const [float] = await db.select().from(floats).where(eq(floats.id, floatId));
  if (!float) return { success: false };

  await db
    .update(floats)
    .set({
      feedbackPositives: feedback.feedbackPositives || null,
      feedbackImprovements: feedback.feedbackImprovements || null,
      feedbackNextSteps: feedback.feedbackNextSteps || null,
      interviewDate: feedback.interviewDate || null,
    })
    .where(eq(floats.id, floatId));

  // Notify candidate if feedback is available
  if (
    feedback.feedbackPositives ||
    feedback.feedbackImprovements ||
    feedback.feedbackNextSteps
  ) {
    const clientName = float.client || "Client Opportunity";
    const roleName = float.role || "Executive Position";

    await db.insert(candidateNotifications).values({
      candId: float.candId,
      type: "feedback_received",
      message: `Interview feedback is now available for your application to ${clientName} – ${roleName}.`,
      link: "/candidate/applications",
      isRead: false,
    });
  }

  revalidatePath("/dashboard/float-list");
  return { success: true };
}

// ─── Get Candidate Notifications ────────────────────────────────────────────
export async function getCandidateNotificationsAction(candId: string) {
  return await db
    .select()
    .from(candidateNotifications)
    .where(eq(candidateNotifications.candId, candId))
    .orderBy(desc(candidateNotifications.createdAt))
    .limit(20);
}

// ─── Mark Candidate Notifications as Read ───────────────────────────────────
export async function markCandidateNotificationsAsReadAction(candId: string) {
  await requireRole(["candidate"]);
  await db
    .update(candidateNotifications)
    .set({ isRead: true })
    .where(
      and(
        eq(candidateNotifications.candId, candId),
        eq(candidateNotifications.isRead, false)
      )
    );
}

// ─── Get Candidate's Floats ──────────────────────────────────────────────────
export async function getCandidateFloatsAction(candId: string) {
  const rows = await db
    .select({
      id: floats.id,
      candId: floats.candId,
      client: floats.client,
      role: floats.role,
      consultant: floats.consultant,
      dateShared: floats.dateShared,
      via: floats.via,
      followUp: floats.followUp,
      status: floats.status,
      response: floats.response,
      feedbackPositives: floats.feedbackPositives,
      feedbackImprovements: floats.feedbackImprovements,
      feedbackNextSteps: floats.feedbackNextSteps,
      interviewDate: floats.interviewDate,
      nudgeSentAt: floats.nudgeSentAt,
      isDeleted: floats.isDeleted,
      deletedAt: floats.deletedAt,
      deletedBy: floats.deletedBy,
      createdAt: floats.createdAt,
      updatedAt: floats.updatedAt,
      candCompany: candidates.company,
      candRole: candidates.designation,
      targetCompany: candidates.targetCompany,
    })
    .from(floats)
    .leftJoin(candidates, eq(floats.candId, candidates.id))
    .where(and(eq(floats.candId, candId), eq(floats.isDeleted, false)))
    .orderBy(desc(floats.createdAt));

  return rows.map((f) => ({
    ...f,
    client: f.client || f.targetCompany || f.candCompany || "Client Opportunity",
    role: f.role || f.candRole || "Executive Position",
    via: (f.via ?? []) as string[],
  }));
}

// ─── Update Candidate Self-Profile ──────────────────────────────────────────
export async function updateCandidateSelfProfileAction(
  candId: string,
  data: {
    name?: string;
    designation?: string;
    company?: string;
    location?: string;
    linkedin?: string;
    fixedCtc?: number;
    expectedCtc?: number;
    notice?: number;
    expTags?: string[];
    pastCompanies?: string[];
    qual?: any[];
  }
) {
  const { platformUser } = await requireRole(["candidate"]);
  if (platformUser?.linkedCandidateId !== candId) {
    throw new Error("Unauthorized to edit this profile");
  }

  await db
    .update(candidates)
    .set({
      ...(data.name && { name: data.name }),
      ...(data.designation !== undefined && { designation: data.designation }),
      ...(data.company !== undefined && { company: data.company }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.linkedin !== undefined && { linkedin: data.linkedin }),
      ...(data.fixedCtc !== undefined && { fixedCtc: data.fixedCtc, ctc: data.fixedCtc }),
      ...(data.expectedCtc !== undefined && { expected: data.expectedCtc }),
      ...(data.notice !== undefined && { notice: data.notice }),
      ...(data.expTags !== undefined && { expTags: data.expTags }),
      ...(data.pastCompanies !== undefined && { pastCompanies: data.pastCompanies }),
      ...(data.qual !== undefined && { qual: data.qual }),
      updatedAt: new Date(),
    })
    .where(eq(candidates.id, candId));

  revalidatePath("/candidate/profile");
  revalidatePath("/candidate");
  return { success: true };
}
