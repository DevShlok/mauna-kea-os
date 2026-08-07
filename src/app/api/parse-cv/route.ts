import { NextResponse } from "next/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { validateFileUpload, ALLOWED_PDF_ONLY, MAX_DOCUMENT_SIZE_BYTES } from "@/lib/api-guard";

const pdfParse = require("pdf-parse-new");

// Max 10 MB, PDF only
const MAX_BYTES = MAX_DOCUMENT_SIZE_BYTES;

export async function POST(req: Request) {
  // Rate limit: 15 requests per minute per IP
  const rl = rateLimit(req, "parse-cv", { limit: 15, windowMs: 60_000 });
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate MIME type (PDF only) and file size (max 10 MB)
    const check = validateFileUpload(file, {
      allowedTypes: ALLOWED_PDF_ONLY,
      maxBytes: MAX_BYTES,
    });
    if (!check.ok) return check.error;

    const buffer = await file.arrayBuffer();
    const parsedData = await pdfParse(Buffer.from(buffer));

    return NextResponse.json({ text: parsedData.text });
  } catch (error: any) {
    console.error("PDF Parsing Error:", error);
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}
