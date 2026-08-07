import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/db";
import { mandates } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  createSupabaseAdmin,
  validateFileUpload,
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/api-guard";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
const pdfParse = require("pdf-parse-new");
const mammoth = require("mammoth");

// Allowed docType values — only these map to real DB columns
const ALLOWED_DOC_TYPES = new Set(["jd", "notes", "docs"]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: 10 requests per minute per IP
  const rl = rateLimit(req, "mandate-upload", { limit: 10, windowMs: 60_000 });
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  // Service role key is required for storage uploads — fail loudly if missing.
  // Never fall back to the public NEXT_PUBLIC_ key on server-side operations.
  const supabase = createSupabaseAdmin();

  try {
    const resolvedParams = await params;
    const mandateId = Number(resolvedParams.id);
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const docType = formData.get("docType") as string; // "jd" | "notes" | "docs"
    const textContent = formData.get("textContent") as string | null;
    const mandateName = formData.get("mandateName") as string | null;

    // Validate docType against the allowed set to prevent arbitrary column writes
    if (!docType || !ALLOWED_DOC_TYPES.has(docType)) {
      return NextResponse.json(
        { error: `Invalid docType. Allowed values: ${Array.from(ALLOWED_DOC_TYPES).join(", ")}` },
        { status: 400 }
      );
    }

    if (!file && !textContent) {
      return NextResponse.json({ error: "File or textContent is required" }, { status: 400 });
    }

    // If a file is provided, validate MIME type (PDF + Word) and size (max 10 MB)
    if (file) {
      const check = validateFileUpload(file, {
        allowedTypes: ALLOWED_DOCUMENT_TYPES,
        maxBytes: MAX_DOCUMENT_SIZE_BYTES,
      });
      if (!check.ok) return check.error;
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
    let nodeBuffer: Buffer | null = null;
    
    if (file) {
      const buffer = await file.arrayBuffer();
      nodeBuffer = Buffer.from(buffer);
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
    let finalUrl = driveUrl;

    if (file) {
      // Upload to Supabase Storage
      const supabaseFileName = `mandates/${mandateId}-${docType}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('mauna-kea-documents')
        .upload(supabaseFileName, nodeBuffer!, {
          contentType: mimeType
        });
        
      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        throw new Error("Supabase upload failed");
      }

      const { data: publicUrlData } = supabase.storage
        .from('mauna-kea-documents')
        .getPublicUrl(supabaseFileName);
        
      finalUrl = publicUrlData.publicUrl;
    }

    // Map docType to the correct DB column
    const columnMap: Record<string, object> = {
      jd: { jdUrl: finalUrl },
      notes: { interviewNotesUrl: finalUrl },
      docs: { additionalDocsUrl: finalUrl }
    };
    const textColumnMap: Record<string, object> = {
      jd: { jdText: extractedText || textContent },
      notes: { interviewNotesText: extractedText || textContent },
      docs: { additionalDocsText: extractedText || textContent }
    };

    const { getCurrentUserName } = await import("@/lib/server-session");
    const updatedBy = await getCurrentUserName();
    const existingLog = mandate?.auditLog || {};
    existingLog[docType] = { updatedBy, updatedAt: new Date().toISOString() };
    delete existingLog["Documents"]; // clean up old log

    let updateData: any = { auditLog: existingLog };
    if (file || textContent) {
      updateData = { ...updateData, ...columnMap[docType], ...textColumnMap[docType] };
    } else if (textContent) {
      updateData = { ...updateData, ...textColumnMap[docType] };
    }

    await db.update(mandates).set(updateData).where(eq(mandates.id, mandateId));
    
    // @ts-ignore
    revalidateTag("dashboard-data");

    return NextResponse.json({ success: true, url: finalUrl, text: extractedText || textContent });
  } catch (error: any) {
    console.error("Mandate doc upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const mandateId = Number(resolvedParams.id);
    const { docType } = await req.json();

    const columnMap: Record<string, object> = {
      jd: { jdUrl: null },
      notes: { interviewNotesUrl: null },
      docs: { additionalDocsUrl: null },
    };

    if (!columnMap[docType]) {
      return NextResponse.json({ error: "Invalid docType" }, { status: 400 });
    }

    await db.update(mandates).set(columnMap[docType]).where(eq(mandates.id, mandateId));
    
    // @ts-ignore
    revalidateTag("dashboard-data");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Mandate doc delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
