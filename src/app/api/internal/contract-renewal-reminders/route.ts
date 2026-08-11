import { NextResponse } from "next/server";
import { db } from "@/db";
import { contracts, consultantNotifications, clients } from "@/db/schema";
import { and, eq, lte, gte } from "drizzle-orm";
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

  const today = new Date();
  const intervals = [60, 45, 30, 15, 7];
  let remindersSent = 0;

  for (const days of intervals) {
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + days);
    const targetStr = targetDate.toISOString().split("T")[0];

    const expiring = await db
      .select({
        contract: contracts,
        clientName: clients.name,
      })
      .from(contracts)
      .leftJoin(clients, eq(contracts.clientId, clients.id))
      .where(
        and(
          eq(contracts.status, "Signed"),
          eq(contracts.contractEndDate, targetStr),
          eq(contracts.isDeleted, false)
        )
      );

    for (const item of expiring) {
      const { contract, clientName } = item;
      const message = `Contract Alert: ${contract.contractNumber} with ${clientName || "Client"} expires in ${days} days (on ${contract.contractEndDate}). Action required: Initiate renewal.`;

      // Notify finance team
      await db.insert(consultantNotifications).values({
        targetRole: "finance",
        message,
        link: `/dashboard/legal-finance/contracts/${contract.id}`,
      });

      await writeLfAuditLog({
        entityType: "contract",
        entityId: contract.id,
        action: "renewal_reminder",
        actorName: "System Cron",
        newValue: { daysLeft: days, endDate: contract.contractEndDate },
      });

      remindersSent++;
    }
  }

  return NextResponse.json({ success: true, remindersSent });
}
