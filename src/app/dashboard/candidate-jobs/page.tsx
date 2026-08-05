import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { candidateJobs, masterIndustries } from "@/db/schema";
import { desc } from "drizzle-orm";
import JobsCurationClient from "@/features/candidate-portal/admin/JobsCurationClient";

export default async function CandidateJobsCurationPage() {
  await requireRole(["admin", "consultant"]);

  const [jobsList, sectorsList] = await Promise.all([
    db.select().from(candidateJobs).orderBy(desc(candidateJobs.createdAt)),
    db.select({ name: masterIndustries.sectorName }).from(masterIndustries),
  ]);

  const sectors = Array.from(new Set(sectorsList.map((s) => s.name).filter(Boolean)));

  return <JobsCurationClient initialJobs={jobsList} sectors={sectors} />;
}
