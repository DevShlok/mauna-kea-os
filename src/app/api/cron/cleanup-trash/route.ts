import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients, mandates, candidates, floats, platformUsers, frameworks } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateString = thirtyDaysAgo.toISOString();

    await db.delete(clients).where(sql`is_deleted = true AND deleted_at < ${dateString}`);
    await db.delete(mandates).where(sql`is_deleted = true AND deleted_at < ${dateString}`);
    await db.delete(candidates).where(sql`is_deleted = true AND deleted_at < ${dateString}`);
    await db.delete(floats).where(sql`is_deleted = true AND deleted_at < ${dateString}`);
    await db.delete(platformUsers).where(sql`is_deleted = true AND deleted_at < ${dateString}`);
    await db.delete(frameworks).where(sql`is_deleted = true AND deleted_at < ${dateString}`);

    return NextResponse.json({ success: true, message: "Trash cleaned up successfully" });
  } catch (error: any) {
    console.error("Error cleaning up trash:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
