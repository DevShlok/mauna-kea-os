import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/db";
import { mandates } from "@/db/schema";
import { eq } from "drizzle-orm";
const pdfParse = require("pdf-parse-new");
const mammoth = require("mammoth");

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const mandateId = Number(resolvedParams.id);
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const docType = formData.get("docType") as string; // "jd" | "notes" | "docs"
    const textContent = formData.get("textContent") as string | null;
    const mandateName = formData.get("mandateName") as string | null;

    if ((!file && !textContent) || !docType) {
      return NextResponse.json({ error: "File/Text or docType missing" }, { status: 400 });
    }

    const webhookUrl = process.env.OS_DRIVE_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ error: "OS_DRIVE_WEBHOOK_URL not configured" }, { status: 500 });
    }

    // Convert to base64 if it's a file
    let base64 = "";
    let ext = "txt";
    let mimeType = "text/plain";
    let extractedText = "";
    
    if (file) {
      const buffer = await file.arrayBuffer();
      const nodeBuffer = Buffer.from(buffer);
      base64 = nodeBuffer.toString("base64");
      ext = file.name.split(".").pop() || "pdf";
      mimeType = file.type || "application/pdf";

      // If it's a notes file, try to extract text
      if (docType === "notes") {
        if (ext.toLowerCase() === "pdf") {
          try {
            const parsedData = await pdfParse(nodeBuffer);
            extractedText = parsedData.text;
          } catch (e) {
            console.warn("PDF extraction failed:", e);
          }
        } else if (ext.toLowerCase() === "docx") {
          try {
            const result = await mammoth.extractRawText({ buffer: nodeBuffer });
            extractedText = result.value;
          } catch (e) {
            console.warn("DOCX extraction failed:", e);
          }
        }
      }
    }

    // Fetch mandate for a nice filename
    const mandateRows = await db.select().from(mandates).where(eq(mandates.id, mandateId));
    const mandate = mandateRows[0];
    const mandateLabel = mandate ? `${mandate.company} - ${mandate.role}` : `Mandate-${mandateId}`;

    const labelMap: Record<string, string> = {
      jd: "JD",
      notes: "Interview Notes",
      docs: "Additional Docs",
    };

    const filename = `${mandateLabel} — ${labelMap[docType] || docType}.${ext}`;

    // Upload to Google Drive via Apps Script
    const driveRes = await fetch(webhookUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileType: "mandate_doc",
        base64: file ? base64 : undefined,
        mimeType: file ? mimeType : undefined,
        textContent: textContent || undefined,
        filename,
        mandateName: mandateName || undefined
      }),
    });

    const driveData = await driveRes.json();
    if (driveData.status !== "success") {
      throw new Error(driveData.message || "Drive upload failed");
    }

    const driveUrl = driveData.url;

    // Map docType to the correct DB column
    const columnMap: Record<string, object> = {
      jd: textContent ? { jdUrl: driveUrl, jdText: textContent } : { jdUrl: driveUrl },
      notes: textContent 
        ? { interviewNotesUrl: driveUrl, interviewNotesText: textContent } 
        : { interviewNotesUrl: driveUrl, interviewNotesText: extractedText || undefined },
      docs: { additionalDocsUrl: driveUrl },
    };

    if (!columnMap[docType]) {
      return NextResponse.json({ error: "Invalid docType" }, { status: 400 });
    }

    await db.update(mandates).set(columnMap[docType]).where(eq(mandates.id, mandateId));
    
    // @ts-ignore
    revalidateTag("dashboard-data");

    return NextResponse.json({ success: true, url: driveUrl, extractedText: extractedText || undefined });
  } catch (error: any) {
    console.error("Mandate doc upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
