import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { clients, contracts, candidates, mandateCandidates, mandates } from "@/db/schema";
import { eq } from "drizzle-orm";
import RaiseInvoiceClient from "@/features/legal-finance/invoices/components/RaiseInvoiceClient";

export const dynamic = "force-dynamic";

export default async function RaiseInvoicePage() {
  await requireRole(["admin", "finance"]);

  const [clientsList, contractsList, candidatesList] = await Promise.all([
    db
      .select({
        id: clients.id,
        name: clients.name,
        legalEntityName: clients.legalEntityName,
        gstNumber: clients.gstNumber,
        gstRate: clients.gstRate,
        requiresPo: clients.requiresPo,
        state: clients.state,
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
    db
      .select({
        candId: candidates.id,
        candName: candidates.name,
        currentCtc: candidates.fixedCtc,
        mandateId: mandates.id,
        roleTitle: mandates.role,
        company: mandates.company,
        clientId: mandates.clientId,
        clientName: clients.name,
      })
      .from(mandateCandidates)
      .leftJoin(candidates, eq(mandateCandidates.candId, candidates.id))
      .leftJoin(mandates, eq(mandateCandidates.mandateId, mandates.id))
      .leftJoin(clients, eq(mandates.clientId, clients.id))
      .limit(100),
  ]);

  return (
    <RaiseInvoiceClient
      clientsList={JSON.parse(JSON.stringify(clientsList))}
      contractsList={JSON.parse(JSON.stringify(contractsList))}
      candidatesList={JSON.parse(JSON.stringify(candidatesList))}
    />
  );
}
