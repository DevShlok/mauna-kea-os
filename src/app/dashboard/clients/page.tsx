import { db } from "@/db";
import { clients, mandates } from "@/db/schema";
import ClientsClient from "./ClientsClient";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const allClients = await db.select().from(clients);
  const allMandates = await db.select().from(mandates);
  
  return <ClientsClient clients={allClients} mandates={allMandates} />;
}
