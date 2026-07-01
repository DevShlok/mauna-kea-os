import { getMandates } from "@/db/queries";
import MandatesClient from "@/features/mandates/components/MandatesClient";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ClientMandatesPage() {
  const { platformUser } = await requireRole(["client"]);
  
  let filteredMandates = await getMandates();

  if (platformUser?.linkedClientId) {
    const [client] = await db.select().from(clients).where(eq(clients.id, platformUser.linkedClientId));
    if (client) {
      filteredMandates = filteredMandates.filter(m => m.company === client.name);
    } else {
      filteredMandates = [];
    }
  } else {
    filteredMandates = [];
  }

  return <MandatesClient initialMandates={filteredMandates} />;
}
