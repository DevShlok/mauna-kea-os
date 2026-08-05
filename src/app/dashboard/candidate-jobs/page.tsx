import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import {
  candidateJobs,
  masterIndustries,
  candidateApplications,
  candidates,
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import JobsCurationClient from "@/features/candidate-portal/admin/JobsCurationClient";
import ApplicationsInboxClient from "@/features/candidate-portal/admin/ApplicationsInboxClient";

export default async function CandidateJobsCurationPage() {
  await requireRole(["admin", "consultant"]);

  const [jobsList, sectorsList, applicationRows] = await Promise.all([
    db.select().from(candidateJobs).orderBy(desc(candidateJobs.createdAt)),
    db.select({ name: masterIndustries.sectorName }).from(masterIndustries),
    db
      .select({
        id: candidateApplications.id,
        candId: candidateApplications.candId,
        jobId: candidateApplications.jobId,
        status: candidateApplications.status,
        appliedAt: candidateApplications.appliedAt,
        updatedAt: candidateApplications.updatedAt,
        candidateName: candidates.name,
        candidateCompany: candidates.company,
        jobTitle: candidateJobs.title,
      })
      .from(candidateApplications)
      .leftJoin(candidates, eq(candidateApplications.candId, candidates.id))
      .leftJoin(candidateJobs, eq(candidateApplications.jobId, candidateJobs.id))
      .orderBy(desc(candidateApplications.appliedAt)),
  ]);

  const sectors = Array.from(
    new Set(sectorsList.map((s) => s.name).filter(Boolean))
  );

  return (
    <div className="space-y-10">
      {/* Self-Apply Inbox — shows first so consultants see new applications at a glance */}
      <ApplicationsInboxClient applications={applicationRows} />

      {/* Existing Jobs Curation Table */}
      <JobsCurationClient initialJobs={jobsList} sectors={sectors} />
    </div>
  );
}
