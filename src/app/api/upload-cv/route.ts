import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates, candidateFiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as mammoth from "mammoth";
import { createClient } from "@supabase/supabase-js";
const pdfParse = require("pdf-parse-new");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! || ""
);

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

    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";

    // 1. Extract text from PDF or DOCX for AI Workbench
    let cvText = "";
    try {
      if (ext === "docx" || ext === "doc") {
        const result = await mammoth.extractRawText({ buffer: nodeBuffer });
        cvText = result.value;
      } else {
        const parsedData = await pdfParse(nodeBuffer);
        cvText = parsedData.text;
      }
    } catch (e) {
      console.warn("Text extraction failed, continuing without text:", e);
    }

    // 2. Upload to Google Drive via Apps Script
    const webhookUrl = process.env.OS_DRIVE_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ error: "OS_DRIVE_WEBHOOK_URL not configured" }, { status: 500 });
    }

    const base64 = nodeBuffer.toString("base64");

    // Fetch candidate name for a nice filename
    const candRows = await db.select().from(candidates).where(eq(candidates.id, candId));
    const candName = candRows[0]?.name || candId;
    const filename = `${candName} - CV.${ext}`;

    const driveRes = await fetch(webhookUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileType: "cv",
        base64,
        mimeType: file.type || "application/pdf",
        filename,
      }),
    });

    const driveData = await driveRes.json();
    if (driveData.status !== "success") {
      throw new Error(driveData.message || "Drive upload failed");
    }

    const driveUrl = driveData.url;

    // 2.5 Upload to Supabase Storage
    const supabaseFileName = `cvs/${candId}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('mauna-kea-documents')
      .upload(supabaseFileName, nodeBuffer, {
        contentType: file.type || "application/pdf"
      });
      
    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      throw new Error("Supabase upload failed");
    }

    const { data: publicUrlData } = supabase.storage
      .from('mauna-kea-documents')
      .getPublicUrl(supabaseFileName);
      
    const supabaseUrl = publicUrlData.publicUrl;

    // 3. Update DB with Supabase URL and extracted text
    await db.update(candidates)
      .set({ hasCv: true, cvText, cvFileName: supabaseUrl })
      .where(eq(candidates.id, candId));

    // Also add to history table
    await db.insert(candidateFiles).values({
      candId: candId,
      fileType: 'CV / Resume',
      fileName: filename,
      fileUrl: supabaseUrl,
      extractedText: cvText
    });

    const { floatActivities } = await import("@/db/schema");
    const now = new Date();
    await db.insert(floatActivities).values({
      candId: candId,
      type: "Event (Update CV)",
      note: `CV / Resume uploaded: ${filename}`,
      consultant: "System",
      date: now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      time: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    });

    // 4. Update Google Sheet (if configured)
    const sheetsWebhook = process.env.OS_SHEETS_WEBHOOK_URL;
    if (sheetsWebhook) {
      try {
        fetch(sheetsWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candId, cvUrl: supabaseUrl }) // send Supabase URL to sheets
        }).catch(e => console.error("Sheets sync error:", e));
      } catch (err) {
        console.error("Sheets fetch failed:", err);
      }
    }

    return NextResponse.json({ success: true, url: supabaseUrl });
  } catch (error: any) {
    console.error("CV Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload CV: " + error.message }, { status: 500 });
  }
}
