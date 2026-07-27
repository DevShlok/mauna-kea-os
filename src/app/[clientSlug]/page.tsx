import { Suspense } from "react";
import { getMandates } from "@/db/queries";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import ClientDashboard from "@/features/client/components/ClientDashboard";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ clientSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function ClientMandatesPage(props: PageProps) {
  const [searchParams, { clientSlug }, { platformUser }, allMandates] = await Promise.all([
    props.searchParams,
    props.params,
    requireRole(["client"]),
    getMandates()
  ]);
  
  const tab = searchParams.tab || "dashboard";

  let filteredMandates = allMandates;
  let clientName = "Client";

  if (platformUser?.linkedClientId) {
    const [client] = await db.select().from(clients).where(eq(clients.id, platformUser.linkedClientId));
    if (client) {
      clientName = client.name;
      filteredMandates = filteredMandates.filter(m => m.company === client.name).map(m => ({
        ...m,
        candidates: m.candidates.filter(c => c.isSentToClient)
      }));
    } else {
      filteredMandates = [];
    }
  } else {
    filteredMandates = [];
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#f4f6fb]">Loading...</div>}>
      <ClientDashboard clientSlug={clientSlug} clientName={clientName} mandates={filteredMandates} initialTab={tab as any} />
    </Suspense>
  );
}
