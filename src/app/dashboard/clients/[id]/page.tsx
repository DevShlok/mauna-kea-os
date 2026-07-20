import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { clients, mandates, masterIndustries, candidates } from "@/db/schema";
import { eq, asc, or, ilike, sql } from "drizzle-orm";
import ClientDetailClient from "@/features/clients/components/ClientDetailClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params  }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "consultant"]);;
  const resolvedParams = await params;
  const [client] = await db.select().from(clients).where(eq(clients.id, resolvedParams.id));
  
  if (!client) {
    notFound();
  }

  // Fetch mandates for this client by matching the company name
  const clientMandates = await db.select().from(mandates).where(eq(mandates.company, client.name));
  
  const industries = await db.select().from(masterIndustries).orderBy(asc(masterIndustries.id));

  // Fetch associated candidates
  const associatedCandidates = await db.select().from(candidates).where(
    or(
      ilike(candidates.company, `%${client.name}%`),
      sql`${candidates.pastCompanies}::text ILIKE ${'%' + client.name + '%'}`
    )
  ).limit(50);

  return <ClientDetailClient client={client} mandates={clientMandates} industries={industries} associatedCandidates={associatedCandidates} />;
}
