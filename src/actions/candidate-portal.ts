"use server";

import { db } from "@/db";
import {
  floats,
  candidates,
  candidateNotifications,
  consultantNotifications,
  platformUsers,
  candidateJobs,
  candidateJobInterests,
  dreamCompanyStatus,
  candidateApplications,
  candidateProfileChangeRequests,
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
export async function submitVerificationDocsAction(candId: string, docsBase64: string) {
  // Stub for Phase 2 actual doc upload
  return { success: true };
}

// ─── Phase 4: Candidate Profile Updates ──────────────────────────────────────
export async function updateProfilePhotoAction(candId: string, base64: string) {
  try {
    await db.update(candidates)
      .set({ profilePic: base64 })
      .where(eq(candidates.id, candId));
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update profile photo:", error);
    return { success: false, error: "Failed to update profile photo" };
  }
}

export async function getCandidateNotificationsAction(candId: string) {
  const { platformUser } = await requireRole(["candidate", "admin", "consultant"]);
  // Candidates can only read their own notifications; admins/consultants can read any
  if (platformUser?.role === "candidate" && platformUser?.linkedCandidateId !== candId) {
    return [];
  }
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
      clientId: floats.clientId,
      mandateId: floats.mandateId,
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

// ─── Sensitive Field Configuration (Requires Consultant Approval) ─────────────
const SENSITIVE_FIELDS_CONFIG: Record<string, { label: string; keyInDb: keyof typeof candidates.$inferSelect }> = {
  designation: { label: "Current Designation", keyInDb: "designation" },
  company: { label: "Current Company", keyInDb: "company" },
  currentCompanyStartDate: { label: "Current Company Start Date", keyInDb: "currentCompanyStartDate" },
  exp: { label: "Total Overall Experience (Years)", keyInDb: "exp" },
  expTags: { label: "Experience Tags / Focus Areas", keyInDb: "expTags" },
  pastCompanies: { label: "Past Companies", keyInDb: "pastCompanies" },
  priorExperiences: { label: "Prior Work History", keyInDb: "priorExperiences" },
  ctc: { label: "Current Total CTC", keyInDb: "ctc" },
  fixedCtc: { label: "Fixed CTC Component", keyInDb: "fixedCtc" },
  variableCtc: { label: "Variable CTC Component", keyInDb: "variableCtc" },
  expectedCtc: { label: "Expected CTC", keyInDb: "expected" },
  esops: { label: "ESOPs Value", keyInDb: "esops" },
  esopVesting: { label: "ESOP Vesting Schedule", keyInDb: "esopVesting" },
  notice: { label: "Notice Period (Days)", keyInDb: "notice" },
  stability: { label: "Career Stability Metric", keyInDb: "stability" },
  qual: { label: "Educational Qualifications", keyInDb: "qual" },
};

// ─── Update Candidate Self-Profile ──────────────────────────────────────────
export async function updateCandidateSelfProfileAction(
  candId: string,
  data: {
    name?: string;
    mobile?: string;
    email?: string;
    designation?: string;
    company?: string;
    location?: string;
    hometown?: string;
    dob?: string;
    relocationStatus?: string;
    relocationPrefs?: string[];
    linkedin?: string;
    exp?: number;
    currentCompanyStartDate?: string;
    ctc?: number;
    fixedCtc?: number;
    variableCtc?: number;
    expectedCtc?: number;
    esops?: number;
    esopVesting?: any;
    notice?: number;
    stability?: any;
    expTags?: string[];
    pastCompanies?: string[];
    priorExperiences?: any[];
    qual?: any[];
    dreamRoles?: string[];
    dreamCos?: string[];
    notes?: string;
  }
) {
  const { platformUser } = await requireRole(["candidate"]);
  if (platformUser?.linkedCandidateId !== candId) {
    throw new Error("Unauthorized to edit this profile");
  }

  // Fetch current DB values to perform field-by-field diff
  const [curr] = await db.select().from(candidates).where(eq(candidates.id, candId)).limit(1);
  if (!curr) throw new Error("Candidate profile not found");

  const immediateUpdates: Record<string, any> = {};
  const sensitiveChanges: Record<string, { label: string; current: any; proposed: any }> = {};

  // Non-sensitive fields (Update Immediately)
  if (data.name !== undefined && data.name !== curr.name) immediateUpdates.name = data.name;
  if (data.mobile !== undefined && data.mobile !== curr.mobile) immediateUpdates.mobile = data.mobile;
  if (data.email !== undefined && data.email !== curr.email) immediateUpdates.email = data.email;
  if (data.location !== undefined && data.location !== curr.location) immediateUpdates.location = data.location;
  if (data.hometown !== undefined && data.hometown !== curr.hometown) immediateUpdates.hometown = data.hometown;
  if (data.dob !== undefined && data.dob !== curr.dob) immediateUpdates.dob = data.dob;
  if (data.relocationStatus !== undefined && data.relocationStatus !== curr.relocationStatus) immediateUpdates.relocationStatus = data.relocationStatus;
  if (data.relocationPrefs !== undefined) immediateUpdates.relocationPrefs = data.relocationPrefs;
  if (data.linkedin !== undefined && data.linkedin !== curr.linkedin) immediateUpdates.linkedin = data.linkedin;
  if (data.dreamRoles !== undefined) immediateUpdates.dreamRoles = data.dreamRoles;
  if (data.dreamCos !== undefined) immediateUpdates.dreamCos = data.dreamCos;
  if (data.notes !== undefined && data.notes !== curr.notes) immediateUpdates.notes = data.notes;

  // Sensitive fields (Diff & Require Approval)
  for (const [fieldKey, fieldMeta] of Object.entries(SENSITIVE_FIELDS_CONFIG)) {
    const proposedVal = (data as any)[fieldKey];
    if (proposedVal !== undefined) {
      const currentVal = (curr as any)[fieldMeta.keyInDb];
      const stringifiedProp = JSON.stringify(proposedVal);
      const stringifiedCurr = JSON.stringify(currentVal ?? null);

      if (stringifiedProp !== stringifiedCurr) {
        sensitiveChanges[fieldKey] = {
          label: fieldMeta.label,
          current: currentVal ?? null,
          proposed: proposedVal,
        };
      }
    }
  }

  // Execute Immediate Updates
  if (Object.keys(immediateUpdates).length > 0) {
    immediateUpdates.updatedAt = new Date();
    await db.update(candidates).set(immediateUpdates).where(eq(candidates.id, candId));
  }

  // Create Change Request if Sensitive Fields were modified
  let pendingApprovalCreated = false;
  if (Object.keys(sensitiveChanges).length > 0) {
    await db.insert(candidateProfileChangeRequests).values({
      candId,
      status: "Pending",
      sensitiveChanges,
      createdAt: new Date(),
    });

    pendingApprovalCreated = true;

    // Trigger alert notification for consultants
    await db.insert(consultantNotifications).values({
      userId: null,
      targetRole: "consultant",
      message: `Candidate ${curr.name || candId} submitted profile updates (${Object.values(sensitiveChanges).map(s => s.label).join(", ")}) pending review.`,
      link: `/dashboard/candidates/${candId}`,
    });
  }

  revalidatePath("/candidate/profile");
  revalidatePath("/candidate");
  revalidatePath(`/${curr.slug || candId}`);

  return {
    success: true,
    pendingApproval: pendingApprovalCreated,
    pendingFields: Object.values(sensitiveChanges).map(s => s.label),
  };
}

// ─── Get Pending Profile Change Request ────────────────────────────────────
export async function getPendingProfileChangeRequestAction(candId: string) {
  const [request] = await db
    .select()
    .from(candidateProfileChangeRequests)
    .where(and(eq(candidateProfileChangeRequests.candId, candId), eq(candidateProfileChangeRequests.status, "Pending")))
    .orderBy(desc(candidateProfileChangeRequests.createdAt))
    .limit(1);

  return request || null;
}

// ─── Approve Candidate Profile Change Request (Consultant / Admin) ─────────
export async function approveProfileChangeRequestAction(requestId: number) {
  const { platformUser } = await requireRole(["admin", "consultant"]);

  const [request] = await db
    .select()
    .from(candidateProfileChangeRequests)
    .where(eq(candidateProfileChangeRequests.id, requestId))
    .limit(1);

  if (!request || request.status !== "Pending") {
    return { success: false, error: "Pending request not found" };
  }

  const sensitiveChanges = request.sensitiveChanges as Record<string, { label: string; current: any; proposed: any }>;
  const updatesToApply: Record<string, any> = { updatedAt: new Date() };

  for (const [fieldKey, change] of Object.entries(sensitiveChanges)) {
    const fieldMeta = SENSITIVE_FIELDS_CONFIG[fieldKey];
    if (fieldMeta) {
      updatesToApply[fieldMeta.keyInDb] = change.proposed;
    }
  }

  // 1. Update Candidate record in Master DB
  await db.update(candidates).set(updatesToApply).where(eq(candidates.id, request.candId));

  // 2. Mark Request as Approved
  await db
    .update(candidateProfileChangeRequests)
    .set({
      status: "Approved",
      reviewedBy: platformUser?.name || "Consultant",
      reviewedAt: new Date(),
    })
    .where(eq(candidateProfileChangeRequests.id, requestId));

  // 3. Notify Candidate
  await db.insert(candidateNotifications).values({
    candId: request.candId,
    type: "status_update",
    message: "Your requested profile updates (compensation, experience, or role details) have been approved and updated.",
    link: "/candidate/profile",
  });

  revalidatePath(`/dashboard/candidates/${request.candId}`);
  revalidatePath("/candidate/profile");
  return { success: true };
}

// ─── Reject Candidate Profile Change Request (Consultant / Admin) ──────────
export async function rejectProfileChangeRequestAction(requestId: number, reason?: string) {
  const { platformUser } = await requireRole(["admin", "consultant"]);

  const [request] = await db
    .select()
    .from(candidateProfileChangeRequests)
    .where(eq(candidateProfileChangeRequests.id, requestId))
    .limit(1);

  if (!request || request.status !== "Pending") {
    return { success: false, error: "Pending request not found" };
  }

  // 1. Mark Request as Rejected
  await db
    .update(candidateProfileChangeRequests)
    .set({
      status: "Rejected",
      reviewNotes: reason || "Profile changes do not match verification records.",
      reviewedBy: platformUser?.name || "Consultant",
      reviewedAt: new Date(),
    })
    .where(eq(candidateProfileChangeRequests.id, requestId));

  // 2. Notify Candidate
  await db.insert(candidateNotifications).values({
    candId: request.candId,
    type: "status_update",
    message: `Your requested profile updates were not approved. ${reason ? "Reason: " + reason : ""}`,
    link: "/candidate/profile",
  });

  revalidatePath(`/dashboard/candidates/${request.candId}`);
  revalidatePath("/candidate/profile");
  return { success: true };
}

// ─── Mark Job Interest ──────────────────────────────────────────────
export async function markJobInterestAction(jobId: number, status: 'Interested' | 'Not Interested') {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;

  const existing = await db
    .select()
    .from(candidateJobInterests)
    .where(
      and(
        eq(candidateJobInterests.jobId, jobId),
        eq(candidateJobInterests.candId, candId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(candidateJobInterests)
      .set({ status })
      .where(eq(candidateJobInterests.id, existing[0].id));
  } else {
    await db.insert(candidateJobInterests).values({
      jobId,
      candId,
      status,
    });
  }

  if (status === "Interested") {
    const [cand] = await db.select().from(candidates).where(eq(candidates.id, candId)).limit(1);
    const [job] = await db.select().from(candidateJobs).where(eq(candidateJobs.id, jobId)).limit(1);
    
    await db.insert(consultantNotifications).values({
      userId: null,
      targetRole: "consultant",
      message: `Candidate ${cand?.name || candId} expressed interest in curated job: ${job?.title || '#' + jobId}`,
      link: `/dashboard/candidate-jobs`,
    });
  }

  revalidatePath("/candidate/jobs");
  return { success: true };
}

// ─── Add Dream Company ──────────────────────────────────────────────
export async function addDreamCompanyAction(companyName: string) {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;

  const [cand] = await db.select().from(candidates).where(eq(candidates.id, candId)).limit(1);
  if (!cand) throw new Error("Candidate not found");

  const dreamCos = (cand.dreamCos as string[]) ?? [];

  if (dreamCos.length >= 10) {
    return { success: false, error: "Maximum limit of 10 dream companies reached." };
  }

  if (dreamCos.some((c) => c.toLowerCase() === companyName.toLowerCase())) {
    return { success: false, error: "Company is already in your dream list." };
  }

  const updatedDreamCos = [...dreamCos, companyName];

  await db
    .update(candidates)
    .set({ dreamCos: updatedDreamCos })
    .where(eq(candidates.id, candId));

  const existingStatus = await db
    .select()
    .from(dreamCompanyStatus)
    .where(
      and(
        eq(dreamCompanyStatus.candId, candId),
        eq(dreamCompanyStatus.companyName, companyName)
      )
    )
    .limit(1);

  if (existingStatus.length === 0) {
    await db.insert(dreamCompanyStatus).values({
      candId,
      companyName,
      status: "Not Started",
    });
  }

  revalidatePath("/candidate/dream-companies");
  return { success: true };
}

// ─── Remove Dream Company ───────────────────────────────────────────
export async function removeDreamCompanyAction(companyName: string) {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;

  const [cand] = await db.select().from(candidates).where(eq(candidates.id, candId)).limit(1);
  if (!cand) throw new Error("Candidate not found");

  const dreamCos = (cand.dreamCos as string[]) ?? [];
  const updatedDreamCos = dreamCos.filter((c) => c.toLowerCase() !== companyName.toLowerCase());

  await db
    .update(candidates)
    .set({ dreamCos: updatedDreamCos })
    .where(eq(candidates.id, candId));

  await db
    .delete(dreamCompanyStatus)
    .where(
      and(
        eq(dreamCompanyStatus.candId, candId),
        eq(dreamCompanyStatus.companyName, companyName)
      )
    );

  revalidatePath("/candidate/dream-companies");
  return { success: true };
}

// ─── Update Dream Company Status (Consultant Side) ─────────────────
export async function updateDreamCompanyStatusAction(
  candId: string,
  companyName: string,
  status: string,
  notes?: string
) {
  const { platformUser } = await requireRole(["admin", "consultant"]);

  const existingStatus = await db
    .select()
    .from(dreamCompanyStatus)
    .where(
      and(
        eq(dreamCompanyStatus.candId, candId),
        eq(dreamCompanyStatus.companyName, companyName)
      )
    )
    .limit(1);

  if (existingStatus.length > 0) {
    await db
      .update(dreamCompanyStatus)
      .set({
        status,
        ...(notes !== undefined && { notes }),
        updatedBy: platformUser?.name || "Consultant",
        updatedAt: new Date(),
      })
      .where(eq(dreamCompanyStatus.id, existingStatus[0].id));
  } else {
    await db.insert(dreamCompanyStatus).values({
      candId,
      companyName,
      status,
      notes: notes || null,
      updatedBy: platformUser?.name || "Consultant",
    });
  }

  await db.insert(candidateNotifications).values({
    candId,
    type: "status_update",
    message: `Update on your dream company: ${companyName} → ${status}`,
    link: "/candidate/dream-companies",
  });

  revalidatePath("/candidate/dream-companies");
  revalidatePath(`/dashboard/candidates/${candId}`);
  return { success: true };
}

// ─── Self Apply to Curated Job (Candidate Action) ─────────────────────────────────────
export async function selfApplyAction(jobId: number) {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;

  // Idempotent: don't create a duplicate application row
  const existing = await db
    .select()
    .from(candidateApplications)
    .where(and(eq(candidateApplications.candId, candId), eq(candidateApplications.jobId, jobId)))
    .limit(1);

  if (existing.length > 0) return { success: true, alreadyApplied: true };

  await db.insert(candidateApplications).values({
    candId,
    jobId,
    source: "direct",
    status: "Profile Submitted",
  });

  // Notify all consultants
  const [cand] = await db
    .select({ name: candidates.name })
    .from(candidates)
    .where(eq(candidates.id, candId))
    .limit(1);
  const [job] = await db
    .select({ title: candidateJobs.title })
    .from(candidateJobs)
    .where(eq(candidateJobs.id, jobId))
    .limit(1);

  await db.insert(consultantNotifications).values({
    userId: null,
    targetRole: "consultant",
    message: `${cand?.name || "A candidate"} has applied for: ${job?.title || "#" + jobId}`,
    link: `/dashboard/candidate-jobs`,
  });

  revalidatePath("/candidate/jobs");
  return { success: true };
}

// ─── Update Application Status (Consultant / Admin Action) ──────────────────────
export async function updateApplicationStatusAction(applicationId: number, status: string) {
  await requireRole(["admin", "consultant"]);

  await db
    .update(candidateApplications)
    .set({ status, updatedAt: new Date() })
    .where(eq(candidateApplications.id, applicationId));

  // Notify the candidate of the status change
  const [app] = await db
    .select({ candId: candidateApplications.candId })
    .from(candidateApplications)
    .where(eq(candidateApplications.id, applicationId))
    .limit(1);

  if (app) {
    await db.insert(candidateNotifications).values({
      candId: app.candId,
      type: "status_update",
      message: `Your application status has been updated to: ${status}`,
      link: "/candidate/jobs",
    });
  }

  revalidatePath("/dashboard/candidate-jobs");
  return { success: true };
}
