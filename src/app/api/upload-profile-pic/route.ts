import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

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
