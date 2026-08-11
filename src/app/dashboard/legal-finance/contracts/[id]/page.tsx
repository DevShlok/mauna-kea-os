import { requireRole } from "@/lib/auth";
import { getContractById } from "@/db/queries";
import { notFound } from "next/navigation";
import ContractDetailClient from "@/features/legal-finance/contracts/components/ContractDetailClient";

export const dynamic = "force-dynamic";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin", "consultant", "finance"]);
  const { id } = await params;

  const contract = await getContractById(id);

  if (!contract) {
    notFound();
  }

  return <ContractDetailClient contract={JSON.parse(JSON.stringify(contract))} />;
}
