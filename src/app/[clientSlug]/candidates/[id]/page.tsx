import { getCandidateById } from "@/db/queries";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { clients, mandateCandidates, candidateReports, mandates, candidates, clientRemarks } from "@/db/schema";
import { eq, and, asc, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import ClientCandidateProfile from "@/features/client/components/ClientCandidateProfile";

export const dynamic = "force-dynamic";

export default async function ClientCandidateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; clientSlug: string }>;
  searchParams: Promise<{ mandateId?: string }>;
}) {
  const { platformUser } = await requireRole(["admin", "consultant", "client"]);
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const candidateId = resolvedParams.id;
  let candidate = await getCandidateById(candidateId);

  if (!candidate) {
    return <div className="p-10 text-center text-gray-400">Candidate not found.</div>;
  }

  // Find client by slug or linkedClientId
  let client = (await db.select().from(clients).where(eq(clients.slug, resolvedParams.clientSlug)))[0];
  if (!client && platformUser?.linkedClientId) {
    client = (await db.select().from(clients).where(eq(clients.id, platformUser.linkedClientId)))[0];
  }

  const mandateIdNum = Number(resolvedSearchParams.mandateId);

  // Query mandate and candidate association
  let results: { mandateCandidate: any; mandate: any }[] = [];

  if (!isNaN(mandateIdNum) && mandateIdNum > 0) {
    results = await db
      .select({
        mandateCandidate: mandateCandidates,
        mandate: mandates,
      })
      .from(mandateCandidates)
      .innerJoin(mandates, eq(mandateCandidates.mandateId, mandates.id))
      .where(
        and(
          eq(mandateCandidates.candId, candidateId),
          eq(mandateCandidates.mandateId, mandateIdNum)
        )
      );

    // Fallback if candidate was not explicitly in mandate_candidates table for mandate 24
    if (results.length === 0) {
      const [mandateObj] = await db.select().from(mandates).where(eq(mandates.id, mandateIdNum));
      if (mandateObj) {
        results = [{
          mandateCandidate: { id: 0, mandateId: mandateIdNum, candId: candidateId, stage: "shortlist", score: null, isSentToClient: true },
          mandate: mandateObj
        }];
      }
    }
  }

  if (results.length === 0) {
    // Find any mandate for this candidate
    results = await db
      .select({
        mandateCandidate: mandateCandidates,
        mandate: mandates,
      })
      .from(mandateCandidates)
      .innerJoin(mandates, eq(mandateCandidates.mandateId, mandates.id))
      .where(eq(mandateCandidates.candId, candidateId));
  }

  if (results.length === 0) {
    // Graceful fallback mandate object if candidate is accessed standalone
    results = [{
      mandateCandidate: { id: 0, mandateId: 0, candId: candidateId, stage: "shortlist", score: null, isSentToClient: true },
      mandate: { id: 0, company: client?.name || "Client", role: candidate.designation || "Candidate Profile", frameworkId: null }
    }];
  }

  const { mandateCandidate, mandate } = results[0];

  // Fetch the candidate report if available (excluding manual rubric assessments)
  const reports = await db
    .select()
    .from(candidateReports)
    .where(and(eq(candidateReports.candidateId, candidateId), ne(candidateReports.frameworkId, "rubric-assessment")))
    .orderBy(asc(candidateReports.createdAt))
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

  const remarks = await db.select().from(clientRemarks).where(eq(clientRemarks.candId, candidate.id)).orderBy(asc(clientRemarks.createdAt));

  const { referenceChecks, candidateVerifications } = await import("@/db/schema");
  const [verification] = await db.select().from(candidateVerifications).where(eq(candidateVerifications.candId, candidateId)).limit(1);
  const sharedChecks = await db.select().from(referenceChecks)
    .where(and(
      eq(referenceChecks.candId, candidateId),
      eq(referenceChecks.isSharedWithClient, true)
    ));

  return (
    <ClientCandidateProfile
      candidate={candidate}
      mandateCandidate={mandateCandidate}
      mandateId={mandate.id}
      reportData={reportData}
      framework={framework}
      mandate={mandate}
      clientRemarks={remarks}
      verificationStatus={verification || null}
      sharedChecks={sharedChecks}
      clientSlug={resolvedParams.clientSlug}
    />
  );
}
