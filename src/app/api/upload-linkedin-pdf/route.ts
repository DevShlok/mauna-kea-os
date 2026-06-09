import { NextResponse } from "next/server";
import { db } from "@/db";
import { flCandidates } from "@/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const candId = formData.get("candId") as string;

    if (!file || !candId) {
      return NextResponse.json({ error: "File or CandId missing" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const nodeBuffer = Buffer.from(buffer);

    // Save the PDF locally for downloading
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "linkedin");
    const filePath = path.join(uploadsDir, `${candId}.pdf`);
    await fs.writeFile(filePath, nodeBuffer);

    // Update DB
    await db.update(flCandidates)
      .set({ linkedinPdf: `/uploads/linkedin/${candId}.pdf` })
      .where(eq(flCandidates.id, candId));

    return NextResponse.json({ success: true, path: `/uploads/linkedin/${candId}.pdf` });
  } catch (error: any) {
    console.error("LinkedIn PDF Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload LinkedIn PDF" }, { status: 500 });
  }
}
