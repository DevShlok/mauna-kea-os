import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { invoices, contracts, clients } from "@/db/schema";
import { eq, sql, and, lte, gte, lt, isNull, or, not } from "drizzle-orm";
import ReportsClient from "@/features/legal-finance/reports/components/ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireRole(["admin", "finance"]);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const in90Days = new Date(today);
  in90Days.setDate(in90Days.getDate() + 90);
  const in90Str = in90Days.toISOString().split("T")[0];

  const [
    [totals],
    [overdue],
    byClient,
    [gstTotals],
    upcomingContracts,
  ] = await Promise.all([
    // ─── Financial totals ───────────────────────────────────────────────────
    db
      .select({
        totalBilled: sql<number>`COALESCE(SUM(total_amount), 0)`,
        totalCollected: sql<number>`COALESCE(SUM(amount_paid), 0)`,
        totalOutstanding: sql<number>`COALESCE(SUM(amount_outstanding), 0)`,
        // Real aging buckets: based on days past due_date
        bucket0_30: sql<number>`COALESCE(SUM(CASE WHEN due_date >= ${sql.raw(`'${todayStr}'`)} - INTERVAL '30 days' AND due_date <= ${sql.raw(`'${todayStr}'`)} AND amount_outstanding > 0 THEN amount_outstanding ELSE 0 END), 0)`,
        bucket31_60: sql<number>`COALESCE(SUM(CASE WHEN due_date < ${sql.raw(`'${todayStr}'`)} - INTERVAL '30 days' AND due_date >= ${sql.raw(`'${todayStr}'`)} - INTERVAL '60 days' AND amount_outstanding > 0 THEN amount_outstanding ELSE 0 END), 0)`,
        bucket61_90: sql<number>`COALESCE(SUM(CASE WHEN due_date < ${sql.raw(`'${todayStr}'`)} - INTERVAL '60 days' AND due_date >= ${sql.raw(`'${todayStr}'`)} - INTERVAL '90 days' AND amount_outstanding > 0 THEN amount_outstanding ELSE 0 END), 0)`,
        bucket90_plus: sql<number>`COALESCE(SUM(CASE WHEN due_date < ${sql.raw(`'${todayStr}'`)} - INTERVAL '90 days' AND amount_outstanding > 0 THEN amount_outstanding ELSE 0 END), 0)`,
      })
      .from(invoices)
      .where(eq(invoices.isDeleted, false)),

    // ─── Overdue total ──────────────────────────────────────────────────────
    db
      .select({
        overdueAmount: sql<number>`COALESCE(SUM(amount_outstanding), 0)`,
      })
      .from(invoices)
      .where(
        and(
          lte(invoices.dueDate, todayStr),
          eq(invoices.isDeleted, false),
          sql`amount_outstanding > 0`
        )
      ),

    // ─── Revenue by client ──────────────────────────────────────────────────
    db
      .select({
        clientName: clients.name,
        billed: sql<number>`COALESCE(SUM(${invoices.totalAmount}), 0)`,
        paid: sql<number>`COALESCE(SUM(${invoices.amountPaid}), 0)`,
        outstanding: sql<number>`COALESCE(SUM(${invoices.amountOutstanding}), 0)`,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.isDeleted, false))
      .groupBy(clients.name)
      .orderBy(sql`SUM(${invoices.totalAmount}) DESC`),

    // ─── GST aggregation ────────────────────────────────────────────────────
    db
      .select({
        totalCgst: sql<number>`COALESCE(SUM(cgst_amount), 0)`,
        totalSgst: sql<number>`COALESCE(SUM(sgst_amount), 0)`,
        totalIgst: sql<number>`COALESCE(SUM(igst_amount), 0)`,
        totalGst: sql<number>`COALESCE(SUM(gst_amount), 0)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.isDeleted, false),
          sql`status NOT IN ('Cancelled', 'Draft')`
        )
      ),

    // ─── Contracts expiring within 90 days (or recently expired) ───────────
    db
      .select({
        contractNumber: contracts.contractNumber,
        clientName: clients.name,
        endDate: contracts.contractEndDate,
        renewalType: contracts.renewalType,
      })
      .from(contracts)
      .leftJoin(clients, eq(contracts.clientId, clients.id))
      .where(
        and(
          eq(contracts.isDeleted, false),
          lte(contracts.contractEndDate, in90Str),
          gte(contracts.contractEndDate, sql.raw(`'${todayStr}'::date - INTERVAL '30 days'`))
        )
      )
      .orderBy(contracts.contractEndDate),
  ]);

  const summary = {
    totalBilled: Number(totals?.totalBilled || 0),
    totalCollected: Number(totals?.totalCollected || 0),
    totalOutstanding: Number(totals?.totalOutstanding || 0),
    overdueAmount: Number(overdue?.overdueAmount || 0),
    byClient: byClient.map((c) => ({
      clientName: c.clientName || "Unknown",
      billed: Number(c.billed),
      paid: Number(c.paid),
      outstanding: Number(c.outstanding),
    })),
    aging: {
      bucket0_30: Number(totals?.bucket0_30 || 0),
      bucket31_60: Number(totals?.bucket31_60 || 0),
      bucket61_90: Number(totals?.bucket61_90 || 0),
      bucket90_plus: Number(totals?.bucket90_plus || 0),
    },
    gstSummary: {
      totalCgst: Number(gstTotals?.totalCgst || 0),
      totalSgst: Number(gstTotals?.totalSgst || 0),
      totalIgst: Number(gstTotals?.totalIgst || 0),
      totalGst: Number(gstTotals?.totalGst || 0),
    },
    contractRenewals: upcomingContracts.map((c) => {
      const end = new Date(c.endDate);
      const daysToExpiry = Math.ceil(
        (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        contractNumber: c.contractNumber,
        clientName: c.clientName || "Unknown",
        endDate: c.endDate,
        daysToExpiry,
        renewalType: c.renewalType || "Manual",
      };
    }),
  };

  return <ReportsClient summary={JSON.parse(JSON.stringify(summary))} />;
}
