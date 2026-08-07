import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates, candidateFiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  createSupabaseAdmin,
  validateFileUpload,
  ALLOWED_PDF_ONLY,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/api-guard";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit: 10 requests per minute per IP
  const rl = rateLimit(req, "upload-linkedin-pdf", { limit: 10, windowMs: 60_000 });
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  // Service role key is required for storage uploads — fail loudly if missing.
  // Never fall back to the public NEXT_PUBLIC_ key on server-side operations.
  const supabase = createSupabaseAdmin();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const candId = formData.get("candId") as string;

    if (!file || !candId) {
      return NextResponse.json({ error: "File or CandId missing" }, { status: 400 });
    }

    // Validate MIME type (PDF only — LinkedIn export format) and file size (max 10 MB)
    const check = validateFileUpload(file, {
      allowedTypes: ALLOWED_PDF_ONLY,
      maxBytes: MAX_DOCUMENT_SIZE_BYTES,
    });
    if (!check.ok) return check.error;

    const buffer = await file.arrayBuffer();
    const nodeBuffer = Buffer.from(buffer);

    // Upload to Google Drive via Apps Script
    const webhookUrl = process.env.OS_DRIVE_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ error: "OS_DRIVE_WEBHOOK_URL not configured" }, { status: 500 });
    }

    const base64 = nodeBuffer.toString("base64");
    const ext = file.name.split(".").pop() || "pdf";

    // Fetch candidate name for a nice filename
    const candRows = await db.select().from(candidates).where(eq(candidates.id, candId));
    const candName = candRows[0]?.name || candId;
    const filename = `${candName} - LinkedIn.${ext}`;

    const driveRes = await fetch(webhookUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileType: "linkedin",
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

    // Upload to Supabase Storage
    const supabaseFileName = `linkedin/${candId}-${Date.now()}.${ext}`;
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

    // Update DB with Supabase URL
    await db.update(candidates)
      .set({ linkedinPdf: supabaseUrl })
      .where(eq(candidates.id, candId));

    // Also add to history table
    await db.insert(candidateFiles).values({
      candId: candId,
      fileType: 'Linkedin Profile',
      fileName: filename,
      fileUrl: supabaseUrl
    });

    const { floatActivities } = await import("@/db/schema");
    const now = new Date();
    await db.insert(floatActivities).values({
      candId: candId,
      type: "Event (Update Profile)",
      note: `LinkedIn Profile uploaded: ${filename}`,
      consultant: "System",
      date: now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      time: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    });

    // Update Google Sheet (if configured)
    const sheetsWebhook = process.env.OS_SHEETS_WEBHOOK_URL;
    if (sheetsWebhook) {
      try {
        fetch(sheetsWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candId, linkedinPdfUrl: supabaseUrl })
        }).catch(e => console.error("Sheets sync error:", e));
      } catch (err) {
        console.error("Sheets fetch failed:", err);
      }
    }

    return NextResponse.json({ success: true, url: supabaseUrl, path: supabaseUrl });
  } catch (error: any) {
    console.error("LinkedIn PDF Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload LinkedIn PDF: " + error.message }, { status: 500 });
  }
}
