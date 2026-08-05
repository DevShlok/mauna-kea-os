import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { candidateJobs, candidateJobInterests, masterIndustries } from "@/db/schema";
import { eq, and, or, sql, desc } from "drizzle-orm";
import { JobsClient } from "@/features/candidate-portal/components/JobsClient";

export default async function CandidateJobsPage() {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;

  const [jobs, interestRows, sectorsList] = await Promise.all([
    db
      .select()
      .from(candidateJobs)
      .where(
        and(
          eq(candidateJobs.isActive, true),
          or(
            sql`${candidateJobs.targetCandIds} = '[]'::json`,
            sql`${candidateJobs.targetCandIds}::text LIKE ${'%' + candId + '%'}`
          )
        )
      )
      .orderBy(desc(candidateJobs.createdAt)),
    db
      .select()
      .from(candidateJobInterests)
      .where(eq(candidateJobInterests.candId, candId)),
    db
      .select({ name: masterIndustries.sectorName })
      .from(masterIndustries),
  ]);

  const initialInterests: Record<number, string> = {};
  for (const r of interestRows) {
    if (r.status) initialInterests[r.jobId] = r.status;
  }

  const sectors = Array.from(new Set(sectorsList.map((s) => s.name).filter(Boolean)));

  return <JobsClient jobs={jobs} initialInterests={initialInterests} sectors={sectors} />;
}
