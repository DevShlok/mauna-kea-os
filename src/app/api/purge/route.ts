import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function GET() {
  revalidateTag("dashboard-data");
  return NextResponse.json({ message: "Vercel data cache purged successfully! The newest database data will now be fetched." });
}
