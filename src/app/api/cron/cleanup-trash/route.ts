import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients, mandates, candidates, floats, platformUsers, frameworks } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Security: fail closed — if CRON_SECRET is not configured this route
    // refuses all requests. Never skip the check on a missing env var.
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error("CRON_SECRET env var is not set. Refusing cron request.");
      return new NextResponse("Unauthorized — CRON_SECRET not configured", { status: 401 });
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
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
