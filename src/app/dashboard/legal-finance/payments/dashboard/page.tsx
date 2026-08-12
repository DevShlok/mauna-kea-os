import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { invoices, invoicePayments, clients } from "@/db/schema";
import { eq, sql, and, lte, gt, gte } from "drizzle-orm";
import PaymentDashboardClient from "@/features/legal-finance/payments/components/PaymentDashboardClient";

export const dynamic = "force-dynamic";

export default async function PaymentsDashboardPage() {
  await requireRole(["admin", "finance"]);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Start of current month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [[collectedMonth], [outstanding], outstandingInvoices, [avgDays]] = await Promise.all([
    // Collected this calendar month
    db
      .select({
        total: sql<number>`COALESCE(SUM(amount), 0)`,
      })
      .from(invoicePayments)
      .where(
        and(
          eq(invoicePayments.isReversed, false),
          gte(invoicePayments.paymentDate, monthStart)
        )
      ),

    // Total outstanding across all unpaid/partial invoices
    db
      .select({
        totalOutstanding: sql<number>`COALESCE(SUM(amount_outstanding), 0)`,
        overdueCount: sql<number>`COUNT(CASE WHEN due_date < ${sql.raw(`'${todayStr}'`)} THEN 1 END)`,
        overdueAmount: sql<number>`COALESCE(SUM(CASE WHEN due_date < ${sql.raw(`'${todayStr}'`)} THEN amount_outstanding ELSE 0 END), 0)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.isDeleted, false),
          gt(invoices.amountOutstanding, 0)
        )
      ),

    // Individual outstanding invoices
    db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        clientName: clients.name,
        dueDate: invoices.dueDate,
        totalAmount: invoices.totalAmount,
        amountPaid: invoices.amountPaid,
        amountOutstanding: invoices.amountOutstanding,
        status: invoices.status,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(
        and(
          eq(invoices.isDeleted, false),
          gt(invoices.amountOutstanding, 0)
        )
      )
      .orderBy(invoices.dueDate),

    // Average days from invoice_date to first payment (proxy metric)
    db
      .select({
        avgDays: sql<number>`COALESCE(AVG(EXTRACT(DAY FROM (${invoicePayments.paymentDate}::timestamp - ${invoices.invoiceDate}::timestamp))), 0)`,
      })
      .from(invoicePayments)
      .innerJoin(invoices, eq(invoicePayments.invoiceId, invoices.id))
      .where(eq(invoicePayments.isReversed, false))
  ]);

  const kpis = {
    totalCollectedMonth: Number(collectedMonth?.total || 0),
    totalOutstandingAll: Number(outstanding?.totalOutstanding || 0),
    overdueCount: Number(outstanding?.overdueCount || 0),
    overdueAmount: Number(outstanding?.overdueAmount || 0),
    avgDaysToPayment: Math.round(Number(avgDays?.avgDays || 0)),
  };

  const enriched = outstandingInvoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    clientName: inv.clientName || "Unknown",
    dueDate: inv.dueDate,
    totalAmount: Number(inv.totalAmount || 0),
    amountPaid: Number(inv.amountPaid || 0),
    amountOutstanding: Number(inv.amountOutstanding || 0),
    status: inv.status || "Issued",
    isOverdue: inv.dueDate < todayStr,
  }));

  return (
    <PaymentDashboardClient
      kpis={kpis}
      outstandingInvoices={JSON.parse(JSON.stringify(enriched))}
    />
  );
}
