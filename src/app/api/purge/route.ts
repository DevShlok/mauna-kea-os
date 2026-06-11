import { revalidateTag, revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET() {
  // @ts-ignore
  revalidateTag("dashboard-data");
  revalidatePath("/", "layout");
  return NextResponse.json({ message: "Vercel data cache purged successfully! The newest database data will now be fetched." });
}
