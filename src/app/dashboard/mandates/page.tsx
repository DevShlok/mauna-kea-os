import { requireRole } from "@/lib/auth";
import { getMandatesPaginated } from "@/db/queries";
import MandatesClient from "@/features/mandates/components/MandatesClient";
import { db } from "@/db";
import { clients, mandates } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export default async function MandatesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { platformUser: pUser, email } = await requireRole(["admin", "consultant"]);
  const params = await searchParams;

  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const pageSize = typeof params.pageSize === "string" ? parseInt(params.pageSize, 10) : 50;
  const search = typeof params.search === "string" ? params.search : "";
  const companyFilter = typeof params.company === "string" ? params.company : "";
  const roleFilter = typeof params.role === "string" ? params.role : "";
  const sectorFilter = typeof params.sector === "string" ? params.sector : "";
  const statusFilter = typeof params.status === "string" ? params.status : "";
  const internalFilter = typeof params.internalStatus === "string" ? params.internalStatus : "";
  const sortKey = typeof params.sortKey === "string" ? params.sortKey : "id";
  const sortDir = params.sortDir === "asc" ? "asc" : "desc";

  // Force company filter if client
  let forcedCompany = companyFilter;
  if (email && pUser?.role === "client" && pUser.linkedClientId) {
    const [client] = await db.select().from(clients).where(eq(clients.id, pUser.linkedClientId));
    if (client) forcedCompany = client.name;
    else return <MandatesClient initialMandates={[]} metadata={{ totalCount: 0, totalPages: 1, currentPage: 1 }} uniqueCompanies={[]} uniqueRoles={[]} uniqueSectors={[]} />;
  }

  // Pre-fetch unique values for dropdowns using highly optimized DISTINCT database queries.
  // This prevents memory leaks and OOM crashes by offloading aggregation to Postgres.
  const companyRows = await db.selectDistinct({ company: mandates.company }).from(mandates).where(eq(mandates.isDeleted, false));
  const uniqueCompanies = companyRows.map(r => r.company).filter(Boolean).sort();

  const roleRows = await db.selectDistinct({ role: mandates.role }).from(mandates).where(eq(mandates.isDeleted, false));
  const uniqueRoles = roleRows.map(r => r.role).filter(Boolean).sort();

  // Extract unique sectors from JSON array directly in SQL
  const sectorsResult = await db.execute(sql`SELECT DISTINCT json_array_elements_text(sectors) as sector FROM mandates WHERE is_deleted = false AND sectors IS NOT NULL AND json_typeof(sectors) = 'array'`);
  const sectorRows = Array.isArray(sectorsResult) ? sectorsResult : ((sectorsResult as any).rows || []);
  const uniqueSectors = sectorRows.map((r: any) => r.sector as string).filter(Boolean).sort();

  const { data, metadata } = await getMandatesPaginated({
    page,
    pageSize,
    search,
    company: forcedCompany,
    role: roleFilter,
    sector: sectorFilter,
    status: statusFilter,
    internalStatus: internalFilter,
    sortKey,
    sortDir,
  });

  return (
    <MandatesClient 
      initialMandates={data} 
      metadata={metadata} 
      uniqueCompanies={uniqueCompanies}
      uniqueRoles={uniqueRoles}
      uniqueSectors={uniqueSectors}
    />
  );
}