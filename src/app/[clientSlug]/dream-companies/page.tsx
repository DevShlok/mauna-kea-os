import { requireRole } from "@/lib/auth";
import { getCandidateById } from "@/db/queries";
import { db } from "@/db";
import { dreamCompanyStatus, masterClients } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getSuggestedCompanies } from "@/lib/dreamCompanySuggestions";
import { DreamCompaniesClient } from "@/features/candidate-portal/components/DreamCompaniesClient";

export default async function CandidateDreamCompaniesPage() {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;

  const [candidate, statuses, suggestions, clientsList] = await Promise.all([
    getCandidateById(candId),
    db.select().from(dreamCompanyStatus).where(eq(dreamCompanyStatus.candId, candId)),
    getSuggestedCompanies(candId),
    db.select({ name: masterClients.companyName }).from(masterClients).orderBy(asc(masterClients.companyName)),
  ]);

  const dreamCos = (candidate?.dreamCos as string[]) ?? [];
  const masterClientNames = Array.from(new Set(clientsList.map((c) => c.name).filter(Boolean)));

  return (
    <DreamCompaniesClient
      dreamCos={dreamCos}
      statuses={statuses}
      suggestions={suggestions}
      masterClientNames={masterClientNames}
    />
  );
}
