import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { guidanceBlocks } from "@/db/schema";
import { desc } from "drizzle-orm";
import { GuidanceAdminClient } from "@/features/dashboard/components/GuidanceAdminClient";

export default async function AdminGuidancePage() {
  await requireRole(["admin", "consultant"]);

  const blocks = await db
    .select()
    .from(guidanceBlocks)
    .orderBy(desc(guidanceBlocks.createdAt));

  return <GuidanceAdminClient initialBlocks={blocks} />;
}
