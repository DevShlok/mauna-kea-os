import { requireRole } from "@/lib/auth";
import { getMandates } from "@/db/queries";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import { sql } from "drizzle-orm";
import DashboardClient from "@/features/dashboard/components/DashboardClient";

export default async function DashboardPage() {
  const user = await requireRole(["admin", "consultant"]);

  const mandates = await getMandates();
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(candidates);
  
  return <DashboardClient mandates={mandates} totalCandidates={count} user={user} />;
}