import { getMandateById } from "@/db/queries";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { clients, candidates } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import ClientMandateDetail from "@/features/client/components/ClientMandateDetail";

export const dynamic = "force-dynamic";

export default async function ClientMandateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { platformUser } = await requireRole(["client"]);
  const resolvedParams = await params;
  const mandate = await getMandateById(Number(resolvedParams.id));

  if (!mandate) {
    return <div className="p-10 text-center text-gray-400">Position not found.</div>;
  }

  // Verify this mandate belongs to the client
  let clientName = "Client";
  if (platformUser?.linkedClientId) {
    const [client] = await db.select().from(clients).where(eq(clients.id, platformUser.linkedClientId));
    if (!client || mandate.company !== client.name) {
      redirect("/client/mandates");
    }
    clientName = client.name;
  } else {
    redirect("/client/mandates");
  }

  // Enrich candidates with profile pics from the master candidates table
  const externalIds = mandate.candidates.map(c => c.externalId).filter(Boolean);
  const masterDataMap: Record<string, { profilePic: string | null; location: string | null; exp: number | null; designation: string | null; company: string | null }> = {};

  if (externalIds.length > 0) {
    const masterCandidates = await db
      .select({
        id: candidates.id,
        profilePic: candidates.profilePic,
        location: candidates.location,
        exp: candidates.exp,
        designation: candidates.designation,
        company: candidates.company,
      })
      .from(candidates)
      .where(inArray(candidates.id, externalIds));

    for (const mc of masterCandidates) {
      masterDataMap[mc.id] = {
        profilePic: mc.profilePic,
        location: mc.location,
        exp: mc.exp,
        designation: mc.designation,
        company: mc.company,
      };
    }
  }

  // Merge profile pics and master data into mandate candidates
  const enrichedCandidates = mandate.candidates.map(c => ({
    ...c,
    profilePic: masterDataMap[c.externalId]?.profilePic || null,
    location: masterDataMap[c.externalId]?.location || null,
    exp: masterDataMap[c.externalId]?.exp || null,
    masterDesignation: masterDataMap[c.externalId]?.designation || null,
    masterCompany: masterDataMap[c.externalId]?.company || null,
  }));

  const enrichedMandate = { ...mandate, candidates: enrichedCandidates };

  return <ClientMandateDetail mandate={enrichedMandate} clientName={clientName} />;
}
