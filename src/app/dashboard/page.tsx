import { getMandates } from "@/db/queries";
import DashboardClient from "@/features/dashboard/components/DashboardClient";

export default async function DashboardPage() {
  const mandates = await getMandates();
  return <DashboardClient mandates={mandates} />;
}