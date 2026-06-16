import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidateFiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candId = searchParams.get('candId');

    if (!candId) {
      return NextResponse.json({ error: "candId is required" }, { status: 400 });
    }

    const files = await db
      .select()
      .from(candidateFiles)
      .where(eq(candidateFiles.candId, candId))
      .orderBy(desc(candidateFiles.createdAt));

    return NextResponse.json({ success: true, files });
  } catch (error: any) {
    console.error("Fetch Candidate Files Error:", error);
    return NextResponse.json({ error: "Failed to fetch candidate files" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = parseInt(searchParams.get('id') || '0', 10);

    if (!fileId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await db.delete(candidateFiles).where(eq(candidateFiles.id, fileId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Candidate File Error:", error);
    return NextResponse.json({ error: "Failed to delete candidate file" }, { status: 500 });
  }
}
