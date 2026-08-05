"use server";

import { db } from "@/db";
import { candidateApplications, candidateJobs, mandates, floats, mandateCandidates } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function getCandidateApplicationsAction(candId: string) {
  try {
    // 1. Direct Apps
    const directApps = await db
      .select({
        id: candidateApplications.id,
        source: candidateApplications.source,
        status: candidateApplications.status,
        appliedAt: candidateApplications.appliedAt,
        company: candidateJobs.companyDisplay,
        roleTitle: candidateJobs.title,
      })
      .from(candidateApplications)
      .leftJoin(candidateJobs, eq(candidateApplications.jobId, candidateJobs.id))
      .where(eq(candidateApplications.candId, candId))
      .orderBy(desc(candidateApplications.appliedAt));

    // 2. Consultant Floats (Exceptional Candidates)
    const consultantFloats = await db
      .select()
      .from(floats)
      .where(and(eq(floats.candId, candId), eq(floats.isDeleted, false)))
      .orderBy(desc(floats.createdAt));

    // 3. Mandate Applications (Main source of truth for jobs)
    const mandateApps = await db
      .select({
        id: mandateCandidates.id,
        status: mandateCandidates.stage,
        appliedAt: mandateCandidates.createdAt,
        company: mandates.company,
        roleTitle: mandates.role,
      })
      .from(mandateCandidates)
      .leftJoin(mandates, eq(mandateCandidates.mandateId, mandates.id))
      .where(eq(mandateCandidates.candId, candId))
      .orderBy(desc(mandateCandidates.createdAt));

    // Normalize directApps and mandateApps into a single unified list
    const normalizedDirectApps = directApps.map(app => ({
      id: `direct-${app.id}`,
      company: app.company,
      roleTitle: app.roleTitle,
      status: app.status,
      createdAt: app.appliedAt,
      source: app.source,
    }));

    const normalizedMandateApps = mandateApps.map(app => ({
      id: `mandate-${app.id}`,
      company: app.company,
      roleTitle: app.roleTitle,
      status: app.status,
      createdAt: app.appliedAt,
      source: 'mandate',
    }));

    const unifiedApps = [...normalizedDirectApps, ...normalizedMandateApps].sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );

    return { success: true, directApps: unifiedApps, consultantFloats };
  } catch (error: any) {
    console.error("Failed to fetch applications:", error);
    return { success: false, error: "Failed to fetch applications" };
  }
}

export async function createDirectApplicationAction(candId: string, jobId: number) {
  try {
    await db.insert(candidateApplications).values({
      candId,
      jobId,
      source: 'direct',
      status: 'Profile Submitted',
      appliedAt: new Date(),
    });
    return { success: true };
  } catch (error: any) {
    console.error("Failed to apply for job:", error);
    return { success: false, error: "Failed to submit application" };
  }
}
