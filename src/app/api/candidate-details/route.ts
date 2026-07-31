import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import { inArray } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawId = searchParams.get('id');

  if (!rawId) {
    return NextResponse.json({ error: "Missing candidate ID" }, { status: 400 });
  }

  const id = decodeURIComponent(rawId).trim();
  const possibleIds = [id];
  if (id.startsWith("CAND-")) possibleIds.push(id.replace("CAND-", ""));
  else possibleIds.push(`CAND-${id}`);

  try {
    const data = await db.select({
      cvText: candidates.cvText,
      profilePic: candidates.profilePic
    }).from(candidates).where(inArray(candidates.id, possibleIds));

    if (data.length === 0) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, cvText: data[0].cvText, profilePic: data[0].profilePic });
  } catch (error) {
    console.error("Error fetching candidate details:", error);
    return NextResponse.json({ error: "Failed to fetch candidate details" }, { status: 500 });
  }
}
