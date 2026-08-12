import { requireRole } from "@/lib/auth";
import { getContractTemplatesAction } from "@/actions/contract-templates";
import ContractTemplatesClient from "@/features/legal-finance/contracts/components/ContractTemplatesClient";

export const dynamic = "force-dynamic";

export default async function ContractTemplatesPage() {
  await requireRole(["admin", "finance"]);
  const templates = await getContractTemplatesAction();

  return <ContractTemplatesClient templates={JSON.parse(JSON.stringify(templates))} />;
}
