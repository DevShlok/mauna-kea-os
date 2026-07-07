import { NextResponse } from "next/server";
import { db } from "@/db";
import { timeLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { getUserByEmail } from "@/db/queries";

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const platformUser = await getUserByEmail(email);
    if (!platformUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const history = searchParams.get('history');
    const targetUserId = searchParams.get('userId');

    if (history === 'true') {
      // If admin and targetUserId is provided, fetch for that user. Otherwise fetch for self.
      const queryUserId = (platformUser.role === 'admin' && targetUserId) ? targetUserId : platformUser.id;
      
      const logs = await db
        .select()
        .from(timeLogs)
        .where(eq(timeLogs.userId, queryUserId))
        .orderBy(desc(timeLogs.timestamp))
        .limit(100);
      return NextResponse.json({ success: true, logs });
    }

    // Get the most recent time log for the user to determine their current status
    const recentLogs = await db
      .select()
      .from(timeLogs)
      .where(eq(timeLogs.userId, platformUser.id))
      .orderBy(desc(timeLogs.timestamp))
      .limit(1);

    const latestLog = recentLogs.length > 0 ? recentLogs[0] : null;
    let status = "Clocked Out";

    if (latestLog) {
      if (latestLog.action === 'clock_in') status = "Clocked In";
      else if (latestLog.action === 'break_start') status = "On Break";
      else if (latestLog.action === 'break_end') status = "Clocked In";
      else if (latestLog.action === 'clock_out') status = "Clocked Out";
    }

    return NextResponse.json({ success: true, status, latestLog });
  } catch (error) {
    console.error("Error fetching time logs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const platformUser = await getUserByEmail(email);
    if (!platformUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { action } = body;

    if (!['clock_in', 'clock_out', 'break_start', 'break_end'].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // A bug could happen with timezones, let's use JS native Date but parse out the YYYY-MM-DD
    const now = new Date();
    const dateString = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    await db.insert(timeLogs).values({
      userId: platformUser.id,
      action: action,
      timestamp: now,
      dateString: dateString as any, // Cast to any or provide valid Date if Date object is expected by drizzle `date` type
    });
    // Wait, Drizzle mysql-core `date` type usually takes a string or Date object.
    // Let's pass the string.

    return NextResponse.json({ success: true, message: `Successfully logged ${action}` });
  } catch (error) {
    console.error("Error logging time:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
