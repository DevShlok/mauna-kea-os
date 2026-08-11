import { requireRole } from "@/lib/auth";
import { getInvoiceById } from "@/db/queries";
import { notFound } from "next/navigation";
import InvoiceDetailClient from "@/features/legal-finance/invoices/components/InvoiceDetailClient";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin", "finance"]);
  const { id } = await params;

  const invoice = await getInvoiceById(id);

  if (!invoice) {
    notFound();
  }

  return <InvoiceDetailClient invoice={JSON.parse(JSON.stringify(invoice))} />;
}
