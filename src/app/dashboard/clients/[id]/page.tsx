import { db } from "@/db";
import { clients, mandates } from "@/db/schema";
import { eq } from "drizzle-orm";
import ClientDetailClient from "@/features/clients/components/ClientDetailClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const [client] = await db.select().from(clients).where(eq(clients.id, resolvedParams.id));
  
  if (!client) {
    notFound();
  }

  // Fetch mandates for this client by matching the company name
  const clientMandates = await db.select().from(mandates).where(eq(mandates.company, client.name));
  
  return <ClientDetailClient client={client} mandates={clientMandates} />;
}
