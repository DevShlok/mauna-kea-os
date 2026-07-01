import { requireRole } from "@/lib/auth";
import { getMandates, getAnalyticsData } from "@/db/queries";
import AnalyticsClient from "@/features/analytics/components/AnalyticsClient";

export default async function AnalyticsPage() {
  await requireRole(["admin", "consultant"]);

  const mandates = await getMandates();
  const data = await getAnalyticsData();
  return <AnalyticsClient initialMandates={mandates} analyticsData={data} />;
}