import { db } from "@/db";
import { candidateReports } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId");

    if (!candidateId) {
      return NextResponse.json({ error: "candidateId is required" }, { status: 400 });
    }

    // Fetch the most recent completed report for this candidate
    const reports = await db
      .select()
      .from(candidateReports)
      .where(eq(candidateReports.candidateId, candidateId))
      .orderBy(desc(candidateReports.createdAt))
      .limit(1);

    if (reports.length === 0 || reports[0].status !== "Completed") {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({ exists: true, report: reports[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
