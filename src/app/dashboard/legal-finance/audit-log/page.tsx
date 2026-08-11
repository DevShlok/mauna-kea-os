import { requireRole } from "@/lib/auth";
import { getLfAuditLogsPaginated } from "@/db/queries";
import AuditLogClient from "@/features/legal-finance/audit-log/components/AuditLogClient";

export const dynamic = "force-dynamic";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole(["admin", "finance"]);
  const params = await searchParams;

  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const pageSize = typeof params.pageSize === "string" ? parseInt(params.pageSize, 10) : 50;

  const data = await getLfAuditLogsPaginated({ page, pageSize });

  return <AuditLogClient initialData={JSON.parse(JSON.stringify(data))} />;
}
