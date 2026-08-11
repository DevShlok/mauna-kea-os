"use server";

import { db } from "@/db";
import { contracts, invoices, invoicePayments, clients } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";

/**
 * Natural language Legal & Finance AI query engine
 */
export async function askLegalFinanceQuery(query: string): Promise<{
  answer: string;
  data?: any[];
}> {
  await requireRole(["admin", "finance"]);

  const q = query.toLowerCase();

  // Rule-based query routing for common questions
  if (q.includes("overdue")) {
    const overdueList = await db
      .select({
        invoiceNumber: invoices.invoiceNumber,
        amount: invoices.amountOutstanding,
        dueDate: invoices.dueDate,
      })
      .from(invoices)
      .where(and(eq(invoices.status, "Overdue"), eq(invoices.isDeleted, false)));

    const total = overdueList.reduce((sum, i) => sum + (i.amount || 0), 0);

    return {
      answer: `There are currently ${overdueList.length} overdue invoices totaling ₹${(total / 100000).toFixed(2)} Lakhs.`,
      data: overdueList,
    };
  }

  if (q.includes("signed") || q.includes("contract")) {
    const signedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(contracts)
      .where(and(eq(contracts.status, "Signed"), eq(contracts.isDeleted, false)));

    return {
      answer: `There are currently ${signedCount[0]?.count || 0} signed commercial contracts in the system.`,
    };
  }

  if (q.includes("revenue") || q.includes("billed") || q.includes("collected")) {
    const [totals] = await db
      .select({
        billed: sql<number>`COALESCE(SUM(total_amount), 0)`,
        paid: sql<number>`COALESCE(SUM(amount_paid), 0)`,
        outstanding: sql<number>`COALESCE(SUM(amount_outstanding), 0)`,
      })
      .from(invoices)
      .where(eq(invoices.isDeleted, false));

    return {
      answer: `Total Billed: ₹${(Number(totals?.billed || 0) / 100000).toFixed(2)} Lakhs. Total Collected: ₹${(Number(totals?.paid || 0) / 100000).toFixed(2)} Lakhs. Outstanding: ₹${(Number(totals?.outstanding || 0) / 100000).toFixed(2)} Lakhs.`,
    };
  }

  return {
    answer: `Query processed. Try asking about 'overdue invoices', 'signed contracts', or 'total revenue'.`,
  };
}

/**
 * Contract risk detection
 */
export async function analyzeContractRisks(contractId: string): Promise<{
  risks: { severity: "high" | "medium" | "low"; message: string }[];
}> {
  await requireRole(["admin", "consultant", "finance"]);

  const [contract] = await db.select().from(contracts).where(eq(contracts.id, contractId));
  if (!contract) throw new Error("Contract not found.");

  const risks: { severity: "high" | "medium" | "low"; message: string }[] = [];

  if (!contract.signedDocUrl && contract.status === "Signed") {
    risks.push({ severity: "high", message: "Contract marked as Signed but no executed file is uploaded." });
  }

  if (!contract.paymentTerms) {
    risks.push({ severity: "medium", message: "Payment terms not specified in agreement." });
  }

  if (!contract.replacementPeriod) {
    risks.push({ severity: "medium", message: "Replacement guarantee period not defined." });
  }

  const today = new Date();
  const endDate = new Date(contract.contractEndDate);
  const daysLeft = Math.floor((endDate.getTime() - today.getTime()) / 86400000);

  if (daysLeft < 30 && contract.status === "Signed") {
    risks.push({ severity: "high", message: `Contract expires in ${daysLeft} days — renewal required.` });
  }

  return { risks };
}
