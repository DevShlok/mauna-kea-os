import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates, candidateFiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as mammoth from "mammoth";
import {
  createSupabaseAdmin,
  validateFileUpload,
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/api-guard";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
const pdfParse = require("pdf-parse-new");

// Allowed reference document types — validated against this list
const ALLOWED_REFERENCE_TYPES = new Set([
  "Interview Notes",
  "Superior Reference",
  "Peer Reference",
  "Background Check",
  "Other",
]);

export async function POST(req: Request) {
  // Rate limit: 10 requests per minute per IP
  const rl = rateLimit(req, "upload-reference", { limit: 10, windowMs: 60_000 });
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  // Service role key is required for storage uploads — fail loudly if missing.
  // Never fall back to the public NEXT_PUBLIC_ key on server-side operations.
  const supabase = createSupabaseAdmin();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const candId = formData.get("candId") as string;
    const type = formData.get("type") as string; // e.g. 'Interview Notes', 'Superior Reference'

    if (!file || !candId || !type) {
      return NextResponse.json({ error: "File, CandId, or Type missing" }, { status: 400 });
    }

    // Validate the reference type against the allowed set
    if (!ALLOWED_REFERENCE_TYPES.has(type)) {
      return NextResponse.json(
        { error: `Invalid type. Allowed: ${Array.from(ALLOWED_REFERENCE_TYPES).join(", ")}` },
        { status: 400 }
      );
    }

    // Validate MIME type (PDF + Word documents only) and file size (max 10 MB)
    const check = validateFileUpload(file, {
      allowedTypes: ALLOWED_DOCUMENT_TYPES,
      maxBytes: MAX_DOCUMENT_SIZE_BYTES,
    });
    if (!check.ok) return check.error;

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
