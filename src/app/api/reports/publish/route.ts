import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidateReports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // Only consultants or admins should be able to publish/unpublish reports
    await requireRole(["consultant", "admin"]);
    
    const body = await req.json();
    const { reportId, sharedWithClient } = body;

    if (!reportId || typeof sharedWithClient !== "boolean") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    await db
      .update(candidateReports)
      .set({ sharedWithClient })
      .where(eq(candidateReports.id, reportId));

    return NextResponse.json({ success: true, sharedWithClient });
  } catch (error: any) {
    console.error("Error updating report publish status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
