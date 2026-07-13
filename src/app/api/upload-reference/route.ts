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
    const type = formData.get("type") as string; // 'Interview Notes', 'Superior Reference', 'Peer Reference'

    if (!file || !candId || !type) {
      return NextResponse.json({ error: "File, CandId, or Type missing" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const nodeBuffer = Buffer.from(buffer);

    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";

    // 1. Extract text from PDF or DOCX
    let extractedText = "";
    try {
      if (ext === "docx" || ext === "doc") {
        const result = await mammoth.extractRawText({ buffer: nodeBuffer });
        extractedText = result.value;
      } else {
        const parsedData = await pdfParse(nodeBuffer);
        extractedText = parsedData.text;
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
    const filename = `${candName} - ${type}.${ext}`;

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
    const supabaseFileName = `references/${candId}-${Date.now()}.${ext}`;
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

    // 3. Add to candidateFiles history table
    await db.insert(candidateFiles).values({
      candId: candId,
      fileType: type,
      fileName: filename,
      fileUrl: supabaseUrl,
      extractedText: extractedText
    });

    return NextResponse.json({ success: true, url: supabaseUrl, text: extractedText });
  } catch (error: any) {
    console.error("Reference Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload file: " + error.message }, { status: 500 });
  }
}
