import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { clients, contracts } from "@/db/schema";
import { eq } from "drizzle-orm";
import RaiseInvoiceClient from "@/features/legal-finance/invoices/components/RaiseInvoiceClient";

export const dynamic = "force-dynamic";

export default async function RaiseInvoicePage() {
  await requireRole(["admin", "finance"]);

  const [clientsList, contractsList] = await Promise.all([
    db
      .select({
        id: clients.id,
        name: clients.name,
        legalEntityName: clients.legalEntityName,
        gstNumber: clients.gstNumber,
        gstRate: clients.gstRate,
        requiresPo: clients.requiresPo,
      })
      .from(clients)
      .where(eq(clients.isDeleted, false))
      .orderBy(clients.name),
    db
      .select({
        id: contracts.id,
        contractNumber: contracts.contractNumber,
        clientId: contracts.clientId,
        successFeePct: contracts.successFeePct,
        paymentTerms: contracts.paymentTerms,
      })
      .from(contracts)
      .where(eq(contracts.isDeleted, false))
      .orderBy(contracts.contractNumber),
  ]);

  return (
    <RaiseInvoiceClient
      clientsList={JSON.parse(JSON.stringify(clientsList))}
      contractsList={JSON.parse(JSON.stringify(contractsList))}
    />
  );
}
