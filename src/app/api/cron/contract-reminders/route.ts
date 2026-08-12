import { NextResponse } from "next/server";
import { db } from "@/db";
import { contracts, consultantNotifications } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(request: Request) {
  // Validate authorization
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activeContracts = await db
      .select()
      .from(contracts)
      .where(and(eq(contracts.status, "Signed"), eq(contracts.isDeleted, false)));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reminderDays = [60, 45, 30, 15, 7, 0];
    let count = 0;

    for (const contract of activeContracts) {
      if (!contract.contractEndDate) continue;
      const endDate = new Date(contract.contractEndDate);
      endDate.setHours(0, 0, 0, 0);

      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (reminderDays.includes(diffDays)) {
        await db.insert(consultantNotifications).values({
          message: `Contract Renewal Alert: ${contract.contractNumber} (${contract.clientId}) expires in ${diffDays} day(s).`,
          link: `/dashboard/legal-finance/contracts/${contract.id}`,
          targetRole: "consultant",
          createdAt: new Date(),
        });
        count++;
      }
    }

    return NextResponse.json({ success: true, remindersSent: count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Cron failed" }, { status: 500 });
  }
}
