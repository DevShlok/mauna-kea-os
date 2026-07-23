import { requireRole } from "@/lib/auth";
import { getClientsPaginated } from "@/db/queries";
import ClientsClient from "@/features/clients/components/ClientsClient";
import { db } from "@/db";
import { clients, mandates } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { platformUser: pUser, email } = await requireRole(["admin", "consultant"]);
  const params = await searchParams;

  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const pageSize = typeof params.pageSize === "string" ? parseInt(params.pageSize, 10) : 50;
  const search = typeof params.search === "string" ? params.search : "";
  const verticalFilter = typeof params.vertical === "string" ? params.vertical : "";
  const statusFilter = typeof params.status === "string" ? params.status : "";
  const sortKey = typeof params.sortKey === "string" ? params.sortKey : "id";
  const sortDir = params.sortDir === "asc" ? "asc" : "desc";

  let finalSearch = search;
  // If client role, they can only see their own client record
  if (email && pUser?.role === "client" && pUser.linkedClientId) {
    const [linkedClient] = await db.select().from(clients).where(eq(clients.id, pUser.linkedClientId));
    if (linkedClient) {
      finalSearch = linkedClient.name;
    } else {
      return <ClientsClient initialClients={[]} metadata={{ totalCount: 0, totalPages: 1, currentPage: 1 }} uniqueVerticals={[]} />;
    }
  }

  const { data: clientsData, metadata } = await getClientsPaginated({
    page,
    pageSize,
    search: finalSearch,
    vertical: verticalFilter,
    status: statusFilter,
    sortKey,
    sortDir,
  });

  // Fetch mandates for these specific clients
  const clientNames = clientsData.map(c => c.name);
  let relevantMandates: any[] = [];
  if (clientNames.length > 0) {
    relevantMandates = await db.select().from(mandates).where(
      inArray(mandates.company, clientNames)
    );
  }

  const enhancedClients = clientsData.map(c => ({
    ...c,
    mandates: relevantMandates.filter(m => m.company === c.name && !m.isDeleted)
  }));

  // Fetch unique verticals for dropdown efficiently
  const verticalRows = await db.selectDistinct({ vertical: clients.vertical }).from(clients).where(eq(clients.isDeleted, false));
  const uniqueVerticals = verticalRows.map(c => c.vertical).filter(Boolean).sort() as string[];

  return (
    <ClientsClient 
      initialClients={enhancedClients} 
      metadata={metadata}
      uniqueVerticals={uniqueVerticals}
    />
  );
}
