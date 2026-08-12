import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, consultantNotifications, clientNotifications } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";

export async function GET(request: Request) {
  // Validate authorization
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activeInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(
          or(eq(invoices.status, "Shared"), eq(invoices.status, "Partially Paid")),
          eq(invoices.isDeleted, false)
        )
      );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reminderThresholds = [7, 0, -7, -15, -30];
    let count = 0;

    for (const inv of activeInvoices) {
      if (!inv.dueDate) continue;
      const dueDate = new Date(inv.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (reminderThresholds.includes(diffDays)) {
        const statusLabel = diffDays < 0 ? `${Math.abs(diffDays)} days OVERDUE` : diffDays === 0 ? "due TODAY" : `due in ${diffDays} days`;

        // Notify consultant / finance
        await db.insert(consultantNotifications).values({
          message: `Payment Reminder: Invoice ${inv.invoiceNumber} (₹${(inv.amountOutstanding || 0).toLocaleString("en-IN")} outstanding) is ${statusLabel}.`,
          link: `/dashboard/legal-finance/invoices/${inv.id}`,
          targetRole: "finance",
          createdAt: new Date(),
        });

        // Notify client if linked
        if (inv.clientId) {
          await db.insert(clientNotifications).values({
            clientId: inv.clientId,
            mandateId: inv.mandateId || 0,
            type: "payment_reminder",
            title: `Invoice Payment Reminder — ${inv.invoiceNumber}`,
            message: `Invoice ${inv.invoiceNumber} is ${statusLabel}. Outstanding balance: ₹${(inv.amountOutstanding || 0).toLocaleString("en-IN")}.`,
            link: `/invoices/${inv.id}`,
            isRead: false,
            createdAt: new Date(),
          });
        }

        count++;
      }
    }

    return NextResponse.json({ success: true, remindersSent: count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Cron failed" }, { status: 500 });
  }
}
