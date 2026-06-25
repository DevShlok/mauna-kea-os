import { db } from "@/db";
import { clients, mandates } from "@/db/schema";
import ClientsClient from "./ClientsClient";

import { currentUser } from "@clerk/nextjs/server";
import { getUserByEmail } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  let allClients = await db.select().from(clients);
  let allMandates = await db.select().from(mandates);
  
  const user = await currentUser();
  if (user?.primaryEmailAddress?.emailAddress) {
    const pUser = await getUserByEmail(user.primaryEmailAddress.emailAddress);
    if (pUser?.role === "client" && pUser.linkedClientId) {
      allClients = allClients.filter(c => c.id === pUser.linkedClientId);
      const allowedClientNames = allClients.map(c => c.name);
      allMandates = allMandates.filter(m => allowedClientNames.includes(m.company));
    }
  }

  return <ClientsClient clients={allClients} mandates={allMandates} />;
}
