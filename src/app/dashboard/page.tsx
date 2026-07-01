import { requireRole } from "@/lib/auth";
import { getMandates } from "@/db/queries";
import DashboardClient from "@/features/dashboard/components/DashboardClient";

export default async function DashboardPage() {
  await requireRole(["admin", "consultant"]);

  const mandates = await getMandates();
  return <DashboardClient mandates={mandates} />;
}