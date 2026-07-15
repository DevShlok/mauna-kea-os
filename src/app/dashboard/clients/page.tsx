import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { eq, sql, and } from "drizzle-orm";
import { clients, mandates } from "@/db/schema";
import ClientsClient from "@/features/clients/components/ClientsClient";

import { getUserByEmail } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const { platformUser: pUser, email } = await requireRole(["admin", "consultant"]);

  let allClients = await db.select().from(clients).where(eq(clients.isDeleted, false));
  let allMandates = await db.select().from(mandates).where(eq(mandates.isDeleted, false));
  
  if (email) {
    if (pUser?.role === "client" && pUser.linkedClientId) {
      allClients = allClients.filter(c => c.id === pUser.linkedClientId);
      const allowedClientNames = allClients.map(c => c.name);
      allMandates = allMandates.filter(m => allowedClientNames.includes(m.company));
    }
  }

  return <ClientsClient clients={allClients} mandates={allMandates} />;
}
