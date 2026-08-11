import { requireRole } from "@/lib/auth";
import { getContractsPaginated } from "@/db/queries";
import ContractsClient from "@/features/legal-finance/contracts/components/ContractsClient";

export const dynamic = "force-dynamic";

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole(["admin", "consultant", "finance"]);
  const params = await searchParams;

  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const pageSize = typeof params.pageSize === "string" ? parseInt(params.pageSize, 10) : 25;
  const status = typeof params.status === "string" ? params.status : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;

  const data = await getContractsPaginated({
    page,
    pageSize,
    status,
    search,
  });

  return <ContractsClient initialData={JSON.parse(JSON.stringify(data))} />;
}
