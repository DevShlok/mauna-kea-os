import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getContractTemplatesAction } from "@/actions/contract-templates";
import ContractWizard from "@/features/legal-finance/contracts/components/ContractWizard";

export const dynamic = "force-dynamic";

export default async function NewContractPage() {
  await requireRole(["admin", "consultant", "finance"]);

  const [clientsList, customTemplates] = await Promise.all([
    db
      .select({
        id: clients.id,
        name: clients.name,
        legalEntityName: clients.legalEntityName,
        gstNumber: clients.gstNumber,
        owner: clients.owner,
        vertical: clients.vertical,
      })
      .from(clients)
      .where(eq(clients.isDeleted, false))
      .orderBy(clients.name),
    getContractTemplatesAction(),
  ]);

  return (
    <ContractWizard
      clientsList={JSON.parse(JSON.stringify(clientsList))}
      customTemplates={JSON.parse(JSON.stringify(customTemplates))}
    />
  );
}
