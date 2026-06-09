import { NextResponse } from "next/server";
import { db } from "@/db";
import { flCandidates } from "@/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
const pdfParse = require("pdf-parse-new");

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

    // Parse the PDF
    const parsedData = await pdfParse(nodeBuffer);
    const cvText = parsedData.text;

    // Save the PDF locally for downloading
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "cvs");
    const filePath = path.join(uploadsDir, `${candId}.pdf`);
    await fs.writeFile(filePath, nodeBuffer);

    // Update DB
    await db.update(flCandidates)
      .set({ hasCv: true, cvText })
      .where(eq(flCandidates.id, candId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("CV Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload CV" }, { status: 500 });
  }
}
