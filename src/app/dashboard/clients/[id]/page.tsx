import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { clients, mandates, masterIndustries, candidates } from "@/db/schema";
import { eq, asc, or, ilike, sql, and } from "drizzle-orm";
import ClientDetailClient from "@/features/clients/components/ClientDetailClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params  }: { params: Promise<{ id: string }> }) {
  const { platformUser } = await requireRole(["admin", "consultant"]);
  const resolvedParams = await params;
  const [client] = await db.select().from(clients).where(eq(clients.id, resolvedParams.id));
  
  if (!client) {
    notFound();
  }

  // Fetch mandates for this client by matching the company name
  const clientMandates = await db.select().from(mandates).where(
    and(
      eq(mandates.company, client.name),
      eq(mandates.isDeleted, false)
    )
  );
  
  const hasMandateIn6Months = clientMandates.some(m => {
    if (m.isDeleted) return false;
    const mandateDate = new Date(m.createdAt!);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return mandateDate >= sixMonthsAgo;
  });
  client.status = hasMandateIn6Months ? "Active" : "Inactive";
  
  const industries = await db.select().from(masterIndustries).orderBy(asc(masterIndustries.id));

  // Fetch associated candidates
  const associatedCandidates = await db.select().from(candidates).where(
    or(
      ilike(candidates.company, `%${client.name}%`),
      sql`${candidates.pastCompanies}::text ILIKE ${'%' + client.name + '%'}`
    )
  ).limit(50);

  return <ClientDetailClient client={client} mandates={clientMandates} industries={industries} associatedCandidates={associatedCandidates} currentUser={platformUser!} />;
}
