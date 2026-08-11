import { requireRole } from "@/lib/auth";
import { getPaymentsPaginated } from "@/db/queries";
import PaymentsClient from "@/features/legal-finance/payments/components/PaymentsClient";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole(["admin", "finance"]);
  const params = await searchParams;

  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const pageSize = typeof params.pageSize === "string" ? parseInt(params.pageSize, 10) : 25;

  const data = await getPaymentsPaginated({ page, pageSize });

  return <PaymentsClient initialData={JSON.parse(JSON.stringify(data))} />;
}
