import { getMandates } from "@/db/queries";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const mandates = await getMandates();
  return <DashboardClient mandates={mandates} />;
}