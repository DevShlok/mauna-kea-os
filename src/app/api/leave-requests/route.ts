import { NextResponse } from "next/server";
import { db } from "@/db";
import { leaveRequests, platformUsers, consultantNotifications } from "@/db/schema";
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
    const viewAll = searchParams.get('all') === 'true'; // for admins

    let requests;
    if (viewAll && platformUser.role === 'admin') {
      requests = await db.select({
        id: leaveRequests.id,
        userId: leaveRequests.userId,
        userName: platformUsers.name,
        leaveType: leaveRequests.leaveType,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        adminNotes: leaveRequests.adminNotes,
        createdAt: leaveRequests.createdAt
      })
      .from(leaveRequests)
      .leftJoin(platformUsers, eq(leaveRequests.userId, platformUsers.id))
      .orderBy(desc(leaveRequests.createdAt));
    } else {
      requests = await db.select().from(leaveRequests).where(eq(leaveRequests.userId, platformUser.id)).orderBy(desc(leaveRequests.createdAt));
    }

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error("Error fetching leaves:", error);
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
    const { leaveType, startDate, endDate, reason } = body;

    if (!leaveType || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Convert string inputs to Date string formats acceptable by DB
    await db.insert(leaveRequests).values({
      userId: platformUser.id,
      leaveType,
      startDate, // expected YYYY-MM-DD
      endDate,   // expected YYYY-MM-DD
      reason,
      status: 'Pending',
    });

    await db.insert(consultantNotifications).values({
      targetRole: 'admin',
      message: `${platformUser.name || 'A consultant'} applied for leave (${leaveType}).`,
      link: '/dashboard/admin/leave-approvals'
    });

    return NextResponse.json({ success: true, message: "Leave request submitted" });
  } catch (error) {
    console.error("Error creating leave:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const platformUser = await getUserByEmail(email);
    if (!platformUser || platformUser.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, adminNotes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    await db.update(leaveRequests)
      .set({ status, adminNotes })
      .where(eq(leaveRequests.id, id));

    const leaveReq = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    if (leaveReq.length > 0) {
      const applicantId = leaveReq[0].userId;
      await db.insert(consultantNotifications).values({
        userId: applicantId,
        message: `Your leave request has been ${status.toLowerCase()}.`,
        link: '/dashboard/time-leave'
      });
    }

    return NextResponse.json({ success: true, message: "Leave request updated" });
  } catch (error) {
    console.error("Error updating leave:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
