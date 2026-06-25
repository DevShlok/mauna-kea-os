import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: "Missing candidate ID" }, { status: 400 });
  }

  try {
    const data = await db.select({
      cvText: candidates.cvText,
      profilePic: candidates.profilePic
    }).from(candidates).where(eq(candidates.id, id));

    if (data.length === 0) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, cvText: data[0].cvText, profilePic: data[0].profilePic });
  } catch (error) {
    console.error("Error fetching candidate details:", error);
    return NextResponse.json({ error: "Failed to fetch candidate details" }, { status: 500 });
  }
}
