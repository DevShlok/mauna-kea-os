import { getCandidateById } from "@/db/queries";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { clients, mandateCandidates, candidateReports, mandates, candidates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import ClientCandidateProfile from "@/features/client/components/ClientCandidateProfile";

export const dynamic = "force-dynamic";

export default async function ClientCandidateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mandateId?: string }>;
}) {
  const { platformUser } = await requireRole(["client"]);
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const candidateId = resolvedParams.id;
  let candidate = await getCandidateById(candidateId);

  // Fallback: If candidate is not found by ID (due to mismatched seed/legacy external IDs),
  // lookup by name from the mandateCandidates table
  if (!candidate) {
    const [mc] = await db
      .select()
      .from(mandateCandidates)
      .where(eq(mandateCandidates.externalId, candidateId))
      .limit(1);

    if (mc?.name) {
      const allCands = await db
        .select()
        .from(candidates)
        .where(eq(candidates.name, mc.name))
        .limit(1);

      if (allCands[0]) {
        candidate = await getCandidateById(allCands[0].id);
      }
    }
  }

  if (!candidate) {
    return <div className="p-10 text-center text-gray-400">Candidate not found.</div>;
  }

  // Verify the client is authorized to view this candidate
  if (!platformUser?.linkedClientId) {
    redirect("/client/mandates");
  }

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, platformUser.linkedClientId));

  if (!client) {
    redirect("/client/mandates");
  }

  // Find the mandateCandidate entry that links this candidate to one of this client's mandates
  let query = db
    .select({
      mandateCandidate: mandateCandidates,
      mandate: mandates,
    })
    .from(mandateCandidates)
    .innerJoin(mandates, eq(mandateCandidates.mandateId, mandates.id))
    .where(
      and(
        eq(mandateCandidates.externalId, candidateId),
        eq(mandates.company, client.name)
      )
    );

  // If a specific mandateId was passed in, filter by that as well
  const mandateIdNum = Number(resolvedSearchParams.mandateId);
  if (resolvedSearchParams.mandateId && !isNaN(mandateIdNum)) {
    query = db
      .select({
        mandateCandidate: mandateCandidates,
        mandate: mandates,
      })
      .from(mandateCandidates)
      .innerJoin(mandates, eq(mandateCandidates.mandateId, mandates.id))
      .where(
        and(
          eq(mandateCandidates.externalId, candidateId),
          eq(mandateCandidates.mandateId, mandateIdNum),
          eq(mandates.company, client.name)
        )
      );
  }

  const results = await query;
  if (results.length === 0) {
    redirect("/client/mandates");
  }

  const { mandateCandidate, mandate } = results[0];

  // Fetch the candidate report if available
  const reports = await db
    .select()
    .from(candidateReports)
    .where(eq(candidateReports.candidateId, candidateId))
    .limit(1);

  // Only expose the AI report if it has been explicitly published to the client
  const isShared = reports[0]?.sharedWithClient || false;
  const rawReportData = (isShared ? (reports[0]?.reportData || {}) : {}) as Record<string, any>;
  const accepted = rawReportData._acceptedSections || [];
  const hiddenFields = ["Former Company", "Pedigree", "CTC", "Expected CTC", "Revenue Ownership", "Team Size Led", "_rawInputs", "error", "_format1", "_format2", "scores", "_acceptedSections", "matchScore", "readinessScore", "hireabilityScore", "Industry", "Geography"];
  
  const reportData: Record<string, any> = {};
  for (const key of Object.keys(rawReportData)) {
    if (hiddenFields.includes(key) || accepted.includes(key)) {
      reportData[key] = rawReportData[key];
    }
  }

  // Explicitly pass the final accepted HTML report if it exists
  if (rawReportData.final_accepted_html) {
    reportData.final_accepted_html = rawReportData.final_accepted_html;
    reportData.final_accepted_format = rawReportData.final_accepted_format;
  }

  const { getFrameworkById } = await import("@/db/queries");
  const framework = mandate.frameworkId ? await getFrameworkById(mandate.frameworkId) : null;

  return (
    <ClientCandidateProfile
      candidate={candidate}
      mandateCandidate={mandateCandidate}
      mandateId={mandate.id}
      reportData={reportData}
      framework={framework}
      mandate={mandate}
      clientName={client.name}
    />
  );
}
