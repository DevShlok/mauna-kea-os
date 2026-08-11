import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, consultantNotifications, clients } from "@/db/schema";
import { and, eq, lte } from "drizzle-orm";
import { writeLfAuditLog } from "@/lib/lf-audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET env var is not set. Refusing cron request.");
    return NextResponse.json({ error: "Unauthorized — CRON_SECRET not configured" }, { status: 401 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStr = new Date().toISOString().split("T")[0];

  // Find all unpaid invoices where due date has passed
  const overdueList = await db
    .select({
      invoice: invoices,
      clientName: clients.name,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(
      and(
        lte(invoices.dueDate, todayStr),
        eq(invoices.isDeleted, false)
      )
    );

  let updatedCount = 0;

  for (const item of overdueList) {
    const { invoice, clientName } = item;

    if (invoice.status !== "Paid" && invoice.status !== "Cancelled" && invoice.status !== "Overdue") {
      // Mark status as Overdue
      await db
        .update(invoices)
        .set({ status: "Overdue", updatedAt: new Date() })
        .where(eq(invoices.id, invoice.id));

      const message = `Overdue Invoice Alert: ${invoice.invoiceNumber} for ${clientName || "Client"} of ₹${((invoice.amountOutstanding || 0) / 100000).toFixed(2)} Lakhs passed due date on ${invoice.dueDate}.`;

      await db.insert(consultantNotifications).values({
        targetRole: "finance",
        message,
        link: `/dashboard/legal-finance/invoices/${invoice.id}`,
      });

      await writeLfAuditLog({
        entityType: "invoice",
        entityId: invoice.id,
        action: "reminder_sent",
        actorName: "System Cron",
        newValue: { status: "Overdue", dueDate: invoice.dueDate },
      });

      updatedCount++;
    }
  }

  return NextResponse.json({ success: true, overdueProcessed: updatedCount });
}
