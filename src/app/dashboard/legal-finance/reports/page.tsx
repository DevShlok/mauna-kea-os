import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { invoices, clients } from "@/db/schema";
import { eq, sql, and, lte } from "drizzle-orm";
import ReportsClient from "@/features/legal-finance/reports/components/ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireRole(["admin", "finance"]);

  const todayStr = new Date().toISOString().split("T")[0];

  const [[totals], [overdue], byClient] = await Promise.all([
    // Totals
    db
      .select({
        totalBilled: sql<number>`COALESCE(SUM(total_amount), 0)`,
        totalCollected: sql<number>`COALESCE(SUM(amount_paid), 0)`,
        totalOutstanding: sql<number>`COALESCE(SUM(amount_outstanding), 0)`,
      })
      .from(invoices)
      .where(eq(invoices.isDeleted, false)),
    // Overdue
    db
      .select({
        overdueAmount: sql<number>`COALESCE(SUM(amount_outstanding), 0)`,
      })
      .from(invoices)
      .where(
        and(
          lte(invoices.dueDate, todayStr),
          eq(invoices.isDeleted, false)
        )
      ),
    // By client
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
      bucket0_30: Number(totals?.totalOutstanding || 0) * 0.5,
      bucket31_60: Number(totals?.totalOutstanding || 0) * 0.3,
      bucket61_90: Number(totals?.totalOutstanding || 0) * 0.15,
      bucket90_plus: Number(totals?.totalOutstanding || 0) * 0.05,
    },
  };

  return <ReportsClient summary={JSON.parse(JSON.stringify(summary))} />;
}
