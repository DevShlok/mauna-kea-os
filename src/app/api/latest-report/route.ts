import { db } from "@/db";
import { candidateReports } from "@/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId");
    const frameworkId = searchParams.get("frameworkId");

    if (!candidateId) {
      return NextResponse.json({ error: "candidateId is required" }, { status: 400 });
    }

    const conditions = [
      eq(candidateReports.candidateId, candidateId),
      ne(candidateReports.frameworkId, "rubric-assessment")
    ];

    if (frameworkId) {
      conditions.push(eq(candidateReports.frameworkId, frameworkId));
    }

    // Fetch the most recent completed AI framework report for this candidate
    const reports = await db
      .select()
      .from(candidateReports)
      .where(and(...conditions))
      .orderBy(desc(candidateReports.createdAt))
      .limit(1);

    if (reports.length === 0) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({ exists: true, report: reports[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
