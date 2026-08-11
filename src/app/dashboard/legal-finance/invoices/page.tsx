import { requireRole } from "@/lib/auth";
import { getInvoicesPaginated } from "@/db/queries";
import InvoicesClient from "@/features/legal-finance/invoices/components/InvoicesClient";

export const dynamic = "force-dynamic";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole(["admin", "finance"]);
  const params = await searchParams;

  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const pageSize = typeof params.pageSize === "string" ? parseInt(params.pageSize, 10) : 25;
  const status = typeof params.status === "string" ? params.status : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;

  const data = await getInvoicesPaginated({
    page,
    pageSize,
    status,
    search,
  });

  return <InvoicesClient initialData={JSON.parse(JSON.stringify(data))} />;
}
