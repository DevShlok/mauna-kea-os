import { getMandates } from "@/db/queries";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import ClientDashboard from "@/features/client/components/ClientDashboard";

export const dynamic = "force-dynamic";

export default async function ClientMandatesPage() {
  const { platformUser } = await requireRole(["client"]);

  let filteredMandates = await getMandates();
  let clientName = "Client";

  if (platformUser?.linkedClientId) {
    const [client] = await db.select().from(clients).where(eq(clients.id, platformUser.linkedClientId));
    if (client) {
      clientName = client.name;
      filteredMandates = filteredMandates.filter(m => m.company === client.name);
    } else {
      filteredMandates = [];
    }
  } else {
    filteredMandates = [];
  }

  return <ClientDashboard clientName={clientName} mandates={filteredMandates} />;
}
