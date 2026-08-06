import { NextResponse } from "next/server";
import { db } from "@/db";
import { floats, consultantNotifications, platformUsers } from "@/db/schema";
import { and, lte, eq, or, isNull, ne } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Verify authorization header with CRON_SECRET if configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  // Find active, non-deleted floats stalled > 7 days without a recent nudge in last 2 days
  const stalledFloats = await db
    .select()
    .from(floats)
    .where(
      and(
        eq(floats.isDeleted, false),
        lte(floats.updatedAt, sevenDaysAgo),
        or(
          isNull(floats.status),
          and(
            ne(floats.status, "Hired"),
            ne(floats.status, "Rejected")
          )
        ),
        or(
          isNull(floats.nudgeSentAt),
          lte(floats.nudgeSentAt, twoDaysAgo)
        )
      )
    );

  let notifiedCount = 0;

  for (const float of stalledFloats) {
    // Find matching consultant user by name if available
    const [consultant] = await db
      .select({ id: platformUsers.id })
      .from(platformUsers)
      .where(eq(platformUsers.name, float.consultant ?? ""))
      .limit(1);

    await db.insert(consultantNotifications).values({
      userId: consultant?.id ?? null,
      targetRole: consultant ? null : "consultant",
      message: `Reminder: No update recorded for ${float.client || "a client"} – ${float.role || "role"} in 7+ days. Please check in with the client.`,
      link: `/dashboard/float-list/${float.candId}`,
      isRead: false,
    });

    // Stamp nudgeSentAt to enforce 2-day cooldown between notifications
    await db
      .update(floats)
      .set({ nudgeSentAt: new Date() })
      .where(eq(floats.id, float.id));

    notifiedCount++;
  }

  return NextResponse.json({ success: true, notified: notifiedCount });
}
