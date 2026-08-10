import { requireRole } from "@/lib/auth";
import { getCandidateById } from "@/db/queries";
import { db } from "@/db";
import { dreamCompanyStatus, masterClients, candidateBadges } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getSuggestedCompanies } from "@/lib/dreamCompanySuggestions";
import { DreamCompaniesClient } from "@/features/candidate-portal/components/DreamCompaniesClient";

export default async function CandidateDreamCompaniesPage() {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;

  const [candidate, statuses, suggestions, clientsList, badgeRows] = await Promise.all([
    getCandidateById(candId),
    db.select().from(dreamCompanyStatus).where(eq(dreamCompanyStatus.candId, candId)),
    getSuggestedCompanies(candId),
    db.select({ name: masterClients.companyName }).from(masterClients).orderBy(asc(masterClients.companyName)),
    db.select().from(candidateBadges).where(and(eq(candidateBadges.candId, candId), eq(candidateBadges.badgeType, "assessment_complete"))).limit(1),
  ]);

  const dreamCos = (candidate?.dreamCos as string[]) ?? [];
  const masterClientNames = Array.from(new Set(clientsList.map((c) => c.name).filter(Boolean)));
  const tier = (badgeRows[0]?.metadata as { tier?: "A" | "B" | "C" })?.tier ?? null;

  return (
    <DreamCompaniesClient
      dreamCos={dreamCos}
      statuses={statuses}
      suggestions={suggestions}
      masterClientNames={masterClientNames}
      tier={tier}
    />
  );
}

