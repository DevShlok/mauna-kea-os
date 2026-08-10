import { requireRole } from "@/lib/auth";
import { getCandidateById } from "@/db/queries";
import { db } from "@/db";
import { candidateJobs, candidateJobInterests, candidateApplications, masterIndustries } from "@/db/schema";
import { eq, and, or, sql, desc } from "drizzle-orm";
import { JobsClient } from "@/features/candidate-portal/components/JobsClient";

export default async function CandidateJobsPage() {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;

  const [jobs, interestRows, applicationRows, sectorsList, candidate] = await Promise.all([
    db
      .select()
      .from(candidateJobs)
      .where(
        and(
          eq(candidateJobs.isActive, true),
          or(
            sql`${candidateJobs.targetCandIds} IS NULL`,
            sql`${candidateJobs.targetCandIds}::text = '[]'`,
            sql`${candidateJobs.targetCandIds}::text LIKE ${"%" + candId + "%"}`
          )
        )
      )
      .orderBy(desc(candidateJobs.createdAt)),
    db
      .select()
      .from(candidateJobInterests)
      .where(eq(candidateJobInterests.candId, candId)),
    db
      .select({ jobId: candidateApplications.jobId })
      .from(candidateApplications)
      .where(eq(candidateApplications.candId, candId)),
    db
      .select({ name: masterIndustries.sectorName })
      .from(masterIndustries),
    getCandidateById(candId),
  ]);

  const initialInterests: Record<number, string> = {};
  for (const r of interestRows) {
    if (r.status) initialInterests[r.jobId] = r.status;
  }

  const initialApplications = new Set(
    applicationRows.map((r) => r.jobId).filter((id): id is number => id !== null)
  );

  const sectors = Array.from(new Set(sectorsList.map((s) => s.name).filter(Boolean)));
  const candidateTags = {
    expTags: (candidate?.expTags as string[]) ?? [],
    dreamRoles: (candidate?.dreamRoles as string[]) ?? [],
    candId,
  };

  return (
    <JobsClient
      jobs={jobs}
      initialInterests={initialInterests}
      initialApplications={initialApplications}
      sectors={sectors}
      candidateTags={candidateTags}
    />
  );
}

