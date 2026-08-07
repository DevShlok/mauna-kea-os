import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  createSupabaseAdmin,
  validateFileUpload,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/api-guard";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit: 10 requests per minute per IP
  const rl = rateLimit(req, "upload-profile-pic", { limit: 10, windowMs: 60_000 });
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

    // Validate MIME type (images only: JPEG, PNG, WebP) and file size (max 5 MB)
    const check = validateFileUpload(file, {
      allowedTypes: ALLOWED_IMAGE_TYPES,
      maxBytes: MAX_IMAGE_SIZE_BYTES,
    });
    if (!check.ok) return check.error;

    const buffer = await file.arrayBuffer();
    const nodeBuffer = Buffer.from(buffer);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";

    const supabaseFileName = `profile-pics/${candId}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('mauna-kea-documents')
      .upload(supabaseFileName, nodeBuffer, {
        contentType: file.type || "image/jpeg",
        upsert: true
      });
      
    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      throw new Error("Supabase upload failed");
    }

    const { data: publicUrlData } = supabase.storage
      .from('mauna-kea-documents')
      .getPublicUrl(supabaseFileName);
      
    const supabaseUrl = publicUrlData.publicUrl;

    // Update DB
    await db.update(candidates)
      .set({ profilePic: supabaseUrl })
      .where(eq(candidates.id, candId));

    return NextResponse.json({ success: true, url: supabaseUrl });
  } catch (error: any) {
    console.error("Profile Pic Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload profile pic: " + error.message }, { status: 500 });
  }
}
