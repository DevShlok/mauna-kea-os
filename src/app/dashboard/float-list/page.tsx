import { requireRole } from "@/lib/auth";
import { getFloatsPaginated } from "@/db/queries";
import FloatListClient from "@/features/float-list/components/FloatListClient";

export const dynamic = "force-dynamic";

export default async function FloatListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole(["admin", "consultant"]);
  
  const params = await searchParams;

  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const pageSize = typeof params.pageSize === "string" ? parseInt(params.pageSize, 10) : 50;
  
  const search = typeof params.search === "string" ? params.search : "";
  const stageFilter = typeof params.stage === "string" ? params.stage : "";
  const mandateFilter = typeof params.mandate === "string" ? params.mandate : "";
  const companyFilter = typeof params.company === "string" ? params.company : "";
  const designationFilter = typeof params.designation === "string" ? params.designation : "";
  
  const sortKey = typeof params.sortKey === "string" ? params.sortKey : "createdAt";
  const sortDir = params.sortDir === "asc" ? "asc" : "desc";

  const { data, metadata } = await getFloatsPaginated({
    page,
    pageSize,
    search,
    stageFilter,
    mandateFilter,
    companyFilter,
    designationFilter,
    sortKey,
    sortDir
  });

  return (
    <FloatListClient 
      paginatedData={data} 
      metadata={metadata} 
    />
  );
}