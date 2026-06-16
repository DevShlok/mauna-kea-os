import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates, candidateFiles } from "@/db/schema";
import { eq } from "drizzle-orm";

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

    // Update DB with Drive URL
    await db.update(candidates)
      .set({ linkedinPdf: driveUrl })
      .where(eq(candidates.id, candId));

    // Also add to history table
    await db.insert(candidateFiles).values({
      candId: candId,
      fileType: 'Linkedin Profile',
      fileName: filename,
      fileUrl: driveUrl
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
          body: JSON.stringify({ candId, linkedinPdfUrl: driveUrl })
        }).catch(e => console.error("Sheets sync error:", e));
      } catch (err) {
        console.error("Sheets fetch failed:", err);
      }
    }

    return NextResponse.json({ success: true, url: driveUrl, path: driveUrl });
  } catch (error: any) {
    console.error("LinkedIn PDF Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload LinkedIn PDF: " + error.message }, { status: 500 });
  }
}
