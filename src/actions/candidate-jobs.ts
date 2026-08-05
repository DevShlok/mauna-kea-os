"use server";

import { db } from "@/db";
import { candidateJobs, candidateJobInterests, candidates } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createJobAction(data: {
  title: string;
  companyDisplay?: string;
  isConfidential?: boolean;
  location?: string;
  ctcRangeMin?: number;
  ctcRangeMax?: number;
  experienceMin?: number;
  experienceMax?: number;
  sector?: string;
  description?: string;
  highlights?: string[];
  targetCandIds?: string[];
  expiresAt?: Date | null;
}) {
  const { platformUser } = await requireRole(["admin", "consultant"]);

  const [job] = await db
    .insert(candidateJobs)
    .values({
      title: data.title,
      companyDisplay: data.companyDisplay || null,
      isConfidential: !!data.isConfidential,
      location: data.location || null,
      ctcRangeMin: data.ctcRangeMin ?? null,
      ctcRangeMax: data.ctcRangeMax ?? null,
      experienceMin: data.experienceMin ?? null,
      experienceMax: data.experienceMax ?? null,
      sector: data.sector || null,
      description: data.description || null,
      highlights: data.highlights || [],
      targetCandIds: data.targetCandIds || [],
      isActive: true,
      createdBy: platformUser?.name || "Consultant",
      expiresAt: data.expiresAt || null,
    })
    .returning();

  revalidatePath("/dashboard/candidate-jobs");
  revalidatePath("/candidate/jobs");
  return { success: true, job };
}

export async function updateJobAction(
  id: number,
  data: {
    title?: string;
    companyDisplay?: string;
    isConfidential?: boolean;
    location?: string;
    ctcRangeMin?: number;
    ctcRangeMax?: number;
    experienceMin?: number;
    experienceMax?: number;
    sector?: string;
    description?: string;
    highlights?: string[];
    targetCandIds?: string[];
    isActive?: boolean;
    expiresAt?: Date | null;
  }
) {
  await requireRole(["admin", "consultant"]);

  const [job] = await db
    .update(candidateJobs)
    .set({
      ...data,
    })
    .where(eq(candidateJobs.id, id))
    .returning();

  revalidatePath("/dashboard/candidate-jobs");
  revalidatePath("/candidate/jobs");
  return { success: true, job };
}

export async function toggleJobActiveAction(id: number, isActive: boolean) {
  await requireRole(["admin", "consultant"]);

  await db
    .update(candidateJobs)
    .set({ isActive })
    .where(eq(candidateJobs.id, id));

  revalidatePath("/dashboard/candidate-jobs");
  revalidatePath("/candidate/jobs");
  return { success: true };
}

export async function getJobInterestsAction(jobId: number) {
  await requireRole(["admin", "consultant"]);

  const interests = await db
    .select({
      id: candidateJobInterests.id,
      candId: candidateJobInterests.candId,
      status: candidateJobInterests.status,
      createdAt: candidateJobInterests.createdAt,
      candName: candidates.name,
      candCompany: candidates.company,
      candDesignation: candidates.designation,
      candEmail: candidates.email,
    })
    .from(candidateJobInterests)
    .leftJoin(candidates, eq(candidateJobInterests.candId, candidates.id))
    .where(eq(candidateJobInterests.jobId, jobId))
    .orderBy(desc(candidateJobInterests.createdAt));

  return interests;
}
