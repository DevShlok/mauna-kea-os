"use server";

import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import {
  mandateCandidates, downloadLogs, departments, mandatePositions, mandates,
  interviews, clientActionTasks, candidateActivityLog, clientNotifications,
  consultantNotifications, clients, platformUsers, clientUserDepartmentAccess,
  clientUserMandateAccess,
} from "@/db/schema";
import { eq, and, desc, asc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { newUserId } from "@/lib/ids";

// ─── 1. RECRUITER CANDIDATE VISIBILITY SETTINGS ───────────────────────────────
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

// ─── 2. DUAL RANKING ACTIONS ──────────────────────────────────────────────────
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

// ─── 3. DOCUMENT DOWNLOAD LOGGING ─────────────────────────────────────────────
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

// ─── 4. DEPARTMENTS & POSITIONS MANAGEMENT ────────────────────────────────────
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

// ─── 5. CLIENT DECISION (Interview / Hold / Reject / MoreInfo) ────────────────
export async function submitClientDecisionAction(data: {
  mandateCandidateId: number;
  decision: "Interview" | "Hold" | "Reject" | "MoreInfo";
  interviewRound?: number;
  interviewRoundLabel?: string;
  rejectionReasons?: string[];
  rejectionOther?: string;
}) {
  const { platformUser } = await requireRole(["admin", "consultant", "client"]);

  const [mc] = await db
    .select()
    .from(mandateCandidates)
    .where(eq(mandateCandidates.id, data.mandateCandidateId));
  if (!mc) throw new Error("Mandate candidate not found");

  // Update the mandate candidate row
  const updates: Record<string, any> = {
    clientDecision: data.decision,
    clientDecisionAt: new Date(),
  };
  if (data.decision === "Reject") {
    updates.clientRejectionReasons = data.rejectionReasons || [];
    updates.clientRejectionOther = data.rejectionOther || null;
  }

  await db
    .update(mandateCandidates)
    .set(updates)
    .where(eq(mandateCandidates.id, data.mandateCandidateId));

  // Write activity log
  const decisionLabel: Record<string, string> = {
    Interview: "Interview Requested",
    Hold: "Placed on Hold",
    Reject: "Rejected",
    MoreInfo: "More Information Requested",
  };
  await db.insert(candidateActivityLog).values({
    mandateId: mc.mandateId,
    mandateCandidateId: data.mandateCandidateId,
    actionType: `client_decision_${data.decision.toLowerCase()}`,
    description: decisionLabel[data.decision] || data.decision,
    previousState: mc.clientDecision || "No Decision",
    newState: data.decision,
    performedBy: platformUser?.name || "Client User",
    performedByRole: platformUser?.role || "client",
    performedAt: new Date(),
  });

  // Notify the mandate consultant
  const [mandate] = await db.select().from(mandates).where(eq(mandates.id, mc.mandateId));
  if (mandate) {
    await db.insert(consultantNotifications).values({
      message: `Client decision for ${mandate.role}: ${decisionLabel[data.decision]}`,
      link: `/dashboard/mandates/${mc.mandateId}`,
      targetRole: "consultant",
    });
  }

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

// ─── 6. SCHEDULE INTERVIEW ────────────────────────────────────────────────────
export async function scheduleInterviewAction(data: {
  mandateId: number;
  mandateCandidateId: number;
  round: number;
  roundLabel: string;
  interviewerName?: string;
  interviewerRole?: string;
  scheduledDate: string;
  scheduledTime: string;
}) {
  const { platformUser } = await requireRole(["admin", "consultant", "client"]);

  // Insert interview row
  const [created] = await db.insert(interviews).values({
    mandateId: data.mandateId,
    mandateCandidateId: data.mandateCandidateId,
    round: data.round,
    roundLabel: data.roundLabel,
    interviewerName: data.interviewerName,
    interviewerRole: data.interviewerRole,
    scheduledDate: data.scheduledDate,
    scheduledTime: data.scheduledTime,
    status: "Scheduled",
    createdBy: platformUser?.name || "User",
  }).returning();

  // Increment interview round on mandate candidate
  await db
    .update(mandateCandidates)
    .set({ interviewRoundCurrent: data.round })
    .where(eq(mandateCandidates.id, data.mandateCandidateId));

  // Write activity log
  await db.insert(candidateActivityLog).values({
    mandateId: data.mandateId,
    mandateCandidateId: data.mandateCandidateId,
    actionType: "interview_scheduled",
    description: `${data.roundLabel} scheduled for ${data.scheduledDate} at ${data.scheduledTime}`,
    previousState: null,
    newState: "Scheduled",
    performedBy: platformUser?.name || "User",
    performedByRole: platformUser?.role || "client",
    performedAt: new Date(),
  });

  revalidatePath("/dashboard", "layout");
  return { success: true, interviewId: created.id };
}

// ─── 7. RECORD INTERVIEW FEEDBACK ─────────────────────────────────────────────
export async function recordInterviewFeedbackAction(data: {
  interviewId: number;
  recommendation: string;
  feedbackText: string;
}) {
  const { platformUser } = await requireRole(["admin", "consultant", "client"]);

  const [existing] = await db.select().from(interviews).where(eq(interviews.id, data.interviewId));
  if (!existing) throw new Error("Interview not found");

  await db
    .update(interviews)
    .set({
      recommendation: data.recommendation,
      feedbackText: data.feedbackText,
      status: "Completed",
    })
    .where(eq(interviews.id, data.interviewId));

  // Write activity log
  await db.insert(candidateActivityLog).values({
    mandateId: existing.mandateId,
    mandateCandidateId: existing.mandateCandidateId,
    actionType: "interview_feedback_recorded",
    description: `Interview feedback recorded: ${data.recommendation}`,
    previousState: "Scheduled",
    newState: `Completed - ${data.recommendation}`,
    performedBy: platformUser?.name || "User",
    performedByRole: platformUser?.role || "client",
    performedAt: new Date(),
  });

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

// ─── 8. SUBMIT NEXT STEPS TASK ────────────────────────────────────────────────
export async function submitNextStepsAction(data: {
  mandateId: number;
  selectedSteps: string[];
  freeTextComment?: string;
}) {
  const { platformUser } = await requireRole(["admin", "consultant", "client"]);

  if (data.selectedSteps.length === 0) {
    throw new Error("Please select at least one next step.");
  }

  const [clientId] = platformUser?.linkedClientId
    ? [platformUser.linkedClientId]
    : [null];

  const [created] = await db.insert(clientActionTasks).values({
    mandateId: data.mandateId,
    clientId: clientId ?? undefined,
    selectedSteps: data.selectedSteps,
    freeTextComment: data.freeTextComment || null,
    submittedBy: platformUser?.id || "anon",
    submittedByName: platformUser?.name || "Client User",
    submittedAt: new Date(),
    status: "Open",
  }).returning();

  // Notify consultant
  const [mandate] = await db.select().from(mandates).where(eq(mandates.id, data.mandateId));
  if (mandate) {
    await db.insert(consultantNotifications).values({
      message: `Next Steps submitted by client for: ${mandate.role} (${data.selectedSteps.slice(0, 2).join(", ")}${data.selectedSteps.length > 2 ? "..." : ""})`,
      link: `/dashboard/mandates/${data.mandateId}`,
      targetRole: "consultant",
    });
  }

  revalidatePath("/dashboard", "layout");
  return { success: true, taskId: created.id };
}

// ─── 9. GET NEXT STEPS TASKS (Recruiter side) ─────────────────────────────────
export async function getNextStepsTasksAction(mandateId: number) {
  await requireRole(["admin", "consultant"]);
  return await db
    .select()
    .from(clientActionTasks)
    .where(eq(clientActionTasks.mandateId, mandateId))
    .orderBy(desc(clientActionTasks.submittedAt));
}

// ─── 10. UPDATE NEXT STEPS TASK STATUS ───────────────────────────────────────
export async function updateNextStepsTaskStatusAction(data: {
  taskId: number;
  status: "Acknowledged" | "InProgress" | "Completed";
}) {
  const { platformUser } = await requireRole(["admin", "consultant"]);

  const [existing] = await db.select().from(clientActionTasks).where(eq(clientActionTasks.id, data.taskId));
  if (!existing) throw new Error("Task not found");

  const updates: Record<string, any> = { status: data.status };
  const now = new Date();

  if (data.status === "Acknowledged") {
    updates.acknowledgedBy = platformUser?.name || "Consultant";
    updates.acknowledgedAt = now;
  } else if (data.status === "Completed") {
    updates.completedBy = platformUser?.name || "Consultant";
    updates.completedAt = now;
  }

  await db.update(clientActionTasks).set(updates).where(eq(clientActionTasks.id, data.taskId));

  // Notify client when completed
  if (data.status === "Completed" && existing.clientId) {
    const [mandate] = await db.select().from(mandates).where(eq(mandates.id, existing.mandateId));
    if (mandate) {
      await db.insert(clientNotifications).values({
        clientId: existing.clientId,
        mandateId: existing.mandateId,
        type: "next_steps_completed",
        title: "Next Steps Completed",
        message: `Your requested next steps for "${mandate.role}" have been completed.`,
        link: `/mandates/${existing.mandateId}`,
        isRead: false,
        createdAt: new Date(),
      });
    }
  }

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

// ─── 11. GET CANDIDATE ACTIVITY LOG ──────────────────────────────────────────
export async function getCandidateActivityLogAction(mandateCandidateId: number) {
  await requireRole(["admin", "consultant", "client"]);
  return await db
    .select()
    .from(candidateActivityLog)
    .where(eq(candidateActivityLog.mandateCandidateId, mandateCandidateId))
    .orderBy(desc(candidateActivityLog.performedAt));
}

// ─── 12. GET MANDATE INTERVIEWS ───────────────────────────────────────────────
export async function getMandateInterviewsAction(mandateId: number, mandateCandidateId?: number) {
  await requireRole(["admin", "consultant", "client"]);
  if (mandateCandidateId) {
    return await db
      .select()
      .from(interviews)
      .where(and(eq(interviews.mandateId, mandateId), eq(interviews.mandateCandidateId, mandateCandidateId)))
      .orderBy(asc(interviews.round), desc(interviews.createdAt));
  }
  return await db
    .select()
    .from(interviews)
    .where(eq(interviews.mandateId, mandateId))
    .orderBy(asc(interviews.round), desc(interviews.createdAt));
}

// ─── 13. CLIENT USER AUTOMATED INVITATION (CP-8) ─────────────────────────────
export async function inviteClientUserAction(data: {
  name: string;
  email: string;
  clientId: string;
  departmentIds?: number[];
  mandateIds?: number[];
}) {
  const { platformUser } = await requireRole(["admin", "consultant"]);

  // Check if client user already exists
  const existing = await db
    .select()
    .from(platformUsers)
    .where(eq(platformUsers.email, data.email.toLowerCase().trim()))
    .limit(1);

  let userId: string;
  if (existing.length > 0) {
    userId = existing[0].id;
    await db
      .update(platformUsers)
      .set({
        name: data.name,
        role: "client",
        linkedClientId: data.clientId,
        status: "Invited",
      })
      .where(eq(platformUsers.id, userId));
  } else {
    userId = newUserId();
    await db.insert(platformUsers).values({
      id: userId,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      role: "client",
      linkedClientId: data.clientId,
      status: "Invited",
      initials: data.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase(),
      createdAt: new Date(),
    });
  }

  // Set Department Grants (CP-6)
  if (data.departmentIds && data.departmentIds.length > 0) {
    await grantDepartmentAccessAction(userId, data.departmentIds, platformUser?.name || "Consultant");
  }

  // Set Mandate Grants (CP-7)
  if (data.mandateIds && data.mandateIds.length > 0) {
    await grantMandateAccessAction(userId, data.mandateIds, platformUser?.name || "Consultant");
  }

  // Create notification for audit
  await db.insert(clientNotifications).values({
    clientId: data.clientId,
    mandateId: data.mandateIds?.[0] || 0,
    type: "user_invited",
    title: "Client Portal Invitation Sent",
    message: `Invitation email sent to ${data.name} (${data.email}).`,
    link: `/dashboard/clients/${data.clientId}`,
    isRead: false,
  });

  revalidatePath("/dashboard", "layout");
  return { success: true, userId, inviteUrl: `/sign-in?email=${encodeURIComponent(data.email)}` };
}

// ─── 14. DEPARTMENT ACCESS MANAGEMENT (CP-6) ─────────────────────────────────
export async function grantDepartmentAccessAction(userId: string, departmentIds: number[], grantedBy = "Admin") {
  await requireRole(["admin", "consultant"]);

  // Delete existing department grants for user
  await db.delete(clientUserDepartmentAccess).where(eq(clientUserDepartmentAccess.userId, userId));

  // Insert new grants
  if (departmentIds.length > 0) {
    const values = departmentIds.map((deptId) => ({
      userId,
      departmentId: deptId,
      grantedBy,
    }));
    await db.insert(clientUserDepartmentAccess).values(values);
  }

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

// ─── 15. MANDATE OVERRIDE ACCESS MANAGEMENT (CP-7) ───────────────────────────
export async function grantMandateAccessAction(userId: string, mandateIds: number[], grantedBy = "Admin") {
  await requireRole(["admin", "consultant"]);

  // Delete existing mandate override grants for user
  await db.delete(clientUserMandateAccess).where(eq(clientUserMandateAccess.userId, userId));

  // Insert new grants
  if (mandateIds.length > 0) {
    const values = mandateIds.map((mId) => ({
      userId,
      mandateId: mId,
      grantedBy,
    }));
    await db.insert(clientUserMandateAccess).values(values);
  }

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

// ─── 16. GET CLIENT USER ACCESS PERMISSIONS ──────────────────────────────────
export async function getClientUserAccessAction(userId: string) {
  await requireRole(["admin", "consultant", "client"]);

  const deptAccess = await db
    .select()
    .from(clientUserDepartmentAccess)
    .where(eq(clientUserDepartmentAccess.userId, userId));

  const mandateAccess = await db
    .select()
    .from(clientUserMandateAccess)
    .where(eq(clientUserMandateAccess.userId, userId));

  return {
    departmentIds: deptAccess.map((d) => d.departmentId),
    mandateIds: mandateAccess.map((m) => m.mandateId),
  };
}

